import type { BalanceReport, HistoryEntry } from "./types";

export const DEMO_REPORT: BalanceReport = {
  oficina: "064 Oficina Región de Los Ríos",
  periodo: "noviembre 2025",
  fechaGeneracion: "2025-11-30T00:00:00Z",
  totalPresupuesto: 1_924_000_000,
  totalCompromiso: 1_590_000_000,
  totalSaldo: 334_000_000,
  pctAvanceGlobal: 82.7,
  totalRows: 308,
  totalItems: 42,
  programas: [
    {
      codigo: "01",
      nombre: "CONAF 01 - Corporación Nacional",
      presupuesto: 632_000_000,
      compromiso: 498_000_000,
      saldo: 134_000_000,
      pctAvance: 78.8,
      items: [
        { folio: 1, titulo: "Ppto. Operac. Dirección Regional (ByS)", programa: "01", programaCodigo: "01", tipo: "bys", presupuesto: 230_000_000, compromiso: 195_000_000, saldo: 35_000_000, pctAvance: 84.8 },
        { folio: 1, titulo: "Ppto. Operac. Dirección Regional (Viático)", programa: "01", programaCodigo: "01", tipo: "viatico", presupuesto: 92_000_000, compromiso: 78_000_000, saldo: 14_000_000, pctAvance: 84.8 },
        { folio: 2, titulo: "Equidad de Género (ByS)", programa: "01", programaCodigo: "01", tipo: "bys", presupuesto: 160_000_000, compromiso: 120_000_000, saldo: 40_000_000, pctAvance: 75.0 },
        { folio: 3, titulo: "Participación Ciudadana (ByS)", programa: "01", programaCodigo: "01", tipo: "bys", presupuesto: 150_000_000, compromiso: 105_000_000, saldo: 45_000_000, pctAvance: 70.0 },
      ],
    },
    {
      codigo: "03",
      nombre: "CONAF 03 - Manejo del Fuego",
      presupuesto: 485_000_000,
      compromiso: 462_000_000,
      saldo: 23_000_000,
      pctAvance: 95.3,
      items: [
        { folio: 50, titulo: "Operaciones Brigadas (ByS)", programa: "03", programaCodigo: "03", tipo: "bys", presupuesto: 320_000_000, compromiso: 312_000_000, saldo: 8_000_000, pctAvance: 97.5 },
        { folio: 50, titulo: "Operaciones Brigadas (Viático)", programa: "03", programaCodigo: "03", tipo: "viatico", presupuesto: 85_000_000, compromiso: 78_000_000, saldo: 7_000_000, pctAvance: 91.8 },
        { folio: 51, titulo: "Prevención Incendios (ByS)", programa: "03", programaCodigo: "03", tipo: "bys", presupuesto: 80_000_000, compromiso: 72_000_000, saldo: 8_000_000, pctAvance: 90.0 },
      ],
    },
    {
      codigo: "04",
      nombre: "CONAF 04 - Áreas Silvestres",
      presupuesto: 310_000_000,
      compromiso: 248_000_000,
      saldo: 62_000_000,
      pctAvance: 80.0,
      items: [
        { folio: 100, titulo: "Parques Nacionales (ByS)", programa: "04", programaCodigo: "04", tipo: "bys", presupuesto: 200_000_000, compromiso: 168_000_000, saldo: 32_000_000, pctAvance: 84.0 },
        { folio: 101, titulo: "Reservas Nacionales (ByS)", programa: "04", programaCodigo: "04", tipo: "bys", presupuesto: 110_000_000, compromiso: 80_000_000, saldo: 30_000_000, pctAvance: 72.7 },
      ],
    },
    {
      codigo: "05",
      nombre: "CONAF 05 - Gestión Forestal",
      presupuesto: 197_000_000,
      compromiso: 142_000_000,
      saldo: 55_000_000,
      pctAvance: 72.1,
      items: [
        { folio: 150, titulo: "Fiscalización (ByS)", programa: "05", programaCodigo: "05", tipo: "bys", presupuesto: 120_000_000, compromiso: 90_000_000, saldo: 30_000_000, pctAvance: 75.0 },
        { folio: 151, titulo: "Bonificación Forestal (ByS)", programa: "05", programaCodigo: "05", tipo: "bys", presupuesto: 77_000_000, compromiso: 52_000_000, saldo: 25_000_000, pctAvance: 67.5 },
      ],
    },
    {
      codigo: "06",
      nombre: "CONAF 06 - Arborización",
      presupuesto: 120_000_000,
      compromiso: 108_000_000,
      saldo: 12_000_000,
      pctAvance: 90.0,
      items: [
        { folio: 200, titulo: "Programa Arborización (ByS)", programa: "06", programaCodigo: "06", tipo: "bys", presupuesto: 120_000_000, compromiso: 108_000_000, saldo: 12_000_000, pctAvance: 90.0 },
      ],
    },
    {
      codigo: "07",
      nombre: "PEE - Programas de Empleos",
      presupuesto: 180_000_000,
      compromiso: 132_000_000,
      saldo: 48_000_000,
      pctAvance: 73.3,
      items: [
        { folio: 259, titulo: "BBySS y Viático PEE (ByS)", programa: "07", programaCodigo: "07", tipo: "bys", presupuesto: 130_000_000, compromiso: 98_000_000, saldo: 32_000_000, pctAvance: 75.4 },
        { folio: 259, titulo: "BBySS y Viático PEE (Viático)", programa: "07", programaCodigo: "07", tipo: "viatico", presupuesto: 50_000_000, compromiso: 34_000_000, saldo: 16_000_000, pctAvance: 68.0 },
      ],
    },
  ],
  alertas: [
    { tipo: "alto", programa: "03", folio: 50, titulo: "Operaciones Brigadas (ByS)", pct: 97.5, mensaje: "Folio 50 al 97.5% — próximo a agotarse" },
    { tipo: "alto", programa: "03", folio: 50, titulo: "Operaciones Brigadas (Viático)", pct: 91.8, mensaje: "Folio 50 viáticos al 91.8%" },
    { tipo: "alto", programa: "06", folio: 200, titulo: "Programa Arborización", pct: 90.0, mensaje: "Arborización al 90.0%" },
  ],
};

