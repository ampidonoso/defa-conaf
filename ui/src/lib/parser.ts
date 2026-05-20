import * as XLSX from "xlsx";
import type { BalanceItem, ProgramaSummary, BalanceReport, Alerta } from "./types";

type RawRow = (string | number | null | undefined)[];

interface OficinaData {
  nombre: string;
  programas: ProgramaSummary[];
}

const PROGRAMA_PATTERNS: { pattern: RegExp; codigo: string; nombre: string }[] = [
  { pattern: /^CONAF\s*01/i, codigo: "01", nombre: "CONAF 01 — Dirección-DEFA" },
  { pattern: /^PEE/i, codigo: "PEE", nombre: "PEE — Prog. Empleos" },
  { pattern: /^CONAF\s*03/i, codigo: "03", nombre: "CONAF 03 — DEPRIF" },
  { pattern: /^CONAF\s*04/i, codigo: "04", nombre: "CONAF 04 — DASP" },
  // P05 GBCC/DEFOR must match before generic P05
  { pattern: /^CONAF\s*05.*GBCC/i, codigo: "05-GBCC", nombre: "CONAF 05 — Dpto. Forestal" },
  { pattern: /^CONAF\s*05.*DEFOR/i, codigo: "05-GBCC", nombre: "CONAF 05 — Dpto. Forestal" },
  { pattern: /^CONAF\s*05.*FISCAL/i, codigo: "05-FISC", nombre: "CONAF 05 — Dpto. Fiscalización" },
  { pattern: /^CONAF\s*05/i, codigo: "05", nombre: "CONAF 05" },
  { pattern: /^CONAF\s*06/i, codigo: "06", nombre: "CONAF 06 — Arborización" },
  { pattern: /PUMILLAHUE/i, codigo: "PUMI", nombre: "Pumillahue" },
];

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function isHeaderRow(row: RawRow): boolean {
  if (!row || !row[0]) return false;
  const second = row[1] ? String(row[1]).trim().toUpperCase() : "";
  if (second === "UE") return true;
  // Also match rows where col 1 says "Estructura..." or "Estruc..."
  if (second.startsWith("ESTRUC") || second.startsWith("ESTRUCTURA")) return true;
  // Rows that have "PRESUPUESTO" in money columns are section headers
  if (typeof row[7] === "string" && String(row[7]).toUpperCase().includes("PRESUPUESTO")) return true;
  // First row with "BIENES Y SERVICIOS" or "VIATICOS" in money cols
  if (typeof row[7] === "string" && String(row[7]).toUpperCase().includes("BIENES")) return true;
  return false;
}

function isTotalRow(row: RawRow): boolean {
  if (!row || !row[0]) return false;
  const first = String(row[0]).trim().toUpperCase();
  return first.startsWith("TOTAL ") || first.startsWith("PPTO ") || first.startsWith("PPTO.");
}

function isProgramaHeader(row: RawRow): string | null {
  if (!row || !row[0]) return null;
  const first = String(row[0]).trim();

  // Check if next row or this row signals a new programa block
  for (const p of PROGRAMA_PATTERNS) {
    if (p.pattern.test(first)) return first;
  }
  return null;
}

function detectPrograma(headerText: string): { codigo: string; nombre: string } {
  for (const p of PROGRAMA_PATTERNS) {
    if (p.pattern.test(headerText)) {
      return { codigo: p.codigo, nombre: p.nombre };
    }
  }
  return { codigo: "?", nombre: headerText };
}

function isDataRow(row: RawRow): boolean {
  if (!row || !row[0]) return false;
  if (isTotalRow(row)) return false;
  if (isHeaderRow(row)) return false;
  // Data rows must have at least one numeric value in money columns (7,8,11,12)
  const hasMoneyData = [7, 8, 11, 12].some(
    (i) => row[i] !== undefined && row[i] !== null && typeof row[i] === "number"
  );
  if (!hasMoneyData) return false;
  // Extra guard: skip if col 0 looks like a programa header without data
  const first = String(row[0]).trim().toUpperCase();
  if (/^CONAF\s*\d/i.test(first) && typeof row[1] !== "number") return false;
  return true;
}

