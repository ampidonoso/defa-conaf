import type { BalanceReport, ProgramaSummary, HistoryEntry, Alerta } from './types';

// ─── Budget Health Score (0-100) ───────────────────────────────
export interface HealthScore {
  total: number;
  label: string;
  color: string;
  factors: { name: string; score: number; weight: number; detail: string }[];
}

export function calcHealthScore(report: BalanceReport): HealthScore {
  const factors: HealthScore['factors'] = [];

  // 1. Avance global vs expected (weight: 30%)
  const monthNum = new Date().getMonth() + 1; // 1-12
  const expectedPct = (monthNum / 12) * 100;
  const avanceDiff = Math.abs(report.pctAvanceGlobal - expectedPct);
  const avanceScore = Math.max(0, 100 - avanceDiff * 2);
  factors.push({
    name: 'Ritmo de ejecución',
    score: Math.round(avanceScore),
    weight: 30,
    detail: `${report.pctAvanceGlobal.toFixed(1)}% ejecutado vs ${expectedPct.toFixed(0)}% esperado al mes ${monthNum}`,
  });

  // 2. Distribución entre programas (weight: 20%)
  const pctValues = report.programas.map((p) => p.pctAvance);
  const avgPct = pctValues.reduce((s, v) => s + v, 0) / pctValues.length;
  const stdDev = Math.sqrt(pctValues.reduce((s, v) => s + (v - avgPct) ** 2, 0) / pctValues.length);
  const distribScore = Math.max(0, 100 - stdDev);
  factors.push({
    name: 'Homogeneidad entre programas',
    score: Math.round(distribScore),
    weight: 20,
    detail: `Desviación estándar: ${stdDev.toFixed(1)}pp entre ${report.programas.length} programas`,
  });

  // 3. Alertas (weight: 25%)
  const sobregirados = report.alertas.filter((a) => a.tipo === 'sobregirado').length;
  const criticos = report.alertas.filter((a) => a.tipo === 'alto').length;
  const alertScore = Math.max(0, 100 - sobregirados * 30 - criticos * 10);
  factors.push({
    name: 'Ausencia de sobregiros',
    score: Math.round(alertScore),
    weight: 25,
    detail: `${sobregirados} sobregirado(s), ${criticos} crítico(s)`,
  });

  // 4. Saldo suficiente (weight: 25%)
  const saldoPct = (report.totalSaldo / report.totalPresupuesto) * 100;
  const monthsLeft = 12 - monthNum;
  const burnPerMonth = report.totalCompromiso / monthNum;
  const projectedRemaining = report.totalSaldo - burnPerMonth * monthsLeft;
  const saldoScore = projectedRemaining >= 0 ? Math.min(100, 50 + saldoPct) : Math.max(0, 30 - Math.abs(projectedRemaining / report.totalPresupuesto) * 100);
  factors.push({
    name: 'Saldo proyectado suficiente',
    score: Math.round(saldoScore),
    weight: 25,
    detail: `Saldo actual ${saldoPct.toFixed(1)}%, burn mensual ~$${(burnPerMonth / 1e6).toFixed(0)}M`,
  });

  const total = Math.round(factors.reduce((s, f) => s + f.score * (f.weight / 100), 0));
  const label = total >= 80 ? 'Excelente' : total >= 60 ? 'Bueno' : total >= 40 ? 'Atención' : 'Crítico';
  const color = total >= 80 ? '#059669' : total >= 60 ? '#2563eb' : total >= 40 ? '#d97706' : '#dc2626';

  return { total, label, color, factors };
}

// ─── Burn Rate & Forecast ──────────────────────────────────────
export interface BurnForecast {
  burnMensual: number;
  mesesRestantes: number;
  proyeccionCierre: number;  // % projected at year end
  saldoProyectado: number;   // projected remaining at year end
  riesgoSobregiro: boolean;
  mesAgotamiento: string | null; // month when budget runs out, or null
}

