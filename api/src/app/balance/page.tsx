"use client";

import { Fragment, useState, useMemo } from "react";
import { useAppState } from "@/lib/store";
import { formatCLP, pctColor, cn } from "@/lib/utils";
import { Download, Table, Filter } from "lucide-react";
import { ExportModal } from "@/components/export-modal";
import type { ProgramaSummary } from "@/lib/types";

export default function BalancePage() {
  const { report, parseResult } = useAppState();
  const [oficina, setOficina] = useState("consolidado");
  const [filterTipo, setFilterTipo] = useState<"todos" | "bys" | "viatico">("todos");
  const [exportOpen, setExportOpen] = useState(false);

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Sube un archivo SIGFE para ver el balance</p>
      </div>
    );
  }

  // Build oficina tabs dynamically from parsed data
  const oficinaTabs = useMemo(() => {
    const tabs = [{ key: "consolidado", label: "Consolidado" }];
    if (parseResult) {
      for (const o of parseResult.oficinas) {
        tabs.push({ key: o.nombre, label: o.nombre });
      }
    }
    return tabs;
  }, [parseResult]);

  // Get programas for selected oficina
  const baseProgramas: ProgramaSummary[] = useMemo(() => {
    if (oficina === "consolidado" || !parseResult) {
      return report.programas;
    }
    const found = parseResult.oficinas.find((o) => o.nombre === oficina);
    return found ? found.programas : report.programas;
  }, [oficina, parseResult, report.programas]);

  // Filter items by type
  const filteredProgramas = baseProgramas.map((prog) => {
    const items = filterTipo === "todos"
      ? prog.items
      : prog.items.filter((i) => i.tipo === filterTipo);
    const presupuesto = items.reduce((s, i) => s + i.presupuesto, 0);
    const compromiso = items.reduce((s, i) => s + i.compromiso, 0);
    return {
      ...prog,
      items,
      presupuesto,
      compromiso,
      saldo: presupuesto - compromiso,
      pctAvance: presupuesto > 0 ? (compromiso / presupuesto) * 100 : 0,
    };
  }).filter((p) => p.items.length > 0);

  const totalPpto = filteredProgramas.reduce((s, p) => s + p.presupuesto, 0);
  const totalComp = filteredProgramas.reduce((s, p) => s + p.compromiso, 0);
  const totalSaldo = totalPpto - totalComp;
  const totalPct = totalPpto > 0 ? (totalComp / totalPpto) * 100 : 0;

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Presupuestario Mensual</h1>
          <p className="text-gray-500 mt-1">
            {report.oficina} — {report.periodo}
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exportar .xlsx
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Office tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {oficinaTabs.map((o) => (
            <button
              key={o.key}
              onClick={() => setOficina(o.key)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                oficina === o.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {(["todos", "bys", "viatico"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
                filterTipo === t
                  ? t === "viatico"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              )}
            >
              {t === "todos" ? "Todos" : t === "bys" ? "ByS" : "Viáticos"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Presupuesto", value: formatCLP(totalPpto), color: "border-l-emerald-500" },
          { label: "Compromiso", value: formatCLP(totalComp), color: "border-l-blue-500" },
          { label: "Saldo", value: formatCLP(totalSaldo), color: "border-l-amber-500" },
          { label: "Avance", value: `${totalPct.toFixed(1)}%`, color: "border-l-gray-500" },
        ].map((item) => (
          <div
            key={item.label}
            className={cn("bg-white border border-l-4 rounded-lg px-4 py-3", item.color)}
          >
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-lg font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Table by program */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-16">Folio</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Título</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-20">Tipo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 w-36">Presupuesto</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 w-36">Compromiso</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 w-36">Saldo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 w-24">% Avance</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgramas.map((prog) => (
                <Fragment key={prog.codigo}>
                  {/* Program header */}
                  <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                    <td colSpan={3} className="px-4 py-2.5 font-bold text-emerald-900">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        {prog.nombre}
                      </div>
                    </td>
                    <td className="text-right px-4 py-2.5 font-bold text-emerald-900 font-mono text-xs">
                      {formatCLP(prog.presupuesto)}
                    </td>
                    <td className="text-right px-4 py-2.5 font-bold text-emerald-900 font-mono text-xs">
                      {formatCLP(prog.compromiso)}
                    </td>
                    <td className="text-right px-4 py-2.5 font-bold text-emerald-900 font-mono text-xs">
                      {formatCLP(prog.saldo)}
                    </td>
                    <td className="text-right px-4 py-2.5">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold",
                          pctColor(prog.pctAvance)
                        )}
                      >
                        {prog.pctAvance.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                  {/* Items */}
                  {prog.items.map((item, idx) => (
                    <tr
                      key={`${prog.codigo}-${item.folio}-${item.tipo}-${idx}`}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-gray-500 text-center">{item.folio}</td>
                      <td className="px-4 py-2.5 text-gray-900">{item.titulo}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            item.tipo === "viatico"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {item.tipo === "viatico" ? "Viático" : "ByS"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                        {formatCLP(item.presupuesto)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                        {formatCLP(item.compromiso)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                        {formatCLP(item.saldo)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-semibold",
                            pctColor(item.pctAvance)
                          )}
                        >
                          {item.pctAvance.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}

              {/* Totals row */}
              <tr className="bg-gray-900 text-white font-bold">
                <td colSpan={3} className="px-4 py-3">TOTAL GENERAL</td>
                <td className="text-right px-4 py-3 font-mono text-sm">{formatCLP(totalPpto)}</td>
                <td className="text-right px-4 py-3 font-mono text-sm">{formatCLP(totalComp)}</td>
                <td className="text-right px-4 py-3 font-mono text-sm">{formatCLP(totalSaldo)}</td>
                <td className="text-right px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-white/20">
                    {totalPct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal report={report} open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