function parseSheet(ws: XLSX.WorkSheet): OficinaData | null {
  const raw = XLSX.utils.sheet_to_json<RawRow>(ws, { header: 1 });
  if (raw.length < 3) return null;

  // Row 0 = office name
  const nombre = String(raw[0]?.[0] || "").replace(/,.*$/, "").trim();
  if (!nombre) return null;

  const programas: ProgramaSummary[] = [];
  let currentPrograma: { codigo: string; nombre: string } | null = null;
  let currentItems: BalanceItem[] = [];

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[0] || "").trim();

    // Check for programa header (either the programa name row or the column header row)
    const progHeader = isProgramaHeader(row);
    if (progHeader && !isHeaderRow(row)) {
      // If we had a previous programa, save it
      if (currentPrograma && currentItems.length > 0) {
        const ppto = currentItems.reduce((s, it) => s + it.presupuesto, 0);
        const comp = currentItems.reduce((s, it) => s + it.compromiso, 0);
        programas.push({
          codigo: currentPrograma.codigo,
          nombre: currentPrograma.nombre,
          presupuesto: ppto,
          compromiso: comp,
          saldo: ppto - comp,
          pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0,
          items: currentItems,
        });
      }
      currentPrograma = detectPrograma(progHeader);
      currentItems = [];
      continue;
    }

    // If it's a column header row, detect the programa from it
    if (isHeaderRow(row)) {
      const headerProg = isProgramaHeader(row);
      if (headerProg) {
        if (currentPrograma && currentItems.length > 0) {
          const ppto = currentItems.reduce((s, it) => s + it.presupuesto, 0);
          const comp = currentItems.reduce((s, it) => s + it.compromiso, 0);
          programas.push({
            codigo: currentPrograma.codigo,
            nombre: currentPrograma.nombre,
            presupuesto: ppto,
            compromiso: comp,
            saldo: ppto - comp,
            pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0,
            items: currentItems,
          });
        }
        currentPrograma = detectPrograma(headerProg);
        currentItems = [];
      }
      continue;
    }

    // Total row - use it to finalize the current programa with official totals
    if (isTotalRow(row) && currentPrograma) {
      // Build items if we have them, otherwise create a single-item program from the total
      if (currentItems.length > 0) {
        const ppto = currentItems.reduce((s, it) => s + it.presupuesto, 0);
        const comp = currentItems.reduce((s, it) => s + it.compromiso, 0);
        programas.push({
          codigo: currentPrograma.codigo,
          nombre: currentPrograma.nombre,
          presupuesto: ppto,
          compromiso: comp,
          saldo: ppto - comp,
          pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0,
          items: currentItems,
        });
      }
      currentPrograma = null;
      currentItems = [];
      continue;
    }

    // Data row
    if (currentPrograma && isDataRow(row)) {
      const titulo = firstCell;
      const sigfe = num(row[6]);

      const bysPpto = num(row[7]);
      const bysComp = num(row[8]);
      const bysSaldo = num(row[9]);
      const bysPct = num(row[10]);

      const viatPpto = num(row[11]);
      const viatComp = num(row[12]);
      const viatSaldo = num(row[13]);
      const viatPct = num(row[14]);

      if (bysPpto > 0 || bysComp > 0) {
        currentItems.push({
          folio: sigfe,
          titulo,
          programa: currentPrograma.codigo,
          programaCodigo: currentPrograma.codigo,
          tipo: "bys",
          presupuesto: bysPpto,
          compromiso: bysComp,
          saldo: bysSaldo || bysPpto - bysComp,
          pctAvance: bysPct > 0 ? bysPct * 100 : bysPpto > 0 ? (bysComp / bysPpto) * 100 : 0,
        });
      }

      if (viatPpto > 0 || viatComp > 0) {
        currentItems.push({
          folio: sigfe,
          titulo,
          programa: currentPrograma.codigo,
          programaCodigo: currentPrograma.codigo,
          tipo: "viatico",
          presupuesto: viatPpto,
          compromiso: viatComp,
          saldo: viatSaldo || viatPpto - viatComp,
          pctAvance: viatPct > 0 ? viatPct * 100 : viatPpto > 0 ? (viatComp / viatPpto) * 100 : 0,
        });
      }
    }
  }

  // Flush last programa if not closed by TOTAL row
  if (currentPrograma && currentItems.length > 0) {
    const ppto = currentItems.reduce((s, it) => s + it.presupuesto, 0);
    const comp = currentItems.reduce((s, it) => s + it.compromiso, 0);
    programas.push({
      codigo: currentPrograma.codigo,
      nombre: currentPrograma.nombre,
      presupuesto: ppto,
      compromiso: comp,
      saldo: ppto - comp,
      pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0,
      items: currentItems,
    });
  }

  if (programas.length === 0) return null;
  return { nombre, programas };
}

