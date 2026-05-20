import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, CheckCircle, UploadCloud, AlertCircle, Loader2, Building2, Sparkles, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { parseSigfeFile, type ParseResult } from '@/lib/parser';
import { checkDuplicate, type DuplicateCheck } from '@/lib/db';
import emptyState from '@/assets/empty-state.png';

interface UploadViewProps {
  onNavigateBalance: () => void;
  onDataLoaded: (result: ParseResult, fileName: string, replaceId?: string) => void;
}

type Status = 'idle' | 'reading' | 'parsing' | 'duplicate' | 'done' | 'error';

const steps = [
  { key: 'reading', label: 'Leyendo archivo Excel', desc: 'Procesando bytes del archivo .xls/.xlsx' },
  { key: 'parsing', label: 'Parseando programas', desc: 'Identificando oficinas, programas y subtítulos' },
];

export function UploadView({ onNavigateBalance, onDataLoaded }: UploadViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [stats, setStats] = useState({ oficinas: 0, programas: 0, items: 0, alertas: 0 });
  const [oficinasNames, setOficinasNames] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState<DuplicateCheck | null>(null);
  const [pendingResult, setPendingResult] = useState<{ result: ParseResult; fileName: string } | null>(null);

  const finishUpload = useCallback((result: ParseResult, fName: string, replaceId?: string) => {
    setStats({
      oficinas: result.oficinas.length,
      programas: result.consolidado.programas.length,
      items: result.consolidado.totalItems,
      alertas: result.consolidado.alertas.length,
    });
    setOficinasNames(result.oficinas.map((o) => o.nombre));
    onDataLoaded(result, fName, replaceId);
    setStatus('done');
  }, [onDataLoaded]);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setError('');
    setDuplicate(null);
    setPendingResult(null);
    try {
      setStatus('reading');
      const buffer = await file.arrayBuffer();
      setStatus('parsing');
      await new Promise((r) => setTimeout(r, 600));
      const result = parseSigfeFile(buffer);
      if (result.oficinas.length === 0) throw new Error('No se encontraron datos válidos en el archivo');

      // Check for duplicate
      const dup = await checkDuplicate(result.consolidado.periodo);
      if (dup.isDuplicate) {
        setDuplicate(dup);
        setPendingResult({ result, fileName: file.name });
        setStats({
          oficinas: result.oficinas.length,
          programas: result.consolidado.programas.length,
          items: result.consolidado.totalItems,
          alertas: result.consolidado.alertas.length,
        });
        setStatus('duplicate');
        return;
      }

      finishUpload(result, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar archivo');
      setStatus('error');
    }
  }, [finishUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const statusOrder = ['reading', 'parsing', 'done'];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Upload zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => status === 'idle' && inputRef.current?.click()}
        whileHover={status === 'idle' ? { scale: 1.01 } : {}}
        whileTap={status === 'idle' ? { scale: 0.99 } : {}}
        className={`relative border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all overflow-hidden ${
          dragOver
            ? 'border-primary bg-primary/5 shadow-glow'
            : status === 'idle'
            ? 'border-border hover:border-primary/40 bg-card'
            : 'border-border bg-card pointer-events-none'
        }`}
      >
        <input ref={inputRef} type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="hidden" />
        
        {status === 'idle' ? (
          <div className="p-14">
            <motion.div
              className="relative mx-auto w-20 h-20 mb-5"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl scale-125" />
              <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-primary/20 shadow-sm">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
            </motion.div>
            <p className="text-foreground font-bold text-base">Arrastra el archivo aquí</p>
            <p className="text-muted-foreground text-sm mt-1.5">Balance Presup Consol al XX-XX-XXXX.xls</p>
            <div className="flex items-center justify-center gap-4 mt-5">
              <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">.xls</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">.xlsx</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">SIGFE Raw</span>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <FileSpreadsheet className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-foreground font-semibold text-sm truncate max-w-xs mx-auto">{fileName}</p>
          </div>
        )}
      </motion.div>

      {/* Processing steps */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6 space-y-4">
            {steps.map((step) => {
              const stepIdx = statusOrder.indexOf(step.key);
              const isDone = currentIdx > stepIdx || status === 'done';
              const isActive = currentIdx === stepIdx && status !== 'done' && status !== 'error';
              return (
                <div key={step.key} className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    {isDone ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </motion.div>
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-border" />
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isDone ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                    <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              );
            })}

            {status === 'error' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-destructive bg-danger-light px-4 py-3 rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {status === 'duplicate' && duplicate && pendingResult && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 border-t border-border space-y-3">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Período duplicado</p>
                    <p className="text-[12px] mt-0.5">Ya existe un balance de <strong>{duplicate.existingPeriodo}</strong> subido el {new Date(duplicate.existingDate!).toLocaleDateString('es-CL')}.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { finishUpload(pendingResult.result, pendingResult.fileName, duplicate.existingId); }}
                    className="py-3 px-4 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors"
                  >
                    Reemplazar anterior
                  </button>
                  <button
                    onClick={() => { finishUpload(pendingResult.result, pendingResult.fileName); }}
                    className="py-3 px-4 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    Mantener ambos
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'done' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-border space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { val: stats.oficinas, label: 'Oficinas', color: 'text-primary' },
                    { val: stats.programas, label: 'Programas', color: 'text-primary' },
                    { val: stats.items, label: 'Ítems', color: 'text-primary' },
                    { val: stats.alertas, label: 'Alertas', color: 'text-warning' },
                  ].map((s) => (
                    <motion.div key={s.label} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Oficinas */}
                <div className="bg-muted rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Oficinas detectadas</p>
                  <div className="flex flex-wrap gap-2">
                    {oficinasNames.map((name) => (
                      <span key={name} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-card rounded-lg border border-border text-xs text-foreground font-medium shadow-sm">
                        <Building2 className="w-3 h-3 text-primary" />{name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={onNavigateBalance}
                  className="w-full bg-gradient-to-r from-primary to-teal-500 text-primary-foreground py-3.5 rounded-xl font-semibold text-sm hover:shadow-glow transition-all flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4" />
                  Ver Balance Generado
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty hint when idle */}
      {status === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center text-muted-foreground text-[12px] space-y-1">
          <p>Soporta archivos de <span className="font-semibold">Balance Consolidado</span> y <span className="font-semibold">SIGFE Raw</span></p>
          <p>El procesamiento es 100% local — tus datos no salen del navegador</p>
        </motion.div>
      )}
    </div>
  );
}
