export interface ProgramData {
  id: string;
  name: string;
  shortName: string;
  budget: number;
  committed: number;
  balance: number;
  percent: number;
  bysBudget: number;
  bysCommitted: number;
  bysBalance: number;
  bysPercent: number;
  viatBudget: number;
  viatCommitted: number;
  viatBalance: number;
  viatPercent: number;
}

export interface AlertData {
  id: string;
  program: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export const programs: ProgramData[] = [
  {
    id: 'conaf01', name: 'CONAF 01 - Administración Forestal', shortName: 'CONAF 01',
    budget: 182500000, committed: 164250000, balance: 18250000, percent: 90.0,
    bysBudget: 145000000, bysCommitted: 131900000, bysBalance: 13100000, bysPercent: 91.0,
    viatBudget: 37500000, viatCommitted: 32350000, viatBalance: 5150000, viatPercent: 86.3,
  },
  {
    id: 'pee', name: 'PEE - Programa de Empleo', shortName: 'PEE',
    budget: 850000000, committed: 722500000, balance: 127500000, percent: 85.0,
    bysBudget: 680000000, bysCommitted: 578000000, bysBalance: 102000000, bysPercent: 85.0,
    viatBudget: 170000000, viatCommitted: 144500000, viatBalance: 25500000, viatPercent: 85.0,
  },
  {
    id: 'conaf03', name: 'CONAF 03 - Fiscalización', shortName: 'CONAF 03',
    budget: 155000000, committed: 69750000, balance: 85250000, percent: 45.0,
    bysBudget: 120000000, bysCommitted: 54000000, bysBalance: 66000000, bysPercent: 45.0,
    viatBudget: 35000000, viatCommitted: 15750000, viatBalance: 19250000, viatPercent: 45.0,
  },
  {
    id: 'conaf04', name: 'CONAF 04 - Áreas Silvestres', shortName: 'CONAF 04',
    budget: 280000000, committed: 266000000, balance: 14000000, percent: 95.0,
    bysBudget: 220000000, bysCommitted: 211200000, bysBalance: 8800000, bysPercent: 96.0,
    viatBudget: 60000000, viatCommitted: 54800000, viatBalance: 5200000, viatPercent: 91.3,
  },
  {
    id: 'conaf05', name: 'CONAF 05 - Arborización', shortName: 'CONAF 05',
    budget: 52082000, committed: 52082000, balance: 0, percent: 100.0,
    bysBudget: 42082000, bysCommitted: 42082000, bysBalance: 0, bysPercent: 100.0,
    viatBudget: 10000000, viatCommitted: 10000000, viatBalance: 0, viatPercent: 100.0,
  },
  {
    id: 'conaf06', name: 'CONAF 06 - Manejo del Fuego', shortName: 'CONAF 06',
    budget: 205000000, committed: 229600000, balance: -24600000, percent: 112.0,
    bysBudget: 165000000, bysCommitted: 189600000, bysBalance: -24600000, bysPercent: 114.9,
    viatBudget: 40000000, viatCommitted: 40000000, viatBalance: 0, viatPercent: 100.0,
  },
];

export const alerts: AlertData[] = [
  { id: '1', program: 'CONAF 06 - Manejo del Fuego', message: 'Sobreejecución detectada (112%). Saldo negativo: -$24.6M. Requiere reasignación presupuestaria.', severity: 'critical' },
  { id: '2', program: 'CONAF 03 - Fiscalización', message: 'Baja ejecución (45%). Quedan $85M por comprometer antes del cierre.', severity: 'warning' },
];

export const totalBudget = programs.reduce((s, p) => s + p.budget, 0);
export const totalCommitted = programs.reduce((s, p) => s + p.committed, 0);
export const totalBalance = programs.reduce((s, p) => s + p.balance, 0);
export const totalPercent = Math.round((totalCommitted / totalBudget) * 1000) / 10;

export const historyData = [
  { month: 'Ene', presupuesto: 1924, ejecucion: 150 },
  { month: 'Feb', presupuesto: 1924, ejecucion: 280 },
  { month: 'Mar', presupuesto: 1924, ejecucion: 420 },
  { month: 'Abr', presupuesto: 1924, ejecucion: 590 },
  { month: 'May', presupuesto: 1924, ejecucion: 750 },
  { month: 'Jun', presupuesto: 1924, ejecucion: 910 },
  { month: 'Jul', presupuesto: 1924, ejecucion: 1050 },
  { month: 'Ago', presupuesto: 1924, ejecucion: 1200 },
  { month: 'Sep', presupuesto: 1924, ejecucion: 1380 },
  { month: 'Oct', presupuesto: 1924, ejecucion: 1450 },
  { month: 'Nov', presupuesto: 1924, ejecucion: 1590 },
];

export interface BalanceRow {
  id: string;
  name: string;
  ppto: number;
  comp: number;
  items: { name: string; ppto: number; comp: number }[];
}

export const balanceData: Record<string, BalanceRow[]> = {
  'Dir. Regional': [
    { id: 'c01', name: 'CONAF 01 - Adm. Forestal', ppto: 182500000, comp: 164250000, items: [
      { name: 'Bienes y Servicios (Subt. 22)', ppto: 150000000, comp: 140000000 },
      { name: 'Viáticos (21.02.004)', ppto: 32500000, comp: 24250000 },
    ]},
    { id: 'pee', name: 'PEE - Prog. Empleos', ppto: 850000000, comp: 722500000, items: [
      { name: 'Bienes y Servicios (Subt. 22)', ppto: 800000000, comp: 690000000 },
      { name: 'Viáticos (21.02.004)', ppto: 50000000, comp: 32500000 },
    ]},
    { id: 'c06', name: 'CONAF 06 - Manejo Fuego', ppto: 205000000, comp: 229500000, items: [
      { name: 'Bienes y Servicios (Subt. 22)', ppto: 160000000, comp: 180000000 },
      { name: 'Viáticos (21.02.004)', ppto: 45000000, comp: 49500000 },
    ]},
  ],
  'Valdivia': [
    { id: 'c03', name: 'CONAF 03 - Fiscalización', ppto: 155000000, comp: 69750000, items: [
      { name: 'Bienes y Servicios (Subt. 22)', ppto: 120000000, comp: 50000000 },
      { name: 'Viáticos (21.02.004)', ppto: 35000000, comp: 19750000 },
    ]},
  ],
  'Ranco': [
    { id: 'c01r', name: 'CONAF 01 - Adm. Forestal', ppto: 45000000, comp: 42000000, items: [
      { name: 'Bienes y Servicios', ppto: 40000000, comp: 38000000 },
      { name: 'Viáticos', ppto: 5000000, comp: 4000000 },
    ]},
  ],
};

export function formatCLP(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('es-CL');
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function formatShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${value < 0 ? '-' : ''}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${value < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `${value < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return formatCLP(value);
}

export function getStatusColor(percent: number): string {
  if (percent > 100) return 'text-red-600';
  if (percent >= 95) return 'text-red-600';
  if (percent >= 85) return 'text-amber-600';
  return 'text-emerald-600';
}
