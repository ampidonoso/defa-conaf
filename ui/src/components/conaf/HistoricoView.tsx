import { motion } from 'framer-motion';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import type { HistoryEntry } from '@/lib/types';
import emptyState from '@/assets/empty-state.png';

function fmtShort(v: number) {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

interface Props { history: HistoryEntry[]; }

export function HistoricoView({ history }: Props) {
  if (history.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24">
      <motion.img src={emptyState} alt="" className="w-36 h-36 mb-6 drop-shadow-[0_0_20px_rgba(52,211,153,0.15)]" loading="lazy" width={512} height={512}
        animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <p className="text-lg font-bold text-foreground">Sin datos históricos</p>
      <p className="text-sm text-muted-foreground mt-1">Sube balances de diferentes meses para ver tendencias</p>
    </motion.div>
  );

  const chartData = history.map((h) => ({
    mes: h.mes,
    presupuesto: Math.round(h.presupuesto / 1e6),
    ejecutado: Math.round(h.compromiso / 1e6),
    pct: h.pctAvance,
  }));

  const last = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;
  const delta = prev ? last.pctAvance - prev.pctAvance : 0;

  const stats = [
    { label: 'Último período', value: last.mes, icon: Calendar, color: 'text-foreground' },
    { label: 'Ejecución actual', value: `${last.pctAvance.toFixed(1)}%`, icon: TrendingUp, color: last.pctAvance > 90 ? 'text-destructive' : 'text-primary' },
    {
      label: 'Variación mensual',
      value: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp`,
      icon: delta >= 0 ? ArrowUpRight : ArrowDownRight,
      color: delta >= 0 ? 'text-primary' : 'text-destructive',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="card-premium p-5 hover:shadow-card-hover">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart — ComposedChart with bars + line */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card-premium p-6 hover:shadow-card-hover">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Evolución Presupuestaria</h3>
          </div>
          <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">M$</span>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v: number, name: string) => {
                if (name === 'pct') return [`${v.toFixed(1)}%`, '% Avance'];
                return [`$${v.toLocaleString('es-CL')}M`, name === 'presupuesto' ? 'Presupuesto' : 'Ejecutado'];
              }}
              contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="presupuesto" name="Presupuesto" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={32} />
            <Bar yAxisId="left" dataKey="ejecutado" name="Ejecutado" fill="#059669" radius={[6, 6, 0, 0]} barSize={32} />
            <Line yAxisId="right" type="monotone" dataKey="pct" name="% Avance" stroke="#2563eb" strokeWidth={3}
              dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Detalle por Período</h3>
          <span className="text-[10px] text-muted-foreground">{history.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-5 py-3 font-bold text-muted-foreground">Período</th>
                <th className="text-right px-5 py-3 font-bold text-muted-foreground">Presupuesto</th>
                <th className="text-right px-5 py-3 font-bold text-muted-foreground">Ejecutado</th>
                <th className="text-right px-5 py-3 font-bold text-muted-foreground w-48">% Avance</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.03 }}
                  className="border-b border-border/50 row-highlight"
                >
                  <td className="px-5 py-3 font-semibold text-foreground">{h.mes}</td>
                  <td className="px-5 py-3 text-right font-mono-num text-muted-foreground">{fmtShort(h.presupuesto)}</td>
                  <td className="px-5 py-3 text-right font-mono-num text-muted-foreground">{fmtShort(h.compromiso)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(h.pctAvance, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.03 }}
                        />
                      </div>
                      <span className={`font-bold w-14 text-right ${
                        h.pctAvance > 100 ? 'text-destructive' : h.pctAvance > 90 ? 'text-warning' : 'text-foreground'
                      }`}>
                        {h.pctAvance.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