function buildAlerts(programas: ProgramaSummary[]): Alerta[] {
  const alertas: Alerta[] = [];

  for (const prog of programas) {
    for (const item of prog.items) {
      if (item.pctAvance > 100) {
        alertas.push({
          tipo: "sobregirado",
          programa: prog.codigo,
          folio: item.folio,
          titulo: `${item.titulo} (${item.tipo === "viatico" ? "Viático" : "ByS"})`,
          pct: item.pctAvance,
          mensaje: `${item.titulo} sobregirado: ${item.pctAvance.toFixed(1)}%`,
        });
      } else if (item.pctAvance > 90) {
        alertas.push({
          tipo: "alto",
          programa: prog.codigo,
          folio: item.folio,
          titulo: `${item.titulo} (${item.tipo === "viatico" ? "Viático" : "ByS"})`,
          pct: item.pctAvance,
          mensaje: `${item.titulo} al ${item.pctAvance.toFixed(1)}%`,
        });
      }
    }

    if (prog.pctAvance < 30) {
      alertas.push({
        tipo: "bajo",
        programa: prog.codigo,
        titulo: prog.nombre,
        pct: prog.pctAvance,
        mensaje: `${prog.nombre} sub-ejecutado: ${prog.pctAvance.toFixed(1)}%`,
      });
    }
  }

  return alertas.sort((a, b) => b.pct - a.pct);
}

export interface ParseValidation {
  format: FileFormat;
  sheetsProcessed: number;
  sheetsSkipped: string[];
  totalDataRows: number;
  warnings: string[];
}

export interface ParseResult {
  oficinas: OficinaData[];
  consolidado: BalanceReport;
  validation: ParseValidation;
}

export type FileFormat = "balance-consol" | "sigfe-raw" | "sigfe-consolidado";

// Mapping of UE codes to office names
const UE_OFFICE_MAP: Record<string, string> = {
  "064": "REGIONAL",
  "065": "VALDIVIA",
  "069": "RANCO",
};

// Panguipulli = UD 9, 90, 91 WITHIN Valdivia (UE 065)
const PANGUI_UDS_IN_VALDIVIA = ["9", "90", "91"];

function detectFormat(wb: XLSX.WorkBook): FileFormat {
  if (wb.SheetNames.length === 1) {
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<RawRow>(ws, { header: 1 });
    const first = String(raw[0]?.[0] || "");
    if (first.includes("Disponibilidad") || first.includes("Requerimientos")) {
      // Check if Row 1 has multiple offices separated by ;
      const row1 = String(raw[1]?.[0] || "");
      if (row1.includes(";")) return "sigfe-consolidado";
      return "sigfe-raw";
    }
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      if (raw[i]?.some((c) => String(c).includes("Folio") && String(c).includes("Catálogo"))) {
        const row1 = String(raw[1]?.[0] || "");
        if (row1.includes(";")) return "sigfe-consolidado";
        return "sigfe-raw";
      }
    }
  }
  return "balance-consol";
}

