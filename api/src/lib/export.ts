import * as XLSX from "xlsx";
import type { BalanceReport, ProgramaSummary, BalanceItem, ExportConfig } from "./types";

type CellValue = string | number | null;

const DEFAULT_CONFIG: ExportConfig = {
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
};

function fmtMonto(val: number, formato: ExportConfig["formatoMontos"]): number {
  switch (formato) {
    case "miles": return Math.round(val / 1_000);
    case "millones": return Math.round(val / 1_000_000);
    default: return val;
  }
}

function montoLabel(formato: ExportConfig["formatoMontos"]): string {
  switch (formato) {
    case "miles": return "(M$)";
    case "millones": return "(MM$)";
    default: return "($)";
  }
}

function filterReport(report: BalanceReport, config: ExportConfig): ProgramaSummary[] {
  let programas = report.programas;

  // Filter by programa codes
  if (config.programas.length > 0) {
    programas = programas.filter((p) => config.programas.includes(p.codigo));
  }

  // Filter items by tipo and rango avance
  return programas.map((prog) => {
    let items = prog.items;

    if (config.tipo !== "todos") {
      items = items.filter((i) => i.tipo === config.tipo);
    }

    items = items.filter(
      (i) => i.pctAvance >= config.rangoAvance[0] && i.pctAvance <= config.rangoAvance[1]
    );

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
}

function buildResumenSheet(
  programas: ProgramaSummary[],
  report: BalanceReport,
  config: ExportConfig
): XLSX.WorkSheet {
  const ml = montoLabel(config.formatoMontos);
  const rows: CellValue[][] = [
    ["RESUMEN EJECUTIVO — BALANCE PRESUPUESTARIO"],
    [report.oficina],
    [`Período: ${report.periodo}`, null, null, `Generado: ${new Date().toLocaleDateString("es-CL")}`],
    [],
    [`Programa`, `Ítems`, `Presupuesto ${ml}`, `Compromiso ${ml}`, `Saldo ${ml}`, `% Avance`, `Estado`],
  ];

  let totalPpto = 0, totalComp = 0;

  for (const p of programas) {
    const ppto = fmtMonto(p.presupuesto, config.formatoMontos);
    const comp = fmtMonto(p.compromiso, config.formatoMontos);
    const saldo = fmtMonto(p.saldo, config.formatoMontos);
    totalPpto += p.presupuesto;
    totalComp += p.compromiso;

    const estado = p.pctAvance > 100 ? "SOBREGIRADO"
      : p.pctAvance > 90 ? "CRÍTICO"
      : p.pctAvance > 70 ? "NORMAL"
      : "SUB-EJECUTADO";

    rows.push([p.nombre, p.items.length, ppto, comp, saldo, Math.round(p.pctAvance * 10) / 10, estado]);
  }

  rows.push([]);
  const totalSaldo = totalPpto - totalComp;
  const totalPct = totalPpto > 0 ? (totalComp / totalPpto) * 100 : 0;
  rows.push([
    "TOTAL GENERAL",
    programas.reduce((s, p) => s + p.items.length, 0),
    fmtMonto(totalPpto, config.formatoMontos),
    fmtMonto(totalComp, config.formatoMontos),
    fmtMonto(totalSaldo, config.formatoMontos),
    Math.round(totalPct * 10) / 10,
    "",
  ]);

  // KPIs section
  rows.push([], [], ["INDICADORES CLAVE"]);
  rows.push(["Presupuesto total", fmtMonto(totalPpto, config.formatoMontos)]);
  rows.push(["Ejecución global", `${totalPct.toFixed(1)}%`]);
  rows.push(["Saldo disponible", fmtMonto(totalSaldo, config.formatoMontos)]);
  rows.push(["Programas sobre 90%", programas.filter((p) => p.pctAvance > 90).length]);
  rows.push(["Programas bajo 50%", programas.filter((p) => p.pctAvance < 50).length]);
  rows.push(["Total líneas SIGFE", report.totalRows]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 38 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 16 },
  ];
  return ws;
}

function buildDetalleSheet(
  programas: ProgramaSummary[],
  report: BalanceReport,
  config: ExportConfig
): XLSX.WorkSheet {
  const ml = montoLabel(config.formatoMontos);
  const rows: CellValue[][] = [
    ["DETALLE BALANCE PRESUPUESTARIO MENSUAL"],
    [report.oficina, null, null, report.periodo],
    [],
    ["Programa", "Folio", "Título", "Tipo", `Presupuesto ${ml}`, `Compromiso ${ml}`, `Saldo ${ml}`, "% Avance"],
  ];

  let totalPpto = 0, totalComp = 0;

  for (const prog of programas) {
    // Program header
    rows.push([
      prog.nombre, null, null, null,
      fmtMonto(prog.presupuesto, config.formatoMontos),
      fmtMonto(prog.compromiso, config.formatoMontos),
      fmtMonto(prog.saldo, config.formatoMontos),
      Math.round(prog.pctAvance * 10) / 10,
    ]);
    totalPpto += prog.presupuesto;
    totalComp += prog.compromiso;

    for (const item of prog.items) {
      rows.push([
        null,
        item.folio,
        item.titulo,
        item.tipo === "viatico" ? "Viático" : "ByS",
        fmtMonto(item.presupuesto, config.formatoMontos),
        fmtMonto(item.compromiso, config.formatoMontos),
        fmtMonto(item.saldo, config.formatoMontos),
        Math.round(item.pctAvance * 10) / 10,
      ]);
    }
    rows.push([]); // separator
  }

  const totalSaldo = totalPpto - totalComp;
  const totalPct = totalPpto > 0 ? (totalComp / totalPpto) * 100 : 0;
  rows.push([
    "TOTAL GENERAL", null, null, null,
    fmtMonto(totalPpto, config.formatoMontos),
    fmtMonto(totalComp, config.formatoMontos),
    fmtMonto(totalSaldo, config.formatoMontos),
    Math.round(totalPct * 10) / 10,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 38 }, { wch: 8 }, { wch: 48 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
  ];
  return ws;
}

function buildProgramaSheet(
  prog: ProgramaSummary,
  config: ExportConfig
): XLSX.WorkSheet {
  const ml = montoLabel(config.formatoMontos);
  const rows: CellValue[][] = [
    [prog.nombre],
    [`Avance: ${prog.pctAvance.toFixed(1)}%`, null, `Ítems: ${prog.items.length}`],
    [],
    ["Folio", "Título", "Tipo", `Presupuesto ${ml}`, `Compromiso ${ml}`, `Saldo ${ml}`, "% Avance", "Estado"],
  ];

  for (const item of prog.items) {
    const estado = item.pctAvance > 100 ? "SOBREGIRADO"
      : item.pctAvance > 90 ? "CRÍTICO"
      : item.pctAvance > 70 ? "NORMAL"
      : item.pctAvance < 30 ? "SUB-EJECUTADO"
      : "OK";

    rows.push([
      item.folio,
      item.titulo,
      item.tipo === "viatico" ? "Viático" : "ByS",
      fmtMonto(item.presupuesto, config.formatoMontos),
      fmtMonto(item.compromiso, config.formatoMontos),
      fmtMonto(item.saldo, config.formatoMontos),
      Math.round(item.pctAvance * 10) / 10,
      estado,
    ]);
  }

  rows.push([]);
  rows.push([
    null, "SUBTOTAL", null,
    fmtMonto(prog.presupuesto, config.formatoMontos),
    fmtMonto(prog.compromiso, config.formatoMontos),
    fmtMonto(prog.saldo, config.formatoMontos),
    Math.round(prog.pctAvance * 10) / 10,
    null,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 8 }, { wch: 48 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 16 },
  ];
  return ws;
}

function buildAlertasSheet(programas: ProgramaSummary[]): XLSX.WorkSheet {
  const rows: CellValue[][] = [
    ["ALERTAS PRESUPUESTARIAS"],
    [],
    ["Severidad", "Programa", "Folio", "Título", "Tipo", "% Avance", "Presupuesto", "Saldo"],
  ];

  const allItems: { item: BalanceItem; progNombre: string }[] = [];
  for (const p of programas) {
    for (const item of p.items) {
      allItems.push({ item, progNombre: p.nombre });
    }
  }

  // Sobregirados
  const sobregirados = allItems.filter((a) => a.item.pctAvance > 100)
    .sort((a, b) => b.item.pctAvance - a.item.pctAvance);
  const criticos = allItems.filter((a) => a.item.pctAvance > 90 && a.item.pctAvance <= 100)
    .sort((a, b) => b.item.pctAvance - a.item.pctAvance);
  const subejecutados = allItems.filter((a) => a.item.pctAvance < 30)
    .sort((a, b) => a.item.pctAvance - b.item.pctAvance);

  if (sobregirados.length > 0) {
    rows.push([]);
    rows.push(["=== SOBREGIRADOS (>100%) ==="]);
    for (const { item, progNombre } of sobregirados) {
      rows.push([
        "SOBREGIRADO", progNombre, item.folio, item.titulo,
        item.tipo === "viatico" ? "Viático" : "ByS",
        Math.round(item.pctAvance * 10) / 10, item.presupuesto, item.saldo,
      ]);
    }
  }

  if (criticos.length > 0) {
    rows.push([]);
    rows.push(["=== CRÍTICOS (90-100%) ==="]);
    for (const { item, progNombre } of criticos) {
      rows.push([
        "CRÍTICO", progNombre, item.folio, item.titulo,
        item.tipo === "viatico" ? "Viático" : "ByS",
        Math.round(item.pctAvance * 10) / 10, item.presupuesto, item.saldo,
      ]);
    }
  }

  if (subejecutados.length > 0) {
    rows.push([]);
    rows.push(["=== SUB-EJECUTADOS (<30%) ==="]);
    for (const { item, progNombre } of subejecutados) {
      rows.push([
        "SUB-EJECUTADO", progNombre, item.folio, item.titulo,
        item.tipo === "viatico" ? "Viático" : "ByS",
        Math.round(item.pctAvance * 10) / 10, item.presupuesto, item.saldo,
      ]);
    }
  }

  if (sobregirados.length === 0 && criticos.length === 0 && subejecutados.length === 0) {
    rows.push([]);
    rows.push(["Sin alertas con los filtros actuales"]);
  }

  // Summary
  rows.push([], [], ["RESUMEN ALERTAS"]);
  rows.push(["Sobregirados (>100%)", sobregirados.length]);
  rows.push(["Críticos (90-100%)", criticos.length]);
  rows.push(["Sub-ejecutados (<30%)", subejecutados.length]);
  rows.push(["Total alertas", sobregirados.length + criticos.length + subejecutados.length]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 16 }, { wch: 35 }, { wch: 8 }, { wch: 45 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
  ];
  return ws;
}

function buildComparativoSheet(
  programas: ProgramaSummary[],
  config: ExportConfig
): XLSX.WorkSheet {
  const ml = montoLabel(config.formatoMontos);
  const rows: CellValue[][] = [
    ["COMPARATIVO ENTRE PROGRAMAS"],
    [],
    [
      "Programa", `Presupuesto ${ml}`, `Compromiso ${ml}`, `Saldo ${ml}`,
      "% Avance", "% del Ppto Total", "Ítems ByS", "Ítems Viático", "Total Ítems",
    ],
  ];

  const totalPpto = programas.reduce((s, p) => s + p.presupuesto, 0);

  for (const p of programas) {
    const bysCnt = p.items.filter((i) => i.tipo === "bys").length;
    const viatCnt = p.items.filter((i) => i.tipo === "viatico").length;
    const pctTotal = totalPpto > 0 ? (p.presupuesto / totalPpto) * 100 : 0;

    rows.push([
      p.nombre,
      fmtMonto(p.presupuesto, config.formatoMontos),
      fmtMonto(p.compromiso, config.formatoMontos),
      fmtMonto(p.saldo, config.formatoMontos),
      Math.round(p.pctAvance * 10) / 10,
      Math.round(pctTotal * 10) / 10,
      bysCnt,
      viatCnt,
      p.items.length,
    ]);
  }

  // Ranking section
  rows.push([], [], ["RANKING POR EJECUCIÓN"]);
  const sorted = [...programas].sort((a, b) => b.pctAvance - a.pctAvance);
  sorted.forEach((p, i) => {
    rows.push([`${i + 1}. ${p.nombre}`, `${p.pctAvance.toFixed(1)}%`]);
  });

  // ByS vs Viático comparison
  rows.push([], [], ["BIENES Y SERVICIOS vs VIÁTICOS"]);
  rows.push(["Tipo", `Presupuesto ${ml}`, `Compromiso ${ml}`, "% Avance"]);

  const allBys = programas.flatMap((p) => p.items.filter((i) => i.tipo === "bys"));
  const allViat = programas.flatMap((p) => p.items.filter((i) => i.tipo === "viatico"));

  const bysPpto = allBys.reduce((s, i) => s + i.presupuesto, 0);
  const bysComp = allBys.reduce((s, i) => s + i.compromiso, 0);
  const viatPpto = allViat.reduce((s, i) => s + i.presupuesto, 0);
  const viatComp = allViat.reduce((s, i) => s + i.compromiso, 0);

  rows.push([
    "Bienes y Servicios",
    fmtMonto(bysPpto, config.formatoMontos),
    fmtMonto(bysComp, config.formatoMontos),
    bysPpto > 0 ? Math.round((bysComp / bysPpto) * 1000) / 10 : 0,
  ]);
  rows.push([
    "Viáticos",
    fmtMonto(viatPpto, config.formatoMontos),
    fmtMonto(viatComp, config.formatoMontos),
    viatPpto > 0 ? Math.round((viatComp / viatPpto) * 1000) / 10 : 0,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 38 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
  ];
  return ws;
}

export function exportBalanceXlsx(report: BalanceReport, config?: Partial<ExportConfig>) {
  const cfg: ExportConfig = { ...DEFAULT_CONFIG, ...config };
  const wb = XLSX.utils.book_new();

  const programas = filterReport(report, cfg);

  if (cfg.includeResumen) {
    XLSX.utils.book_append_sheet(wb, buildResumenSheet(programas, report, cfg), "Resumen");
  }

  if (cfg.includeDetalle) {
    if (cfg.separarPorPrograma) {
      for (const prog of programas) {
        const sheetName = prog.codigo === "07" ? "PEE" : `CONAF ${prog.codigo}`;
        XLSX.utils.book_append_sheet(wb, buildProgramaSheet(prog, cfg), sheetName);
      }
    } else {
      XLSX.utils.book_append_sheet(wb, buildDetalleSheet(programas, report, cfg), "Detalle");
    }
  }

  if (cfg.includeAlertas) {
    XLSX.utils.book_append_sheet(wb, buildAlertasSheet(programas), "Alertas");
  }

  if (cfg.includeComparativo) {
    XLSX.utils.book_append_sheet(wb, buildComparativoSheet(programas, cfg), "Comparativo");
  }

  // Metadata sheet
  const metaRows: CellValue[][] = [
    ["METADATA"],
    [],
    ["Campo", "Valor"],
    ["Oficina", report.oficina],
    ["Período", report.periodo],
    ["Fecha generación", new Date().toLocaleString("es-CL")],
    ["Líneas SIGFE procesadas", report.totalRows],
    ["Ítems agrupados", report.totalItems],
    ["Filtro programas", cfg.programas.length > 0 ? cfg.programas.join(", ") : "Todos"],
    ["Filtro tipo", cfg.tipo === "todos" ? "Todos" : cfg.tipo === "bys" ? "ByS" : "Viáticos"],
    ["Filtro oficina", cfg.oficina],
    ["Rango avance", `${cfg.rangoAvance[0]}% — ${cfg.rangoAvance[1]}%`],
    ["Formato montos", cfg.formatoMontos],
    ["Hojas por programa", cfg.separarPorPrograma ? "Sí" : "No"],
  ];
  const metaWs = XLSX.utils.aoa_to_sheet(metaRows);
  metaWs["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, metaWs, "Metadata");

  const filtroTag = cfg.programas.length > 0 ? `_P${cfg.programas.join("-")}` : "";
  const tipoTag = cfg.tipo !== "todos" ? `_${cfg.tipo}` : "";
  const fileName = `Balance_CONAF${filtroTag}${tipoTag}_${report.periodo.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
