import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, AlertTriangle } from 'lucide-react';
import { loadBalanceList, loadBalance } from '@/lib/db';
import type { BalanceReport } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts';

interface BalanceEntry {
  id: string;
  periodo: string;
  archivo_nombre: string;
  created_at: string;
  total_presupuesto: number;
  total_compromiso: number;
  pct_avance_global: number;
}

function fmtShort(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${v < 0 ? '-' : ''}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${v < 0 ? '-' : ''}$${(abs / 1e6).toFixed(0)}M`;
  return `${v < 0 ? '-' : ''}$${(abs / 1e3).toFixed(0)}K`;
}

function DeltaBadge({ val, suffix = '' }: { val: number; suffix?: string }) {
  const isPos = val > 0;
  const isZero = Math.abs(val) < 0.1;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isZero ? 'text-muted-foreground' : isPos ? 'text-amber-600' : 'text-emerald-600'}`}>
      {isZero ? <Minus className="w-3 h-3" /> : isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isZero ? '0' : `${isPos ? '+' : ''}${typeof val === 'number' && suffix === 'pp' ? val.toFixed(1) : fmtShort(val)}`}{suffix}
    </span>
  );
}

export function ComparisonView() {
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [idA, setIdA] = useState<string>('');
  const [idB, setIdB] = useState<string>('');
  const [reportA, setReportA] = useState<BalanceReport | null>(null);
  const [reportB, setReportB] = useState<BalanceReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBalanceList().then((list) => {
      setBalances(list);
      if (list.length >= 2) { setIdA(list[1].id); setIdB(list[0].id); }
      else if (list.length === 1) { setIdA(list[0].id); }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!idA && !idB) return;
    setLoading(true);
    Promise.all([
      idA ? loadBalance(idA).then((d) => d.report) : Promise.resolve(null),
      idB ? loadBalance(idB).then((d) => d.report) : Promise.resolve(null),
    ]).then(([a, b]) => { setReportA(a); setReportB(b); }).catch(console.error).finally(() => setLoading(false));
  }, [idA, idB]);

  const displayA = balances.find((b) => b.id === idA);
  const displayB = balances.find((b) => b.id === idB);

  const chartData = useMemo(() => {
    if (!reportA || !reportB) return [];
    const allCodes = new Set([...reportA.programas.map((p) => p.codigo), ...reportB.programas.map((p) => p.codigo)]);
    return [...allCodes].sort().map((code) => {
      const a = reportA.programas.find((p) => p.codigo === code);
      const b = reportB.programas.find((p) => p.codigo === code);
      return {
        name: code === 'PEE' ? 'PEE' : code.length > 3 ? code : `P${code}`,
        periodoA: a ? Math.round(a.compromiso / 1e6) : 0,
        periodoB: b ? Math.round(b.compromiso / 1e6) : 0,
      };
    });
  }, [reportA, reportB]);

  if (balances.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <GitCompare className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg font-bold">Necesitas al menos 2 balances</p>
        <p className="text-sm mt-1">Sube balances de distintos períodos para poder compararlos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-5">
        <div className="flex items-center gap-3 mb-4">
          <GitCompare className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Comparar dos períodos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Período A (anterior)</label>
            <select value={idA} onChange={(e) => setIdA(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none">
              <option value="">Seleccionar...</option>
              {balances.map((b) => <option key={b.id} value={b.id}>{b.periodo || b.archivo_nombre} ({new Date(b.created_at).toLocaleDateString('es-CL')})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Período B (actual)</label>
            <select value={idB} onChange={(e) => setIdB(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none">
              <option value="">Seleccionar...</option>
              {balances.map((b) => <option key={b.id} value={b.id}>{b.periodo || b.archivo_nombre} ({new Date(b.created_at).toLocaleDateString('es-CL')})</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      {loading && <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>}

      {reportA && reportB && !loading && (
        <>
          {/* KPI Deltas */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Presupuesto', a: reportA.totalPresupuesto, b: reportB.totalPresupuesto },
              { label: 'Ejecutado', a: reportA.totalCompromiso, b: reportB.totalCompromiso },
              { label: 'Saldo', a: reportA.totalSaldo, b: reportB.totalSaldo },
              { label: 'Avance', a: reportA.pctAvanceGlobal, b: reportB.pctAvanceGlobal, isPct: true },
            ].map((kpi) => (
              <div key={kpi.label} className="card-premium p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{displayA?.periodo || 'A'}</p>
                    <p className="text-[14px] font-bold text-foreground">{kpi.isPct ? `${kpi.a.toFixed(1)}%` : fmtShort(kpi.a)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">{displayB?.periodo || 'B'}</p>
                    <p className="text-[14px] font-bold text-foreground">{kpi.isPct ? `${kpi.b.toFixed(1)}%` : fmtShort(kpi.b)}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 text-center">
                  <DeltaBadge val={kpi.b - kpi.a} suffix={kpi.isPct ? 'pp' : ''} />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Chart comparison */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-premium p-6">
            <h3 className="text-sm font-bold text-foreground mb-1">Ejecución por programa (M$)</h3>
            <p className="text-[10px] text-muted-foreground mb-4">{displayA?.periodo || 'A'} vs {displayB?.periodo || 'B'}</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barGap={2} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CL')}M`, '']} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="periodoA" name={displayA?.periodo || 'Período A'} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="periodoB" name={displayB?.periodo || 'Período B'} fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Program detail table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-premium overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Detalle por programa</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-bold text-muted-foreground">Programa</th>
                    <th className="text-right px-4 py-2.5 font-bold text-muted-foreground">% A</th>
                    <th className="text-right px-4 py-2.5 font-bold text-muted-foreground">% B</th>
                    <th className="text-right px-4 py-2.5 font-bold text-muted-foreground">Delta</th>
                    <th className="text-right px-4 py-2.5 font-bold text-muted-foreground">Ejec. A</th>
                    <th className="text-right px-4 py-2.5 font-bold text-muted-foreground">Ejec. B</th>
                    <th className="text-right px-4 py-2.5 font-bold text-muted-foreground">Var. $</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allCodes = new Set([...reportA.programas.map((p) => p.codigo), ...reportB.programas.map((p) => p.codigo)]);
                    return [...allCodes].sort().map((code) => {
                      const a = reportA.programas.find((p) => p.codigo === code);
                      const b = reportB.programas.find((p) => p.codigo === code);
                      const pctA = a?.pctAvance || 0;
                      const pctB = b?.pctAvance || 0;
                      const delta = pctB - pctA;
                      const varMoney = (b?.compromiso || 0) - (a?.compromiso || 0);
                      return (
                        <tr key={code} className="border-b border-border/50 row-highlight">
                          <td className="px-4 py-2.5 font-semibold text-foreground">{a?.nombre || b?.nombre || code}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{pctA.toFixed(1)}%</td>
                          <td className="px-4 py-2.5 text-right font-mono text-foreground font-bold">{pctB.toFixed(1)}%</td>
                          <td className="px-4 py-2.5 text-right"><DeltaBadge val={delta} suffix="pp" /></td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{fmtShort(a?.compromiso || 0)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-foreground">{fmtShort(b?.compromiso || 0)}</td>
                          <td className="px-4 py-2.5 text-right"><DeltaBadge val={varMoney} /></td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
