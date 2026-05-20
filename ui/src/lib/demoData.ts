import type { BalanceReport, HistoryEntry, ProgramaSummary, BalanceItem, Alerta } from './types';
import type { AppProfile } from './auth';

export const DEMO_CODE = '0000';

export const DEMO_PROFILE: AppProfile = {
  id: 'demo-user-001',
  nombre: 'Usuario Demo',
  cargo: 'Modo Demostración',
  iniciales: 'DM',
  rol: 'viewer',
  color: '#6366f1',
};

const makeItem = (
  folio: number, titulo: string, programa: string, programaCodigo: string,
  tipo: 'bys' | 'viatico', presupuesto: number, compromiso: number
): BalanceItem => ({
  folio, titulo, programa, programaCodigo, tipo, presupuesto, compromiso,
  saldo: presupuesto - compromiso,
  pctAvance: presupuesto > 0 ? Math.round((compromiso / presupuesto) * 1000) / 10 : 0,
});

const programas: ProgramaSummary[] = [
  {
    codigo: '01', nombre: 'Protección Contra Incendios Forestales',
    presupuesto: 485000000, compromiso: 312500000, saldo: 172500000, pctAvance: 64.4,
    items: [
      makeItem(1001, 'Equipamiento brigadas Valdivia', 'Protección Contra Incendios Forestales', '01', 'bys', 125000000, 98000000),
      makeItem(1002, 'Combustible aeronaves', 'Protección Contra Incendios Forestales', '01', 'bys', 95000000, 72000000),
      makeItem(1003, 'Viático brigada zona costera', 'Protección Contra Incendios Forestales', '01', 'viatico', 45000000, 38500000),
      makeItem(1004, 'Mantención torres de vigilancia', 'Protección Contra Incendios Forestales', '01', 'bys', 65000000, 42000000),
      makeItem(1005, 'Capacitación personal temporada', 'Protección Contra Incendios Forestales', '01', 'bys', 35000000, 22000000),
      makeItem(1006, 'Viático supervisores terreno', 'Protección Contra Incendios Forestales', '01', 'viatico', 28000000, 18500000),
      makeItem(1007, 'Herramientas manuales combate', 'Protección Contra Incendios Forestales', '01', 'bys', 42000000, 12000000),
      makeItem(1008, 'Arriendo maquinaria pesada', 'Protección Contra Incendios Forestales', '01', 'bys', 50000000, 9500000),
    ],
  },
  {
    codigo: '02', nombre: 'Fiscalización Forestal',
    presupuesto: 210000000, compromiso: 195000000, saldo: 15000000, pctAvance: 92.9,
    items: [
      makeItem(2001, 'Vehículos fiscalización terreno', 'Fiscalización Forestal', '02', 'bys', 85000000, 82000000),
      makeItem(2002, 'Equipos medición forestal', 'Fiscalización Forestal', '02', 'bys', 42000000, 40500000),
      makeItem(2003, 'Viático fiscalizadores Ranco', 'Fiscalización Forestal', '02', 'viatico', 38000000, 35000000),
      makeItem(2004, 'Software georreferenciación', 'Fiscalización Forestal', '02', 'bys', 25000000, 22500000),
      makeItem(2005, 'Uniformes personal fiscalización', 'Fiscalización Forestal', '02', 'bys', 20000000, 15000000),
    ],
  },
  {
    codigo: '03', nombre: 'Fomento Forestal y Desarrollo',
    presupuesto: 320000000, compromiso: 148000000, saldo: 172000000, pctAvance: 46.3,
    items: [
      makeItem(3001, 'Bonificación forestal Ley 20.283', 'Fomento Forestal y Desarrollo', '03', 'bys', 150000000, 72000000),
      makeItem(3002, 'Asistencia técnica predios', 'Fomento Forestal y Desarrollo', '03', 'bys', 55000000, 28000000),
      makeItem(3003, 'Plantas vivero regional', 'Fomento Forestal y Desarrollo', '03', 'bys', 45000000, 22000000),
      makeItem(3004, 'Viático extensionistas', 'Fomento Forestal y Desarrollo', '03', 'viatico', 35000000, 14000000),
      makeItem(3005, 'Programa comunidades indígenas', 'Fomento Forestal y Desarrollo', '03', 'bys', 35000000, 12000000),
    ],
  },
  {
    codigo: '04', nombre: 'Administración y Gestión',
    presupuesto: 185000000, compromiso: 162000000, saldo: 23000000, pctAvance: 87.6,
    items: [
      makeItem(4001, 'Arriendo oficinas regionales', 'Administración y Gestión', '04', 'bys', 65000000, 60000000),
      makeItem(4002, 'Servicios básicos', 'Administración y Gestión', '04', 'bys', 38000000, 35000000),
      makeItem(4003, 'Materiales de oficina', 'Administración y Gestión', '04', 'bys', 22000000, 18000000),
      makeItem(4004, 'Viático gestión administrativa', 'Administración y Gestión', '04', 'viatico', 28000000, 25000000),
      makeItem(4005, 'Mantención infraestructura', 'Administración y Gestión', '04', 'bys', 32000000, 24000000),
    ],
  },
];