function detectColumnLayout(headerRow: RawRow): { prog: number; ud: number; concepto: number; vigente: number; disponible: number; consumido: number } {
  // Two known SIGFE layouts:
  // Layout A (19 cols): UE, Folio, Título, TipoPpto, Moneda, Cat01, Cat02, Cat03, Cat04, Cat05, Cat06, Concepto, Vigente, Disponible, Consumido, ...
  // Layout B (11 cols): UE, Folio, Título, Cat01, Cat04, Cat05, Cat06, Concepto, Vigente, Disponible, Consumido
  if (!headerRow) return { prog: 3, ud: 4, concepto: 7, vigente: 8, disponible: 9, consumido: 10 };

  // Find "Concepto Presupuesto" column
  for (let i = 0; i < headerRow.length; i++) {
    const val = String(headerRow[i] || "");
    if (val.includes("Concepto")) {
      // Concepto found — check if it's Layout A or B
      const hasTipoPpto = headerRow.some((c) => String(c || "").includes("Tipo Presupuest"));
      if (hasTipoPpto) {
        // Layout A: prog=5, ud=8, concepto=11, vigente=12, disponible=13, consumido=14
        return { prog: 5, ud: 8, concepto: 11, vigente: 12, disponible: 13, consumido: 14 };
      } else {
        // Layout B: prog=3, ud=4, concepto=7, vigente=8, disponible=9, consumido=10
        return { prog: 3, ud: 4, concepto: 7, vigente: 8, disponible: 9, consumido: 10 };
      }
    }
  }
  // Default to Layout B
  return { prog: 3, ud: 4, concepto: 7, vigente: 8, disponible: 9, consumido: 10 };
}

