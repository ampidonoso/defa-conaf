
import { useState, useCallback } from "react";
import { X, Download, FileSpreadsheet, Filter, Layers, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExportConfig, BalanceReport } from "@/lib/types";
import { exportBalanceXlsx } from "@/lib/export";
import { ScrollArea } from "@/components/ui/scroll-area";

const PROGRAMAS_LIST = [
  { codigo: "01", nombre: "CONAF 01 — Corporación Nacional" },
  { codigo: "03", nombre: "CONAF 03 — Manejo del Fuego" },
  { codigo: "04", nombre: "CONAF 04 — Áreas Silvestres" },
  { codigo: "05", nombre: "CONAF 05 — Gestión Forestal" },
  { codigo: "06", nombre: "CONAF 06 — Arborización" },
  { codigo: "07", nombre: "PEE — Programas de Empleos" },
];

const PRESETS: { label: string; desc: string; config: Partial<ExportConfig> }[] = [
  {
    label: "Completo",
    desc: "Todas las hojas, todos los programas",
    config: {},
  },
  {
    label: "Solo alertas",
    desc: "Ítems sobre 90% o bajo 30%",
    config: {
      includeResumen: false,
      includeDetalle: false,
      includeAlertas: true,
      includeComparativo: false,
    },
  },
  {
    label: "Resumen ejecutivo",
    desc: "Resumen + comparativo, en millones",
    config: {
      includeDetalle: false,
      includeAlertas: false,
      formatoMontos: "millones",
    },
  },
  {
    label: "Por programa",
    desc: "Una hoja por cada programa",
    config: {
      separarPorPrograma: true,
    },
  },
  {
    label: "Solo viáticos",
    desc: "Filtrado a viáticos solamente",
    config: {
      tipo: "viatico",
    },
  },
];

interface Props {
  report: BalanceReport;
  open: boolean;
  onClose: () => void;
}