const totalP = programas.reduce((s, p) => s + p.presupuesto, 0);
const totalC = programas.reduce((s, p) => s + p.compromiso, 0);

const alertas: Alerta[] = [
  { tipo: 'alto', programa: '02', titulo: 'Fiscalización Forestal', pct: 92.9, mensaje: 'Ejecución al 92.9% — presupuesto próximo a agotarse' },
  { tipo: 'alto', programa: '04', titulo: 'Administración y Gestión', pct: 87.6, mensaje: 'Ejecución al 87.6% — revisar proyección' },
  { tipo: 'bajo', programa: '03', titulo: 'Fomento Forestal', pct: 46.3, mensaje: 'Ejecución baja al 46.3% — posible subejecución' },
  { tipo: 'sobregirado', programa: '02', folio: 2001, titulo: 'Vehículos fiscalización terreno', pct: 96.5, mensaje: 'Ítem al 96.5% de ejecución' },
];

export const DEMO_REPORT: BalanceReport = {
  oficina: 'DEFA CONAF Los Ríos',
  periodo: 'Marzo 2026 (Demo)',
  fechaGeneracion: new Date().toISOString(),
  totalPresupuesto: totalP,
  totalCompromiso: totalC,
  totalSaldo: totalP - totalC,
  pctAvanceGlobal: Math.round((totalC / totalP) * 1000) / 10,
  programas,
  alertas,
  totalRows: programas.reduce((s, p) => s + p.items.length, 0),
  totalItems: programas.reduce((s, p) => s + p.items.length, 0),
};

export const DEMO_OFICINAS = [
  {
    nombre: 'Oficina Regional Valdivia',
    programas: programas.slice(0, 2).map(p => ({
      ...p,
      presupuesto: Math.round(p.presupuesto * 0.6),
      compromiso: Math.round(p.compromiso * 0.6),
      saldo: Math.round(p.saldo * 0.6),
    })),
  },
  {
    nombre: 'Oficina Provincial Ranco',
    programas: programas.slice(0, 3).map(p => ({
      ...p,
      presupuesto: Math.round(p.presupuesto * 0.4),
      compromiso: Math.round(p.compromiso * 0.4),
      saldo: Math.round(p.saldo * 0.4),
    })),
  },
];

export const DEMO_HISTORY: HistoryEntry[] = [
  { mes: 'Oct 2025', presupuesto: 1100000000, compromiso: 385000000, pctAvance: 35.0 },
  { mes: 'Nov 2025', presupuesto: 1150000000, compromiso: 460000000, pctAvance: 40.0 },
  { mes: 'Dic 2025', presupuesto: 1180000000, compromiso: 566400000, pctAvance: 48.0 },
  { mes: 'Ene 2026', presupuesto: 1200000000, compromiso: 660000000, pctAvance: 55.0 },
  { mes: 'Feb 2026', presupuesto: 1200000000, compromiso: 744000000, pctAvance: 62.0 },
  { mes: 'Mar 2026', presupuesto: totalP, compromiso: totalC, pctAvance: DEMO_REPORT.pctAvanceGlobal },
];
