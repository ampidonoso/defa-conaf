"use client";

import { useAppState } from "@/lib/store";
import { formatMillions, formatCLP, pctColor, cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  TreePine,
  Leaf,
  Shrub,
  Users,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const PROG_META: Record<string, { color: string; icon: typeof Building2 }> = {
  "01": { color: "#059669", icon: Building2 },
  "03": { color: "#dc2626", icon: Flame },
  "04": { color: "#7c3aed", icon: TreePine },
  "05": { color: "#0891b2", icon: Leaf },
  "06": { color: "#d97706", icon: Shrub },
  "07": { color: "#2563eb", icon: Users },
};

export default function Dashboard() {
  const { report } = useAppState();

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Sube un archivo SIGFE para ver el dashboard</p>
      </div>
    );
  }

  const kpis = [
    {
      label: "Presupuesto Total",
      value: formatMillions(report.totalPresupuesto),
      sub: formatCLP(report.totalPresupuesto),
      icon: DollarSign,
      iconColor: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Ejecutado",
      value: `${report.pctAvanceGlobal.toFixed(1)}%`,
      sub: formatCLP(report.totalCompromiso),
      icon: TrendingUp,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      label: "Saldo Disponible",
      value: formatMillions(report.totalSaldo),
      sub: formatCLP(report.totalSaldo),
      icon: Wallet,
      iconColor: "bg-amber-100 text-amber-600",
    },
    {
      label: "Alertas",
      value: String(report.alertas.length),
      sub: report.alertas.filter((a) => a.tipo === "sobregirado").length > 0
        ? `${report.alertas.filter((a) => a.tipo === "sobregirado").length} sobregirados`
        : "Sin sobregiros",
      icon: AlertTriangle,
      iconColor: report.alertas.some((a) => a.tipo === "sobregirado")
        ? "bg-red-100 text-red-600"
        : "bg-amber-100 text-amber-600",
    },
  ];

  const chartData = report.programas.map((p) => ({
    name: p.codigo === "07" ? "PEE" : `CONAF ${p.codigo}`,
    presupuesto: Math.round(p.presupuesto / 1_000_000),
    ejecutado: Math.round(p.compromiso / 1_000_000),
    saldo: Math.round(p.saldo / 1_000_000),
  }));

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {report.oficina} — {report.periodo}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
              </div>
              <div className={cn("p-2.5 rounded-lg", kpi.iconColor)}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">Ejecución por Programa</h2>
        <p className="text-xs text-gray-400 mb-4">Millones de pesos (M$)</p>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} barGap={2} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [`$${Number(v).toLocaleString("es-CL")}M`, ""]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ejecutado" name="Ejecutado" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Program cards + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program cards */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Detalle por Programa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.programas.map((p) => {
              const meta = PROG_META[p.codigo] || { color: "#6b7280", icon: Building2 };
              const Icon = meta.icon;
              return (
                <div key={p.codigo} className="bg-white rounded-xl border p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${meta.color}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-400">{p.items.length} ítems</p>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        pctColor(p.pctAvance)
                      )}
                    >
                      {p.pctAvance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(p.pctAvance, 100)}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Ppto</p>
                      <p className="text-sm font-semibold text-gray-700">{formatMillions(p.presupuesto)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Ejec.</p>
                      <p className="text-sm font-semibold text-gray-700">{formatMillions(p.compromiso)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Saldo</p>
                      <p className="text-sm font-semibold text-gray-700">{formatMillions(p.saldo)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Alertas</h2>
          <div className="space-y-3">
            {report.alertas.length === 0 ? (
              <p className="text-sm text-gray-400">Sin alertas</p>
            ) : (
              report.alertas.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 rounded-lg text-sm",
                    a.tipo === "sobregirado"
                      ? "bg-red-50 text-red-800 border border-red-100"
                      : a.tipo === "alto"
                        ? "bg-amber-50 text-amber-800 border border-amber-100"
                        : "bg-blue-50 text-blue-800 border border-blue-100"
                  )}
                >
                  {a.tipo === "sobregirado" || a.tipo === "alto" ? (
                    <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{a.titulo}</p>
                    <p className="text-xs opacity-75 mt-0.5">{a.mensaje}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