export function calcBurnForecast(report: BalanceReport, history: HistoryEntry[]): BurnForecast {
  const monthNum = new Date().getMonth() + 1;
  const mesesRestantes = 12 - monthNum;

  // Use historical data if available, otherwise current
  let burnMensual: number;
  if (history.length >= 2) {
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    burnMensual = last.compromiso - prev.compromiso;
  } else {
    burnMensual = monthNum > 0 ? report.totalCompromiso / monthNum : 0;
  }

  const proyeccionGasto = report.totalCompromiso + burnMensual * mesesRestantes;
  const proyeccionCierre = report.totalPresupuesto > 0 ? (proyeccionGasto / report.totalPresupuesto) * 100 : 0;
  const saldoProyectado = report.totalPresupuesto - proyeccionGasto;
  const riesgoSobregiro = saldoProyectado < 0;

  // Calculate month of depletion
  let mesAgotamiento: string | null = null;
  if (burnMensual > 0 && report.totalSaldo > 0) {
    const mesesHastaAgotar = report.totalSaldo / burnMensual;
    if (mesesHastaAgotar < mesesRestantes) {
      const mesNum = Math.min(12, monthNum + Math.ceil(mesesHastaAgotar));
      const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      mesAgotamiento = meses[mesNum] || 'Dic';
    }
  }

  return { burnMensual, mesesRestantes, proyeccionCierre, saldoProyectado, riesgoSobregiro, mesAgotamiento };
}

// ─── Variance Analysis ─────────────────────────────────────────
export interface VarianceItem {
  programa: string;
  codigo: string;
  presupuesto: number;
  ejecutado: number;
  varianza: number;       // ejecutado - expected
  varianzaPct: number;    // variance as % of budget
  expected: number;       // what should have been spent by now
  status: 'adelantado' | 'normal' | 'retrasado' | 'sobregirado';
}

export function calcVariance(report: BalanceReport): VarianceItem[] {
  const monthNum = new Date().getMonth() + 1;
  const expectedRatio = monthNum / 12;

  return report.programas.map((p) => {
    const expected = p.presupuesto * expectedRatio;
    const varianza = p.compromiso - expected;
    const varianzaPct = expected > 0 ? (varianza / expected) * 100 : 0;

    let status: VarianceItem['status'];
    if (p.pctAvance > 100) status = 'sobregirado';
    else if (varianzaPct > 15) status = 'adelantado';
    else if (varianzaPct < -15) status = 'retrasado';
    else status = 'normal';

    return {
      programa: p.nombre,
      codigo: p.codigo,
      presupuesto: p.presupuesto,
      ejecutado: p.compromiso,
      varianza,
      varianzaPct,
      expected,
      status,
    };
  });
}

// ─── What-If Scenario ──────────────────────────────────────────
export interface Scenario {
  name: string;
  adjustments: { programaCodigo: string; deltaPct: number }[];
}

export interface ScenarioResult {
  name: string;
  totalPresupuesto: number;
  totalCompromiso: number;
  pctAvance: number;
  saldo: number;
  alertCount: number;
  programas: { codigo: string; nombre: string; ppto: number; comp: number; pct: number }[];
}

export function runScenario(report: BalanceReport, scenario: Scenario): ScenarioResult {
  const programas = report.programas.map((p) => {
    const adj = scenario.adjustments.find((a) => a.programaCodigo === p.codigo);
    const factor = adj ? 1 + adj.deltaPct / 100 : 1;
    const newComp = Math.round(p.compromiso * factor);
    return {
      codigo: p.codigo,
      nombre: p.nombre,
      ppto: p.presupuesto,
      comp: newComp,
      pct: p.presupuesto > 0 ? (newComp / p.presupuesto) * 100 : 0,
    };
  });

  const totalPpto = programas.reduce((s, p) => s + p.ppto, 0);
  const totalComp = programas.reduce((s, p) => s + p.comp, 0);

  return {
    name: scenario.name,
    totalPresupuesto: totalPpto,
    totalCompromiso: totalComp,
    pctAvance: totalPpto > 0 ? (totalComp / totalPpto) * 100 : 0,
    saldo: totalPpto - totalComp,
    alertCount: programas.filter((p) => p.pct > 90).length,
    programas,
  };
}

// ─── Program Rankings ──────────────────────────────────────────
export interface ProgramRanking {
  codigo: string;
  nombre: string;
  pctAvance: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export function rankPrograms(report: BalanceReport): ProgramRanking[] {
  return report.programas
    .map((p, _, arr) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      pctAvance: p.pctAvance,
      rank: 0,
      trend: 'stable' as const,
      riskLevel: p.pctAvance > 100 ? 'critical' as const
        : p.pctAvance > 90 ? 'high' as const
        : p.pctAvance < 30 ? 'medium' as const
        : 'low' as const,
    }))
    .sort((a, b) => b.pctAvance - a.pctAvance)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