function parseSigfeConsolidado(wb: XLSX.WorkBook): ParseResult {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<RawRow>(ws, { header: 1 });

  const oficinaNombre = "Región de Los Ríos";
  const periodoRaw = String(raw[2]?.[0] || "");
  const fechaReporte = String(raw[3]?.[0] || "");

  // Find header row
  let headerIdx = 0;
  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    if (raw[i]?.some((c) => String(c).includes("Folio"))) { headerIdx = i; break; }
  }

  const cols = detectColumnLayout(raw[headerIdx]);
  const isViatico = (conceptoCode: string) => conceptoCode.startsWith("2101");
  const extractProgCode = (s: string) => { const m = s.match(/- (\d{2})/); return m ? m[1] : "00"; };
  const extractUD = (s: string) => { const m = String(s).match(/- (\d+)/); return m ? m[1] : "00"; };
  const extractUECode = (s: string) => { const m = String(s).match(/(\d{3})\s/); return m ? m[1] : "???"; };

  const PROG_NAMES: Record<string, string> = {
    "01": "CONAF 01 — Dirección-DEFA", "03": "CONAF 03 — DEPRIF",
    "04": "CONAF 04 — DASP", "05-GBCC": "CONAF 05 — Dpto. Forestal",
    "05-FISC": "CONAF 05 — Dpto. Fiscalización", "06": "CONAF 06 — Arborización", "PEE": "PEE — Prog. Empleos",
  };

  // Group by office → program → folio
  type ItemAccum = { titulo: string; progCode: string; bys: { ppto: number; comp: number }; viat: { ppto: number; comp: number } };
  const officeData = new Map<string, Map<string, ItemAccum>>();

  let dataRows = 0;
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    if (!r || typeof r[1] !== "number") continue;
    dataRows++;

    const ueRaw = String(r[0] || "");
    const ueCode = extractUECode(ueRaw);
    const folio = r[1] as number;
    const titulo = String(r[2] || "").trim();
    const progRaw = String(r[cols.prog] || "");
    let progCode = extractProgCode(progRaw);
    const udCode = extractUD(String(r[cols.ud] || ""));
    const conceptoCode = String(r[cols.concepto] || "").match(/^(\d+)/)?.[1] || "";
    const ppto = (r[cols.vigente] as number) || 0;
    const comp = (r[cols.consumido] as number) || 0;

    // Determine office
    let officeName = UE_OFFICE_MAP[ueCode] || ueCode;

    // Panguipulli: UD 9, 90, 91 within Valdivia (065)
    if (ueCode === "065" && PANGUI_UDS_IN_VALDIVIA.includes(udCode)) {
      officeName = "PANGUIPULLI";
    }

    // Split P05 by UD
    if (progCode === "05") {
      progCode = udCode === "14" ? "05-FISC" : "05-GBCC";
    }
    if (progCode === "07") progCode = "PEE";

    // Accumulate
    if (!officeData.has(officeName)) officeData.set(officeName, new Map());
    const officeMap = officeData.get(officeName)!;
    const key = `${progCode}|${folio}`;
    if (!officeMap.has(key)) {
      officeMap.set(key, { titulo, progCode, bys: { ppto: 0, comp: 0 }, viat: { ppto: 0, comp: 0 } });
    }
    const entry = officeMap.get(key)!;
    if (isViatico(conceptoCode)) {
      entry.viat.ppto += ppto;
      entry.viat.comp += comp;
    } else {
      entry.bys.ppto += ppto;
      entry.bys.comp += comp;
    }
  }

  // Build oficinas with programas
  const oficinas: OficinaData[] = [];
  for (const [officeName, folioMap] of officeData) {
    const progMap = new Map<string, BalanceItem[]>();
    for (const [, data] of folioMap) {
      const pc = data.progCode;
      if (!progMap.has(pc)) progMap.set(pc, []);
      const folioNum = parseInt(String([...folioMap.entries()].find(([, v]) => v === data)?.[0]?.split("|")[1] || "0"));
      if (data.bys.ppto > 0 || data.bys.comp > 0) {
        progMap.get(pc)!.push({
          folio: folioNum, titulo: data.titulo, programa: pc, programaCodigo: pc,
          tipo: "bys", presupuesto: data.bys.ppto, compromiso: data.bys.comp,
          saldo: data.bys.ppto - data.bys.comp,
          pctAvance: data.bys.ppto > 0 ? (data.bys.comp / data.bys.ppto) * 100 : 0,
        });
      }
      if (data.viat.ppto > 0 || data.viat.comp > 0) {
        progMap.get(pc)!.push({
          folio: folioNum, titulo: data.titulo, programa: pc, programaCodigo: pc,
          tipo: "viatico", presupuesto: data.viat.ppto, compromiso: data.viat.comp,
          saldo: data.viat.ppto - data.viat.comp,
          pctAvance: data.viat.ppto > 0 ? (data.viat.comp / data.viat.ppto) * 100 : 0,
        });
      }
    }

    const programas: ProgramaSummary[] = [...progMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([codigo, items]) => {
        const ppto = items.reduce((s, i) => s + i.presupuesto, 0);
        const comp = items.reduce((s, i) => s + i.compromiso, 0);
        return {
          codigo, nombre: PROG_NAMES[codigo] || `Programa ${codigo}`,
          presupuesto: ppto, compromiso: comp, saldo: ppto - comp,
          pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0, items,
        };
      });

    oficinas.push({ nombre: officeName, programas });
  }

  // Build consolidated
  const allProgs = new Map<string, ProgramaSummary>();
  for (const ofi of oficinas) {
    for (const prog of ofi.programas) {
      if (allProgs.has(prog.codigo)) {
        const ex = allProgs.get(prog.codigo)!;
        ex.items.push(...prog.items);
        ex.presupuesto += prog.presupuesto;
        ex.compromiso += prog.compromiso;
        ex.saldo += prog.saldo;
        ex.pctAvance = ex.presupuesto > 0 ? (ex.compromiso / ex.presupuesto) * 100 : 0;
      } else {
        allProgs.set(prog.codigo, { ...prog, items: [...prog.items] });
      }
    }
  }

  const programas = [...allProgs.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const totalPpto = programas.reduce((s, p) => s + p.presupuesto, 0);
  const totalComp = programas.reduce((s, p) => s + p.compromiso, 0);
  const totalItems = programas.reduce((s, p) => s + p.items.length, 0);

  // Period
  let periodo = "";
  const reportMatch = fechaReporte.match(/(\d{2})\s+(\w+)\s+(\d{4})/);
  if (reportMatch) periodo = `${reportMatch[2]} ${reportMatch[3]}`;
  else {
    const dateMatch = periodoRaw.match(/al\s+\d+\s+(\w+)\s+(\d{4})/i);
    if (dateMatch) periodo = `${dateMatch[1]} ${dateMatch[2]}`;
  }

  return {
    oficinas,
    consolidado: {
      oficina: oficinaNombre, periodo,
      fechaGeneracion: new Date().toISOString(),
      totalPresupuesto: totalPpto, totalCompromiso: totalComp,
      totalSaldo: totalPpto - totalComp,
      pctAvanceGlobal: totalPpto > 0 ? (totalComp / totalPpto) * 100 : 0,
      programas, alertas: buildAlerts(programas),
      totalRows: dataRows, totalItems,
    },
    validation: {
      format: "sigfe-consolidado",
      sheetsProcessed: 1,
      sheetsSkipped: [],
      totalDataRows: dataRows,
      warnings: oficinas.length < 3 ? ["Se detectaron menos de 3 oficinas — verificar datos"] : [],
    },
  };
}

