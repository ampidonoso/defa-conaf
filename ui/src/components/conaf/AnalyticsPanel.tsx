import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, AlertTriangle, Flame,
  Target, Gauge, ArrowRight, ChevronDown, Zap, Shield,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, ReferenceLine, Legend,
} from 'recharts';
import type { BalanceReport, HistoryEntry } from '@/lib/types';
import {
  calcHealthScore, calcBurnForecast, calcVariance, rankPrograms,
  runScenario, type Scenario, type ScenarioResult,
} from '@/lib/analytics';

function fmtShort(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${v < 0 ? '-' : ''}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${v < 0 ? '-' : ''}$${(abs / 1e6).toFixed(0)}M`;
  return `${v < 0 ? '-' : ''}$${(abs / 1e3).toFixed(0)}K`;
}

// ─── Health Score Ring ─────────────────────────────────────────
function ScoreRing({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
  const r = (size - 16) / 2, c = 2 * Math.PI * r, center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <motion.circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * score) / 100 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        transform={`rotate(-90 ${center} ${center})`} />
      <text x={center} y={center - 6} textAnchor="middle" className="fill-slate-800 text-2xl font-extrabold" style={{ fontFamily: 'Inter' }}>
        {score}
      </text>
      <text x={center} y={center + 14} textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold" style={{ fontFamily: 'Inter' }}>
        de 100
      </text>
    </svg>
  );
}

interface Props {
  report: BalanceReport | null;
  history: HistoryEntry[];
}

export function AnalyticsPanel({ report, history }: Props) {
  const [scenarioAdj, setScenarioAdj] = useState<Record<string, number>>({});

  if (!report) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <p>Sube un balance para ver analytics avanzados</p>
    </div>
  );

  const health = calcHealthScore(report);
  const forecast = calcBurnForecast(report, history);
  const variance = calcVariance(report);
  const rankings = rankPrograms(report);

  // Scenario
  const scenarioResult = useMemo(() => {
    const adjustments = Object.entries(scenarioAdj)
      .filter(([, v]) => v !== 0)
      .map(([programaCodigo, deltaPct]) => ({ programaCodigo, deltaPct }));
    if (adjustments.length === 0) return null;
    return runScenario(report, { name: 'Personalizado', adjustments });
  }, [report, scenarioAdj]);

  const varianceChart = variance.map((v) => ({
    name: v.codigo === 'PEE' ? 'PEE' : v.codigo.length > 3 ? v.codigo : `P${v.codigo}`,
    esperado: Math.round(v.expected / 1e6),
    ejecutado: Math.round(v.ejecutado / 1e6),
    varianza: Math.round(v.varianza / 1e6),
    color: v.status === 'sobregirado' ? '#dc2626' : v.status === 'adelantado' ? '#d97706' : v.status === 'retrasado' ? '#2563eb' : '#059669',
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: Health Score + Burn Rate + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Score */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Salud Presupuestaria</h3>
          </div>
          <div className="flex items-center gap-6">
            <ScoreRing score={health.total} color={health.color} />
            <div className="flex-1 space-y-2">
              <p className="text-lg font-bold" style={{ color: health.color }}>{health.label}</p>
              {health.factors.map((f) => (
                <div key={f.name} className="flex items-center gap-2">
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${f.score}%`, backgroundColor: f.score > 70 ? '#059669' : f.score > 40 ? '#d97706' : '#dc2626' }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-20 text-right shrink-0">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Burn Rate */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">Velocidad de Gasto</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Burn mensual</p>
              <p className="text-2xl font-extrabold text-foreground">{fmtShort(forecast.burnMensual)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Meses restantes</p>
                <p className="text-lg font-bold text-foreground">{forecast.mesesRestantes}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Proyección cierre</p>
                <p className={`text-lg font-bold ${forecast.riesgoSobregiro ? 'text-red-600' : 'text-primary'}`}>
                  {forecast.proyeccionCierre.toFixed(1)}%
                </p>
              </div>
            </div>
            {forecast.riesgoSobregiro && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-red-700 text-[11px] font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Riesgo de sobregiro — saldo proyectado: {fmtShort(forecast.saldoProyectado)}
              </div>
            )}
            {forecast.mesAgotamiento && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg text-amber-700 text-[11px] font-semibold">
                <Activity className="w-4 h-4" />
                Presupuesto se agota en {forecast.mesAgotamiento}
              </div>
            )}
          </div>
        </motion.div>

        {/* Rankings */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-premium p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-foreground">Ranking Ejecución</h3>
          </div>
          <div className="space-y-2">
            {rankings.map((r) => (
              <div key={r.codigo} className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  r.rank <= 2 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>{r.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">{r.nombre}</p>
                </div>
                <span className={`text-[11px] font-bold font-mono ${
                  r.riskLevel === 'critical' ? 'text-red-600' : r.riskLevel === 'high' ? 'text-amber-600' : 'text-primary'
                }`}>{r.pctAvance.toFixed(1)}%</span>
                <span className={`w-2 h-2 rounded-full ${
                  r.riskLevel === 'critical' ? 'bg-red-500' : r.riskLevel === 'high' ? 'bg-amber-500' : r.riskLevel === 'medium' ? 'bg-blue-500' : 'bg-emerald-500'
                }`} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Variance Analysis Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Análisis de Varianza</h3>
          </div>
          <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Esperado vs Ejecutado (M$)</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={varianceChart} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CL')}M`, '']} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="esperado" name="Esperado al mes" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ejecutado" name="Ejecutado real" radius={[4, 4, 0, 0]}>
              {varianceChart.map((v, i) => <Cell key={i} fill={v.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Variance detail table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-bold text-muted-foreground">Programa</th>
                <th className="text-right py-2 font-bold text-muted-foreground">Esperado</th>
                <th className="text-right py-2 font-bold text-muted-foreground">Ejecutado</th>
                <th className="text-right py-2 font-bold text-muted-foreground">Varianza</th>
                <th className="text-center py-2 font-bold text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {variance.map((v) => (
                <tr key={v.codigo} className="border-b border-border/50">
                  <td className="py-2 font-medium text-foreground">{v.programa}</td>
                  <td className="py-2 text-right font-mono text-muted-foreground">{fmtShort(v.expected)}</td>
                  <td className="py-2 text-right font-mono text-foreground">{fmtShort(v.ejecutado)}</td>
                  <td className={`py-2 text-right font-mono font-bold ${v.varianza > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                    {v.varianza > 0 ? '+' : ''}{fmtShort(v.varianza)}
                  </td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      v.status === 'sobregirado' ? 'bg-red-50 text-red-600' :
                      v.status === 'adelantado' ? 'bg-amber-50 text-amber-600' :
                      v.status === 'retrasado' ? 'bg-blue-50 text-blue-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>{v.status.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* What-If Scenario */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-premium p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">Simulador What-If</h3>
          <span className="text-[10px] text-muted-foreground">Ajusta el gasto por programa y ve el impacto</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {report.programas.map((p) => (
            <div key={p.codigo} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30">
              <span className="text-[11px] font-semibold text-foreground flex-1 truncate">{p.codigo}</span>
              <input
                type="range"
                min={-50}
                max={50}
                value={scenarioAdj[p.codigo] || 0}
                onChange={(e) => setScenarioAdj((prev) => ({ ...prev, [p.codigo]: Number(e.target.value) }))}
                className="w-20 accent-primary"
              />
              <span className={`text-[11px] font-mono font-bold w-10 text-right ${
                (scenarioAdj[p.codigo] || 0) > 0 ? 'text-amber-600' : (scenarioAdj[p.codigo] || 0) < 0 ? 'text-blue-600' : 'text-muted-foreground'
              }`}>
                {(scenarioAdj[p.codigo] || 0) > 0 ? '+' : ''}{scenarioAdj[p.codigo] || 0}%
              </span>
            </div>
          ))}
        </div>
        {scenarioResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            <div>
              <p className="text-[10px] text-muted-foreground">Nuevo avance</p>
              <p className={`text-lg font-bold ${scenarioResult.pctAvance > 100 ? 'text-red-600' : 'text-foreground'}`}>
                {scenarioResult.pctAvance.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Nuevo saldo</p>
              <p className={`text-lg font-bold ${scenarioResult.saldo < 0 ? 'text-red-600' : 'text-foreground'}`}>
                {fmtShort(scenarioResult.saldo)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Alertas</p>
              <p className={`text-lg font-bold ${scenarioResult.alertCount > 0 ? 'text-amber-600' : 'text-primary'}`}>
                {scenarioResult.alertCount}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Delta vs actual</p>
              <p className="text-lg font-bold text-foreground">
                {(scenarioResult.pctAvance - report.pctAvanceGlobal).toFixed(1)}pp
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