export const DEMO_HISTORY: HistoryEntry[] = [
  { mes: "Ene 2025", presupuesto: 1_924_000_000, compromiso: 145_000_000, pctAvance: 7.5 },
  { mes: "Feb 2025", presupuesto: 1_924_000_000, compromiso: 298_000_000, pctAvance: 15.5 },
  { mes: "Mar 2025", presupuesto: 1_924_000_000, compromiso: 467_000_000, pctAvance: 24.3 },
  { mes: "Abr 2025", presupuesto: 1_924_000_000, compromiso: 612_000_000, pctAvance: 31.8 },
  { mes: "May 2025", presupuesto: 1_924_000_000, compromiso: 789_000_000, pctAvance: 41.0 },
  { mes: "Jun 2025", presupuesto: 1_924_000_000, compromiso: 934_000_000, pctAvance: 48.5 },
  { mes: "Jul 2025", presupuesto: 1_924_000_000, compromiso: 1_056_000_000, pctAvance: 54.9 },
  { mes: "Ago 2025", presupuesto: 1_924_000_000, compromiso: 1_178_000_000, pctAvance: 61.2 },
  { mes: "Sep 2025", presupuesto: 1_924_000_000, compromiso: 1_312_000_000, pctAvance: 68.2 },
  { mes: "Oct 2025", presupuesto: 1_924_000_000, compromiso: 1_445_000_000, pctAvance: 75.1 },
  { mes: "Nov 2025", presupuesto: 1_924_000_000, compromiso: 1_590_000_000, pctAvance: 82.7 },
];