function parseSigfeRaw(wb: XLSX.WorkBook): ParseResult {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<RawRow>(ws, { header: 1 });

  // Extract metadata from header rows
  const oficinaNombre = String(raw[1]?.[0] || "Oficina").replace(/^\d+\s*/, "").trim();
  const periodoRaw = String(raw[2]?.[0] || "");
  const fechaReporte = String(raw[3]?.[0] || "");

  // Find header row (contains "Folio")
  let headerIdx = 0;
  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    if (raw[i]?.some((c) => String(c).includes("Folio"))) { headerIdx = i; break; }
  }

  const extractConcepto = (s: string) => { const m = s.match(/^(\d+)/); return m ? m[1] : ""; };

  // Viáticos = código 2101 (Comisiones de Servicios). Todo lo demás es ByS.
  const isViatico = (conceptoCode: string) => conceptoCode.startsWith("2101");

  // Extract programa code from Catálogo 01
  const extractProgCode = (catalogo01: string) => {
    const m = catalogo01.match(/- (\d{2})/);
    return m ? m[1] : "00";
  };

  // Extract Unidad Demandante code from Catálogo 04
  const extractUD = (catalogo04: string) => {
    const m = String(catalogo04).match(/- (\d+)/);
    return m ? m[1] : "00";
  };

  const PROG_NAMES: Record<string, string> = {
    "01": "CONAF 01 — Dirección-DEFA",
    "03": "CONAF 03 — DEPRIF",
    "04": "CONAF 04 — DASP",
    "05-GBCC": "CONAF 05 — Dpto. Forestal",
    "05-FISC": "CONAF 05 — Dpto. Fiscalización",
    "06": "CONAF 06 — Arborización",
    "PEE": "PEE — Prog. Empleos",
  };

  // Group by (programa + folio + tipo) — key includes programa split
  type FolioEntry = { titulo: string; progCode: string; bys: { ppto: number; comp: number }; viat: { ppto: number; comp: number } };
  const folioMap = new Map<string, FolioEntry>();

  const warnings: string[] = [];
  let dataRows = 0;

  const cols = detectColumnLayout(raw[headerIdx]);

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    if (!r || typeof r[1] !== "number") continue;
    dataRows++;

    const folio = r[1] as number;
    const titulo = String(r[2] || "").trim();
    const progRaw = String(r[cols.prog] || "");
    let progCode = extractProgCode(progRaw);
    const udCode = extractUD(String(r[cols.ud] || ""));
    const conceptoCode = extractConcepto(String(r[cols.concepto] || ""));
    const ppto = (r[cols.vigente] as number) || 0;
    const comp = (r[cols.consumido] as number) || 0;

    // Split P05 by Unidad Demandante: UD 14 = Fiscalización, rest = Forestal/GBCC
    if (progCode === "05") {
      progCode = udCode === "14" ? "05-FISC" : "05-GBCC";
    }
    // P07 = PEE
    if (progCode === "07") progCode = "PEE";

    const key = `${progCode}|${folio}`;
    if (!folioMap.has(key)) {
      folioMap.set(key, { titulo, progCode, bys: { ppto: 0, comp: 0 }, viat: { ppto: 0, comp: 0 } });
    }
    const entry = folioMap.get(key)!;
    if (isViatico(conceptoCode)) {
      entry.viat.ppto += ppto;
      entry.viat.comp += comp;
    } else {
      entry.bys.ppto += ppto;
      entry.bys.comp += comp;
    }
  }

  // Build items grouped by programa
  const progMap = new Map<string, BalanceItem[]>();
  for (const [, data] of folioMap) {
    const progCode = data.progCode;
    if (!progMap.has(progCode)) progMap.set(progCode, []);

    // Parse folio from key
    const folio = parseInt(String(data.titulo.match(/\d+/)?.[0] || "0"));
    const actualFolio = [...folioMap.entries()].find(([, v]) => v === data)?.[0]?.split("|")[1];
    const f = actualFolio ? parseInt(actualFolio) : folio;

    if (data.bys.ppto > 0 || data.bys.comp > 0) {
      progMap.get(progCode)!.push({
        folio: f, titulo: data.titulo, programa: progCode, programaCodigo: progCode,
        tipo: "bys", presupuesto: data.bys.ppto, compromiso: data.bys.comp,
        saldo: data.bys.ppto - data.bys.comp,
        pctAvance: data.bys.ppto > 0 ? (data.bys.comp / data.bys.ppto) * 100 : 0,
      });
    }
    if (data.viat.ppto > 0 || data.viat.comp > 0) {
      progMap.get(progCode)!.push({
        folio: f, titulo: data.titulo, programa: progCode, programaCodigo: progCode,
        tipo: "viatico", presupuesto: data.viat.ppto, compromiso: data.viat.comp,
        saldo: data.viat.ppto - data.viat.comp,
        pctAvance: data.viat.ppto > 0 ? (data.viat.comp / data.viat.ppto) * 100 : 0,
      });
    }
  }

  const programas: ProgramaSummary[] = [...progMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([codigo, items]) => {
      const ppto = items.reduce((s, i) => s + i.presupuesto, 0);
      const comp = items.reduce((s, i) => s + i.compromiso, 0);
      return {
        codigo, nombre: PROG_NAMES[codigo] || `Programa ${codigo}`,
        presupuesto: ppto, compromiso: comp, saldo: ppto - comp,
        pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0, items,
      };
    });

  const totalPpto = programas.reduce((s, p) => s + p.presupuesto, 0);
  const totalComp = programas.reduce((s, p) => s + p.compromiso, 0);

  // Extract period from date range row ("01 enero 2026 al 31 diciembre 2026")
  let periodo = "";
  const dateMatch = periodoRaw.match(/al\s+\d+\s+(\w+)\s+(\d{4})/i);
  if (dateMatch) periodo = `${dateMatch[1]} ${dateMatch[2]}`;
  // If we have the report date, use that month instead (more accurate for "up to" date)
  const reportMatch = fechaReporte.match(/(\d{2})\s+(\w+)\s+(\d{4})/);
  if (reportMatch) periodo = `${reportMatch[2]} ${reportMatch[3]}`;

  const oficina: OficinaData = { nombre: oficinaNombre, programas };

  const totalItems = programas.reduce((s, p) => s + p.items.length, 0);

  return {
    oficinas: [oficina],
    consolidado: {
      oficina: oficinaNombre, periodo,
      fechaGeneracion: new Date().toISOString(),
      totalPresupuesto: totalPpto, totalCompromiso: totalComp,
      totalSaldo: totalPpto - totalComp,
      pctAvanceGlobal: totalPpto > 0 ? (totalComp / totalPpto) * 100 : 0,
      programas, alertas: buildAlerts(programas),
      totalRows: raw.length - headerIdx - 1, totalItems,
    },
    validation: {
      format: "sigfe-raw",
      sheetsProcessed: 1,
      sheetsSkipped: [],
      totalDataRows: raw.length - headerIdx - 1,
      warnings: totalItems === 0 ? ["No se encontraron ítems con montos válidos"] : [],
    },
  };
}

