import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet, TrendingUp, Wallet, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Flame, TreePine as Trees,
  Leaf, Shrub, Users, Building2, ChevronRight, Sparkles, Upload, ArrowRight,
} from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import type { BalanceReport } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import dashboardHero from '@/assets/dashboard-hero.png';
import emptyState from '@/assets/empty-state.png';

function Counter({ value, delay = 0 }: { value: number; delay?: number }) {
  const n = useAnimatedCounter(value, 1400, delay);
  return <>{n.toLocaleString('es-CL')}</>;
}

function MiniRing({ percent, color, size = 48 }: { percent: number; color: string; size?: number }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={center} cy={center} r={r} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth="3.5" />
      <motion.circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * Math.min(percent, 100)) / 100 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        transform={`rotate(-90 ${center} ${center})`} />
      <text x={center} y={center} textAnchor="middle" dominantBaseline="central"
        className="fill-slate-700 text-[10px] font-bold" style={{ fontFamily: 'Inter' }}>
        {Math.round(Math.min(percent, 999))}%
      </text>
    </svg>
  );
}

const PROG_ICONS: Record<string, typeof Building2> = {
  '01': Building2, '03': Flame, '04': Trees, '05': Leaf,
  '05-GBCC': Leaf, '05-FISC': Leaf, '06': Shrub, 'PEE': Users, 'PUMI': Trees,
};
const PROG_COLORS: Record<string, string> = {
  '01': '#059669', '03': '#dc2626', '04': '#7c3aed', '05': '#0891b2',
  '05-GBCC': '#0891b2', '05-FISC': '#0e7490', '06': '#d97706', 'PEE': '#2563eb', 'PUMI': '#8b5cf6',
};

interface Props {
  report: BalanceReport | null;
  onNavigateUpload?: () => void;
  lastUploadDate?: string;
}