export function ExportModal({ report, open, onClose }: Props) {
  const [config, setConfig] = useState<ExportConfig>({
    programas: [],
    tipo: "todos",
    oficina: "todas",
    rangoAvance: [0, 200],
    includeResumen: true,
    includeDetalle: true,
    includeAlertas: true,
    includeComparativo: true,
    formatoMontos: "pesos",
    incluirGraficos: false,
    separarPorPrograma: false,
  });

  const [activePreset, setActivePreset] = useState<number | null>(null);

  const applyPreset = useCallback((idx: number) => {
    setActivePreset(idx);
    setConfig((prev) => ({
      ...prev,
      programas: [],
      tipo: "todos",
      oficina: "todas",
      rangoAvance: [0, 200],
      includeResumen: true,
      includeDetalle: true,
      includeAlertas: true,
      includeComparativo: true,
      formatoMontos: "pesos",
      incluirGraficos: false,
      separarPorPrograma: false,
      ...PRESETS[idx].config,
    }));
  }, []);

  const togglePrograma = useCallback((codigo: string) => {
    setActivePreset(null);
    setConfig((prev) => ({
      ...prev,
      programas: prev.programas.includes(codigo)
        ? prev.programas.filter((c) => c !== codigo)
        : [...prev.programas, codigo],
    }));
  }, []);

  const handleExport = useCallback(() => {
    exportBalanceXlsx(report, config);
    onClose();
  }, [report, config, onClose]);

  if (!open) return null;

  const sheetCount = [
    config.includeResumen,
    config.includeDetalle && !config.separarPorPrograma,
    config.includeDetalle && config.separarPorPrograma && report.programas.length,
    config.includeAlertas,
    config.includeComparativo,
    true,
  ].flat().filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col mx-0 sm:mx-4 border border-border/50">
        {/* Header — sticky */}
        <div className="shrink-0 bg-card border-b border-border px-5 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Exportar Balance</h2>
              <p className="text-xs text-muted-foreground">{report.periodo} — {report.oficina}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 sm:p-6 space-y-6">
            {/* Presets */}
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Settings2 className="w-4 h-4" />
                Presets rápidos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(i)}
                    className={cn(
                      "text-left px-3 py-2.5 rounded-xl border text-sm transition-all",
                      activePreset === i
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-border/80 hover:bg-muted/50"
                    )}
                  >
                    <p className="font-medium text-foreground">{preset.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Programas filter */}
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4" />
                Programas
                <span className="text-xs font-normal text-muted-foreground">
                  {config.programas.length === 0 ? "(todos)" : `(${config.programas.length} seleccionados)`}
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROGRAMAS_LIST.map((p) => (
                  <label
                    key={p.codigo}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-all",
                      config.programas.includes(p.codigo)
                        ? "border-primary/30 bg-primary/5"
                        : config.programas.length === 0
                          ? "border-border bg-muted/30"
                          : "border-border bg-card opacity-60"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={config.programas.length === 0 || config.programas.includes(p.codigo)}
                      onChange={() => togglePrograma(p.codigo)}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    <span className="text-foreground text-[13px]">{p.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Type + Avance range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Tipo de gasto</label>
                <div className="space-y-1.5">
                  {(["todos", "bys", "viatico"] as const).map((t) => (
                    <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        checked={config.tipo === t}
                        onChange={() => { setActivePreset(null); setConfig((p) => ({ ...p, tipo: t })); }}
                        className="accent-emerald-600"
                      />
                      <span className="text-foreground">
                        {t === "todos" ? "Todos" : t === "bys" ? "Bienes y Servicios" : "Viáticos"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Rango de avance
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={config.rangoAvance[0]}
                    onChange={(e) => {
                      setActivePreset(null);
                      setConfig((p) => ({ ...p, rangoAvance: [Number(e.target.value), p.rangoAvance[1]] }));
                    }}
                    className="w-20 px-2 py-1.5 border border-border rounded-lg text-sm text-center bg-card text-foreground"
                  />
                  <span className="text-muted-foreground text-sm">% a</span>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={config.rangoAvance[1]}
                    onChange={(e) => {
                      setActivePreset(null);
                      setConfig((p) => ({ ...p, rangoAvance: [p.rangoAvance[0], Number(e.target.value)] }));
                    }}
                    className="w-20 px-2 py-1.5 border border-border rounded-lg text-sm text-center bg-card text-foreground"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: "Críticos", range: [90, 200] as [number, number] },
                    { label: "Normal", range: [50, 90] as [number, number] },
                    { label: "Bajos", range: [0, 30] as [number, number] },
                    { label: "Todos", range: [0, 200] as [number, number] },
                  ].map((r) => (
                    <button
                      key={r.label}
                      onClick={() => { setActivePreset(null); setConfig((p) => ({ ...p, rangoAvance: r.range })); }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sheets */}
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4" />
                Hojas del Excel
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "includeResumen" as const, label: "Resumen ejecutivo", desc: "KPIs + tabla resumen" },
                  { key: "includeDetalle" as const, label: "Detalle completo", desc: "Todas las líneas por programa" },
                  { key: "includeAlertas" as const, label: "Alertas", desc: "Sobregirados, críticos, sub-ejecutados" },
                  { key: "includeComparativo" as const, label: "Comparativo", desc: "Ranking + ByS vs Viáticos" },
                ].map((sheet) => (
                  <label
                    key={sheet.key}
                    className={cn(
                      "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-all",
                      config[sheet.key]
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={config[sheet.key]}
                      onChange={() => {
                        setActivePreset(null);
                        setConfig((p) => ({ ...p, [sheet.key]: !p[sheet.key] }));
                      }}
                      className="accent-emerald-600 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-foreground">{sheet.label}</p>
                      <p className="text-xs text-muted-foreground">{sheet.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Format options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Formato montos</label>
                <div className="space-y-1.5">
                  {(["pesos", "miles", "millones"] as const).map((f) => (
                    <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="formato"
                        checked={config.formatoMontos === f}
                        onChange={() => { setActivePreset(null); setConfig((p) => ({ ...p, formatoMontos: f })); }}
                        className="accent-emerald-600"
                      />
                      <span className="text-foreground">
                        {f === "pesos" ? "Pesos ($)" : f === "miles" ? "Miles (M$)" : "Millones (MM$)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Opciones</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.separarPorPrograma}
                    onChange={() => {
                      setActivePreset(null);
                      setConfig((p) => ({ ...p, separarPorPrograma: !p.separarPorPrograma }));
                    }}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <span className="text-foreground">Una hoja por programa</span>
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer — sticky */}
        <div className="shrink-0 bg-card border-t border-border px-5 sm:px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <p className="text-xs text-muted-foreground">
            {sheetCount} hojas — {config.formatoMontos === "pesos" ? "$" : config.formatoMontos === "miles" ? "M$" : "MM$"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-teal-500 text-primary-foreground rounded-xl text-sm font-semibold hover:shadow-glow transition-all"
            >
              <Download className="w-4 h-4" />
              Descargar .xlsx
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