export function parseSigfeFile(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: "array" });
  const format = detectFormat(wb);

  // SIGFE consolidado (multiple offices in one file, separated by UE code)
  if (format === "sigfe-consolidado") return parseSigfeConsolidado(wb);

  // SIGFE raw (single office)
  if (format === "sigfe-raw") return parseSigfeRaw(wb);

  // Balance Consolidado format (multi-sheet: Regional, Valdivia, etc.)
  const oficinas: OficinaData[] = [];

  for (const sheetName of wb.SheetNames) {
    const upper = sheetName.toUpperCase();
    if (upper === "CONSOLIDADO" || upper === "HOJA1") continue;

    const ws = wb.Sheets[sheetName];
    const data = parseSheet(ws);
    if (data) oficinas.push(data);
  }

  // Build consolidated report merging all oficinas
  const allProgramas = new Map<string, ProgramaSummary>();

  for (const oficina of oficinas) {
    for (const prog of oficina.programas) {
      if (allProgramas.has(prog.codigo)) {
        const existing = allProgramas.get(prog.codigo)!;
        existing.items.push(...prog.items);
        existing.presupuesto += prog.presupuesto;
        existing.compromiso += prog.compromiso;
        existing.saldo += prog.saldo;
        existing.pctAvance = existing.presupuesto > 0
          ? (existing.compromiso / existing.presupuesto) * 100
          : 0;
      } else {
        allProgramas.set(prog.codigo, { ...prog, items: [...prog.items] });
      }
    }
  }

  const programas = [...allProgramas.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const totalPresupuesto = programas.reduce((s, p) => s + p.presupuesto, 0);
  const totalCompromiso = programas.reduce((s, p) => s + p.compromiso, 0);
  const totalItems = programas.reduce((s, p) => s + p.items.length, 0);

  const consolidado: BalanceReport = {
    oficina: "Región de Los Ríos",
    periodo: "", // will be set from file header
    fechaGeneracion: new Date().toISOString(),
    totalPresupuesto,
    totalCompromiso,
    totalSaldo: totalPresupuesto - totalCompromiso,
    pctAvanceGlobal: totalPresupuesto > 0 ? (totalCompromiso / totalPresupuesto) * 100 : 0,
    programas,
    alertas: buildAlerts(programas),
    totalRows: totalItems,
    totalItems,
  };

  // Try to extract period from first sheet header
  if (oficinas.length > 0) {
    const firstHeader = oficinas[0].nombre;
    const dateMatch = firstHeader.match(/AL\s+(\d{2})-(\d{2})-(\d{4})/i);
    if (dateMatch) {
      const [, , month, year] = dateMatch;
      const months = [
        "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
      ];
      consolidado.periodo = `${months[parseInt(month)]} ${year}`;
    }
  }

  // Build validation
  const sheetsSkipped = wb.SheetNames.filter((s) => {
    const u = s.toUpperCase();
    return u === "CONSOLIDADO" || u === "HOJA1";
  });
  const warnings: string[] = [];
  if (oficinas.length === 0) warnings.push("No se encontraron hojas con datos de balance válidos");
  if (totalItems === 0) warnings.push("No se encontraron ítems con montos válidos");
  for (const p of programas) {
    if (p.pctAvance > 110) warnings.push(`${p.nombre} con ejecución al ${p.pctAvance.toFixed(0)}% — posible error en datos`);
  }

  return {
    oficinas,
    consolidado,
    validation: {
      format: "balance-consol",
      sheetsProcessed: oficinas.length,
      sheetsSkipped,
      totalDataRows: totalItems,
      warnings,
    },
  };
}