export function Dashboard({ report, onNavigateUpload, lastUploadDate }: Props) {
  const [expandedProg, setExpandedProg] = useState<string | null>(null);

  // Calculate days since last upload
  const daysSinceUpload = lastUploadDate
    ? Math.floor((Date.now() - new Date(lastUploadDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (!report) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 sm:py-24">
      <motion.img src={emptyState} alt="" className="w-36 sm:w-44 h-36 sm:h-44 mb-8 drop-shadow-[0_0_30px_rgba(52,211,153,0.15)]" loading="lazy" width={512} height={512}
        animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <p className="text-xl font-bold text-foreground">Sin datos cargados</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center">
        Sube un archivo Balance desde el módulo <span className="text-primary font-semibold">Procesador</span> para comenzar
      </p>
      {onNavigateUpload && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onNavigateUpload}
          className="mt-6 flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-primary to-teal-500 text-primary-foreground rounded-xl font-semibold text-sm hover:shadow-glow transition-all group"
        >
          <Upload className="w-4 h-4" />
          Ir al Procesador
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      )}
    </motion.div>
  );

  const fmtShort = (v: number) => {
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
    return `$${(v / 1e3).toFixed(0)}K`;
  };

  const kpis = [
    { label: 'Presupuesto Total', value: fmtShort(report.totalPresupuesto), raw: report.totalPresupuesto, icon: FileSpreadsheet, gradient: 'from-emerald-500 to-teal-500', bgGrad: 'from-emerald-50 to-teal-50', pct: 100, iconColor: '#059669' },
    { label: 'Ejecución Acumulada', value: fmtShort(report.totalCompromiso), raw: report.totalCompromiso, icon: TrendingUp, gradient: 'from-blue-500 to-indigo-500', bgGrad: 'from-blue-50 to-indigo-50', pct: report.pctAvanceGlobal, iconColor: '#2563eb' },
    { label: 'Saldo Disponible', value: fmtShort(report.totalSaldo), raw: report.totalSaldo, icon: Wallet, gradient: 'from-amber-500 to-orange-500', bgGrad: 'from-amber-50 to-orange-50', pct: (report.totalSaldo / report.totalPresupuesto) * 100, iconColor: '#d97706' },
    { label: 'Avance Global', value: `${report.pctAvanceGlobal.toFixed(1)}%`, raw: report.pctAvanceGlobal, icon: AlertTriangle, gradient: report.pctAvanceGlobal > 90 ? 'from-red-500 to-rose-500' : 'from-emerald-500 to-green-500', bgGrad: report.pctAvanceGlobal > 90 ? 'from-red-50 to-rose-50' : 'from-emerald-50 to-green-50', pct: report.pctAvanceGlobal, iconColor: report.pctAvanceGlobal > 90 ? '#dc2626' : '#059669' },
  ];

  const chartData = report.programas.map((p) => ({
    name: p.codigo === 'PEE' ? 'PEE' : p.codigo.length > 3 ? p.codigo : `P${p.codigo}`,
    presupuesto: Math.round(p.presupuesto / 1e6),
    ejecutado: Math.round(p.compromiso / 1e6),
    pct: p.pctAvance,
    color: PROG_COLORS[p.codigo] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0f1e] via-[#0d1a2d] to-[#0f2027] p-6 sm:p-7 border border-white/[0.06]"
      >
        <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/[0.04] rounded-full blur-3xl" />
        <motion.img
          src={dashboardHero}
          alt=""
          className="absolute -right-2 -top-2 w-32 sm:w-44 h-32 sm:h-44 opacity-50 pointer-events-none"
          loading="lazy" width={512} height={512}
          animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-semibold">
                Período {report.periodo}
              </p>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">Resumen Ejecutivo</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              {report.totalItems ?? report.programas.reduce((s, p) => s + p.items.length, 0)} ítems · {report.programas.length} programas
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-xl px-4 py-3 text-center">
              <p className="text-3xl font-extrabold text-white font-mono tabular-nums">{report.pctAvanceGlobal.toFixed(1)}%</p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Avance global</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload reminder */}
      {daysSinceUpload !== null && daysSinceUpload >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            daysSinceUpload >= 30 ? 'bg-red-50 border-red-200 text-red-800' :
            daysSinceUpload >= 14 ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-[12px] flex-1">
            <span className="font-bold">Hace {daysSinceUpload} días</span> que no se sube un balance.
            {daysSinceUpload >= 30 ? ' Se recomienda actualizar los datos urgentemente.' :
             daysSinceUpload >= 14 ? ' Considera subir datos actualizados.' :
             ' ¿Ya tienes el reporte de este mes?'}
          </p>
          {onNavigateUpload && (
            <button onClick={onNavigateUpload} className="text-[11px] font-bold underline shrink-0">
              Subir ahora
            </button>
          )}
        </motion.div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="card-premium group p-4 sm:p-5 hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${kpi.bgGrad}`}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.iconColor }} />
              </div>
              <MiniRing percent={kpi.pct} color={kpi.iconColor} size={42} />
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">{kpi.value}</p>
            {kpi.raw > 999 && (
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono tabular-nums">${kpi.raw.toLocaleString('es-CL')}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-premium p-4 sm:p-6 hover:shadow-card-hover"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-foreground">Ejecución por Programa</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            Millones (M$)
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-5">Presupuesto vs ejecución acumulada</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={3} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: number, name: string) => [`$${v.toLocaleString('es-CL')}M`, name === 'presupuesto' ? 'Presupuesto' : 'Ejecutado']}
              contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            />
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#e2e8f0" radius={[8, 8, 0, 0]} />
            <Bar dataKey="ejecutado" name="Ejecutado" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Programs + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Programas</h3>
            <span className="text-[10px] text-muted-foreground">{report.programas.length} activos</span>
          </div>
          <div className="space-y-2.5">
            {report.programas.map((p, i) => {
              const Icon = PROG_ICONS[p.codigo] || Building2;
              const color = PROG_COLORS[p.codigo] || '#6b7280';
              const isExpanded = expandedProg === p.codigo;
              return (
                <motion.div
                  key={p.codigo}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                  className="card-premium overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedProg(isExpanded ? null : p.codigo)}
                    className="w-full p-3 sm:p-4 flex items-center gap-3 text-left"
                  >
                    <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${color}10` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-bold text-foreground truncate">{p.nombre}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                          p.pctAvance > 100 ? 'bg-red-50 text-red-600' : p.pctAvance > 90 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {p.pctAvance.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                        <motion.div
                          className="h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(p.pctAvance, 100)}%` }}
                          transition={{ duration: 1.2, delay: 0.6 + i * 0.04 }}
                        />
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 sm:px-4 pb-4 pt-0 border-t border-border">
                          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 text-center">
                            <div className="bg-muted rounded-xl py-2.5">
                              <p className="text-[10px] text-muted-foreground">Presupuesto</p>
                              <p className="text-[12px] sm:text-[13px] font-bold text-foreground font-mono tabular-nums">{fmtShort(p.presupuesto)}</p>
                            </div>
                            <div className="bg-muted rounded-xl py-2.5">
                              <p className="text-[10px] text-muted-foreground">Ejecutado</p>
                              <p className="text-[12px] sm:text-[13px] font-bold text-foreground font-mono tabular-nums">{fmtShort(p.compromiso)}</p>
                            </div>
                            <div className="bg-muted rounded-xl py-2.5">
                              <p className="text-[10px] text-muted-foreground">Saldo</p>
                              <p className={`text-[12px] sm:text-[13px] font-bold font-mono tabular-nums ${p.saldo < 0 ? 'text-destructive' : 'text-foreground'}`}>
                                {fmtShort(p.saldo)}
                              </p>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">{p.items.length} líneas presupuestarias</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-foreground">Alertas</h3>
            {report.alertas.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {report.alertas.length}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {report.alertas.length === 0 ? (
              <div className="card-premium p-6 text-center">
                <p className="text-sm text-muted-foreground">✓ Sin alertas activas</p>
              </div>
            ) : (
              report.alertas.slice(0, 10).map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.04 }}
                  className={`px-3.5 py-3 rounded-xl text-[12px] border transition-all hover:shadow-sm ${
                    a.tipo === 'sobregirado'
                      ? 'bg-red-50 text-red-800 border-red-100'
                      : a.tipo === 'alto'
                      ? 'bg-amber-50 text-amber-800 border-amber-100'
                      : 'bg-blue-50 text-blue-800 border-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {a.tipo === 'sobregirado' || a.tipo === 'alto'
                      ? <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      : <ArrowDownRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{a.titulo}</p>
                      <p className="text-[10px] opacity-75 mt-0.5">{a.mensaje}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
