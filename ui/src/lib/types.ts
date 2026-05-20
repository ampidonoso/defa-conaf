export interface SigfeRow {
  unidadEjecutora: string;
  folio: number;
  titulo: string;
  tipoPresupuesto: string;
  moneda: string;
  programaRaw: string;
  programaCodigo: string;
  programaNombre: string;
  programaPublico: string;
  unidadDemandante: string;
  productoEstrategico: string;
  centroCosto: string;
  conceptoPresupuesto: string;
  conceptoCodigo: string;
  montoVigente: number;
  montoDisponible: number;
  montoConsumido: number;
}

export interface BalanceItem {
  folio: number;
  titulo: string;
  programa: string;
  programaCodigo: string;
  tipo: "bys" | "viatico";
  presupuesto: number;
  compromiso: number;
  saldo: number;
  pctAvance: number;
}

export interface ProgramaSummary {
  codigo: string;
  nombre: string;
  presupuesto: number;
  compromiso: number;
  saldo: number;
  pctAvance: number;
  items: BalanceItem[];
}

export interface BalanceReport {
  oficina: string;
  periodo: string;
  fechaGeneracion: string;
  totalPresupuesto: number;
  totalCompromiso: number;
  totalSaldo: number;
  pctAvanceGlobal: number;
  programas: ProgramaSummary[];
  alertas: Alerta[];
  totalRows: number;
  totalItems: number;
}

export interface Alerta {
  tipo: "sobregirado" | "alto" | "bajo";
  programa: string;
  folio?: number;
  titulo: string;
  pct: number;
  mensaje: string;
}

export interface HistoryEntry {
  mes: string;
  presupuesto: number;
  compromiso: number;
  pctAvance: number;
}

export interface ExportConfig {
  // Filters
  programas: string[];          // códigos de programa a incluir ("01","03",...), vacío = todos
  tipo: "todos" | "bys" | "viatico";
  oficina: string;              // "todas" | "regional" | "valdivia" | "ranco"
  rangoAvance: [number, number]; // [min%, max%] — e.g. [0, 100]

  // Sheets
  includeResumen: boolean;
  includeDetalle: boolean;
  includeAlertas: boolean;
  includeComparativo: boolean;  // comparativo entre programas

  // Format
  formatoMontos: "pesos" | "miles" | "millones";
  incluirGraficos: boolean;     // data para gráficos (tabla auxiliar)
  separarPorPrograma: boolean;  // una hoja por programa
}
