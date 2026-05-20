import * as XLSX from "xlsx";
import type { BalanceItem, ProgramaSummary, BalanceReport, Alerta } from "./types";

type RawRow = (string | number | null | undefined)[];

interface OficinaData {
  nombre: string;
  programas: ProgramaSummary[];
}

const PROGRAMA_PATTERNS: { pattern: RegExp; codigo: string; nombre: string }[] = [
  { pattern: /^CONAF\s*01/i, codigo: "01", nombre: "CONAF 01" },
  { pattern: /^PEE/i, codigo: "PEE", nombre: "PEE" },
  { pattern: /^CONAF\s*03/i, codigo: "03", nombre: "CONAF 03 — Manejo del Fuego" },
  { pattern: /^CONAF\s*04/i, codigo: "04", nombre: "CONAF 04 — Áreas Silvestres" },
  { pattern: /^CONAF\s*05.*GBCC/i, codigo: "05-GBCC", nombre: "CONAF 05 — GBCC" },
  { pattern: /^CONAF\s*05.*FISCAL/i, codigo: "05-FISC", nombre: "CONAF 05 — Fiscalización" },
  { pattern: /^CONAF\s*05/i, codigo: "05", nombre: "CONAF 05 — Gestión Forestal" },
  { pattern: /^CONAF\s*06/i, codigo: "06", nombre: "CONAF 06 — Ecosistema y Sociedad" },
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
  const first = String(row[0]).trim().toUpperCase();
  // It's a header if col[1] contains "UE" or is the programa name row with structure headers
  const second = row[1] ? String(row[1]).trim().toUpperCase() : "";
  return second === "UE" || second === "ESTRUCTURA PRESUPUESTARIA" || second === "ESTRUC. PRESUPUESTARIA ";
}

function isTotalRow(row: RawRow): boolean {
  if (!row || !row[0]) return false;
  const first = String(row[0]).trim().toUpperCase();
  return first.startsWith("TOTAL ");
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
  // Data rows have a name in col 0 and a number in col 1 (UE code) or col 6 (SIGFE)
  if (isTotalRow(row)) return false;
  if (isHeaderRow(row)) return false;
  // Check if has numeric values in the money columns (7-14)
  const hasMoneyData = [7, 8, 9, 12, 13, 14].some(
    (i) => row[i] !== undefined && row[i] !== null && typeof row[i] === "number"
  );
  return hasMoneyData;
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

export interface ParseResult {
  oficinas: OficinaData[];
  consolidado: BalanceReport;
}

export function parseSigfeFile(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: "array" });

  const oficinas: OficinaData[] = [];

  // Parse each sheet as an oficina (skip CONSOLIDADO and Hoja1)
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

  return { oficinas, consolidado };
}

// Keep backward compatibility
export function generateBalance(): never {
  throw new Error("Use parseSigfeFile instead");
}
