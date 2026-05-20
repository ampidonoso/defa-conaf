import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileUp, CheckCircle, UploadCloud, AlertCircle, Loader2, Building2,
  Sparkles, FileSpreadsheet, ArrowRight, Plus, X, Layers, Zap,
} from 'lucide-react';
import { parseSigfeFile, type ParseResult } from '@/lib/parser';
import { checkDuplicate, type DuplicateCheck } from '@/lib/db';

const OFICINAS = [
  { id: 'regional', label: 'Regional', desc: 'Dirección Regional' },
  { id: 'valdivia', label: 'Valdivia', desc: 'Provincia Valdivia' },
  { id: 'panguipulli', label: 'Panguipulli', desc: 'Área Panguipulli' },
  { id: 'ranco', label: 'Ranco', desc: 'Provincia Ranco' },
];

interface FileSlot {
  oficina: string;
  file: File | null;
  result: ParseResult | null;
  status: 'empty' | 'loaded' | 'error';
  error?: string;
}

interface Props {
  onNavigateBalance: () => void;
  onDataLoaded: (result: ParseResult, fileName: string, replaceId?: string) => void;
}

export function MultiUploadView({ onNavigateBalance, onDataLoaded }: Props) {
  const [mode, setMode] = useState<'choose' | 'multi' | 'processing' | 'duplicate' | 'done'>('choose');
  const [slots, setSlots] = useState<FileSlot[]>(
    OFICINAS.map((o) => ({ oficina: o.id, file: null, result: null, status: 'empty' }))
  );
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [consolidatedResult, setConsolidatedResult] = useState<ParseResult | null>(null);
  const [stats, setStats] = useState({ oficinas: 0, programas: 0, items: 0, alertas: 0 });
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState<DuplicateCheck | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Process a single file for a specific slot
  const processSlotFile = useCallback(async (slotIdx: number, file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const result = parseSigfeFile(buffer);
      setSlots((prev) => {
        const next = [...prev];
        next[slotIdx] = { ...next[slotIdx], file, result, status: 'loaded' };
        return next;
      });
    } catch (err) {
      setSlots((prev) => {
        const next = [...prev];
        next[slotIdx] = { ...next[slotIdx], file, result: null, status: 'error', error: err instanceof Error ? err.message : 'Error' };
        return next;
      });
    }
  }, []);

  // Consolidate all loaded slots into one ParseResult
  const consolidateAll = useCallback(async () => {
    setMode('processing');
    setError('');

    try {
      const loadedSlots = slots.filter((s) => s.status === 'loaded' && s.result);

      if (loadedSlots.length === 0) {
        setError('No hay archivos cargados');
        setMode('multi');
        return;
      }

      // Merge all oficinas and programas
      const allOficinas: ParseResult['oficinas'] = [];
      for (const slot of loadedSlots) {
        const oficina = OFICINAS.find((o) => o.id === slot.oficina);
        // Rename the oficina to the label
        for (const ofi of slot.result!.oficinas) {
          allOficinas.push({
            nombre: oficina?.label.toUpperCase() || ofi.nombre,
            programas: ofi.programas,
          });
        }
      }

      // Build consolidated programas (merge by code)
      const progMap = new Map<string, any>();
      for (const ofi of allOficinas) {
        for (const prog of ofi.programas) {
          if (progMap.has(prog.codigo)) {
            const existing = progMap.get(prog.codigo)!;
            existing.items.push(...prog.items);
            existing.presupuesto += prog.presupuesto;
            existing.compromiso += prog.compromiso;
            existing.saldo += prog.saldo;
            existing.pctAvance = existing.presupuesto > 0 ? (existing.compromiso / existing.presupuesto) * 100 : 0;
          } else {
            progMap.set(prog.codigo, { ...prog, items: [...prog.items] });
          }
        }
      }

      const programas = [...progMap.values()].sort((a: any, b: any) => a.codigo.localeCompare(b.codigo));
      const totalPpto = programas.reduce((s: number, p: any) => s + p.presupuesto, 0);
      const totalComp = programas.reduce((s: number, p: any) => s + p.compromiso, 0);
      const totalItems = programas.reduce((s: number, p: any) => s + p.items.length, 0);

      // Build alerts
      const alertas: any[] = [];
      for (const p of programas) {
        for (const item of p.items) {
          if (item.pctAvance > 100) alertas.push({ tipo: 'sobregirado', programa: p.codigo, folio: item.folio, titulo: item.titulo, pct: item.pctAvance, mensaje: `${item.titulo} sobregirado: ${item.pctAvance.toFixed(1)}%` });
          else if (item.pctAvance > 90) alertas.push({ tipo: 'alto', programa: p.codigo, folio: item.folio, titulo: item.titulo, pct: item.pctAvance, mensaje: `${item.titulo} al ${item.pctAvance.toFixed(1)}%` });
        }
        if (p.pctAvance < 30) alertas.push({ tipo: 'bajo', programa: p.codigo, titulo: p.nombre, pct: p.pctAvance, mensaje: `${p.nombre} sub-ejecutado: ${p.pctAvance.toFixed(1)}%` });
      }

      // Build period from first file
      const firstResult = loadedSlots[0].result!;
      const periodo = firstResult.consolidado.periodo || new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

      const consolidated: ParseResult = {
        oficinas: allOficinas,
        consolidado: {
          oficina: 'Región de Los Ríos',
          periodo,
          fechaGeneracion: new Date().toISOString(),
          totalPresupuesto: totalPpto,
          totalCompromiso: totalComp,
          totalSaldo: totalPpto - totalComp,
          pctAvanceGlobal: totalPpto > 0 ? (totalComp / totalPpto) * 100 : 0,
          programas,
          alertas: alertas.sort((a: any, b: any) => b.pct - a.pct),
          totalRows: totalItems,
          totalItems,
        },
        validation: {
          format: 'sigfe-raw',
          sheetsProcessed: loadedSlots.length,
          sheetsSkipped: [],
          totalDataRows: totalItems,
          warnings: [],
        },
      };

      setConsolidatedResult(consolidated);
      setStats({
        oficinas: allOficinas.length,
        programas: programas.length,
        items: totalItems,
        alertas: alertas.length,
      });

      // Check for duplicate
      const dup = await checkDuplicate(periodo);
      if (dup.isDuplicate) {
        setDuplicate(dup);
        setMode('duplicate');
        return;
      }

      const fileNames = loadedSlots.map((s) => s.file!.name).join(' + ');
      onDataLoaded(consolidated, fileNames);
      setMode('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consolidar');
      setMode('multi');
    }
  }, [slots, onDataLoaded]);

  // Single file upload (existing flow)
  const processSingleFile = useCallback(async (file: File) => {
    setSingleFile(file);
    setMode('processing');
    try {
      const buffer = await file.arrayBuffer();
      const result = parseSigfeFile(buffer);
      if (result.oficinas.length === 0) throw new Error('No se encontraron datos válidos');
      setConsolidatedResult(result);
      setStats({
        oficinas: result.oficinas.length,
        programas: result.consolidado.programas.length,
        items: result.consolidado.totalItems,
        alertas: result.consolidado.alertas.length,
      });

      const dup = await checkDuplicate(result.consolidado.periodo);
      if (dup.isDuplicate) {
        setDuplicate(dup);
        setMode('duplicate');
        return;
      }

      onDataLoaded(result, file.name);
      setMode('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setMode('choose');
    }
  }, [onDataLoaded]);

  const handleDuplicateChoice = (replace: boolean) => {
    if (!consolidatedResult) return;
    const fileNames = mode === 'duplicate' && singleFile ? singleFile.name : slots.filter((s) => s.file).map((s) => s.file!.name).join(' + ');
    onDataLoaded(consolidatedResult, fileNames, replace ? duplicate?.existingId : undefined);
    setMode('done');
  };

  const loadedCount = slots.filter((s) => s.status === 'loaded').length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Mode chooser */}
      {mode === 'choose' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="text-center mb-6">
            <Layers className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-bold text-foreground">Importar datos SIGFE</h2>
            <p className="text-sm text-muted-foreground mt-1">Elige cómo quieres cargar los datos</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Multi-file option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('multi')}
              className="card-premium p-6 text-left hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Múltiples archivos SIGFE</p>
                  <p className="text-[10px] text-primary font-semibold uppercase">Recomendado</p>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Sube un archivo SIGFE por cada oficina (Regional, Valdivia, Panguipulli, Ranco) y la app los consolida automáticamente.
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-primary text-[11px] font-semibold group-hover:gap-2 transition-all">
                <Zap className="w-3.5 h-3.5" />
                Consolidación automática
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.button>

            {/* Single file option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => inputRef.current?.click()}
              className="card-premium p-6 text-left hover:border-border transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-muted">
                  <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Archivo único</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Balance Consol o SIGFE</p>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Sube un Balance Consolidado (ya armado con 4 hojas) o un único archivo SIGFE raw.
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-muted-foreground text-[11px] font-semibold group-hover:gap-2 transition-all">
                <UploadCloud className="w-3.5 h-3.5" />
                Subir archivo
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.button>
          </div>

        </motion.div>
      )}

      {/* Always-mounted file input (avoids blank screen when mode changes before ref resolves) */}
      <input ref={inputRef} type="file" accept=".xls,.xlsx" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processSingleFile(f); e.target.value = ''; }} />

      {/* Multi-file upload */}
      {mode === 'multi' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Archivos SIGFE por oficina</h3>
              <p className="text-[11px] text-muted-foreground">{loadedCount} de {OFICINAS.length} cargados</p>
            </div>
            <button onClick={() => setMode('choose')} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {slots.map((slot, idx) => {
            const oficina = OFICINAS.find((o) => o.id === slot.oficina)!;
            return (
              <motion.div
                key={slot.oficina}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`card-premium p-4 ${slot.status === 'loaded' ? 'border-primary/20 bg-primary/[0.02]' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${slot.status === 'loaded' ? 'bg-primary/10' : 'bg-muted'}`}>
                    {slot.status === 'loaded' ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : (
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-foreground">{oficina.label}</p>
                    {slot.status === 'loaded' ? (
                      <p className="text-[10px] text-primary truncate">{slot.file?.name} — {slot.result?.consolidado.totalItems} ítems</p>
                    ) : slot.status === 'error' ? (
                      <p className="text-[10px] text-red-500">{slot.error}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">{oficina.desc}</p>
                    )}
                  </div>
                  <label className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                    slot.status === 'loaded'
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                    {slot.status === 'loaded' ? 'Cambiar' : 'Seleccionar'}
                    <input type="file" accept=".xls,.xlsx" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) processSlotFile(idx, f); }} />
                  </label>
                </div>
              </motion.div>
            );
          })}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}

          <button
            onClick={consolidateAll}
            disabled={loadedCount === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-teal-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Consolidar {loadedCount} oficina{loadedCount !== 1 ? 's' : ''} en un Balance
          </button>
        </motion.div>
      )}

      {/* Processing */}
      {mode === 'processing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-foreground">Procesando y consolidando...</p>
          <p className="text-[11px] text-muted-foreground mt-1">Agrupando programas, separando ByS y Viáticos</p>
        </motion.div>
      )}

      {/* Duplicate */}
      {mode === 'duplicate' && duplicate && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6 space-y-4">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Período duplicado</p>
              <p className="text-[12px] mt-0.5">Ya existe un balance de <strong>{duplicate.existingPeriodo}</strong>.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleDuplicateChoice(true)}
              className="py-3 px-4 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors">
              Reemplazar anterior
            </button>
            <button onClick={() => handleDuplicateChoice(false)}
              className="py-3 px-4 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
              Mantener ambos
            </button>
          </div>
        </motion.div>
      )}

      {/* Done */}
      {mode === 'done' && consolidatedResult && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6 space-y-4">
          <div className="text-center">
            <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-lg font-bold text-foreground">Balance generado</p>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { val: stats.oficinas, label: 'Oficinas', color: 'text-primary' },
              { val: stats.programas, label: 'Programas', color: 'text-primary' },
              { val: stats.items, label: 'Ítems', color: 'text-primary' },
              { val: stats.alertas, label: 'Alertas', color: 'text-amber-600' },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={onNavigateBalance}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-teal-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all">
            <Sparkles className="w-4 h-4" />
            Ver Balance Generado
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
