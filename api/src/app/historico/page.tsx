"use client";

import { useAppState } from "@/lib/store";
import { formatMillions, cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function HistoricoPage() {
  const { history } = useAppState();

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No hay datos históricos aún</p>
      </div>
    );
  }

  const chartData = history.map((h) => ({
    mes: h.mes,
    presupuesto: h.presupuesto / 1_000_000,
    compromiso: h.compromiso / 1_000_000,
    pct: h.pctAvance,
  }));

  const last = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;
  const delta = prev ? last.pctAvance - prev.pctAvance : 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
        <p className="text-gray-500 mt-1">Evolución mensual de la ejecución presupuestaria</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <p className="text-sm text-gray-500">Último período</p>
          <p className="text-xl font-bold mt-1">{last.mes}</p>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <p className="text-sm text-gray-500">Ejecución actual</p>
          <p className="text-xl font-bold mt-1">{last.pctAvance.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <p className="text-sm text-gray-500">Variación mensual</p>
          <p
            className={cn(
              "text-xl font-bold mt-1",
              delta >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}pp
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-gray-900">Ejecución vs Presupuesto (M$)</h2>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`$${Number(v).toFixed(0)}M`, ""]} />
            <Area
              type="monotone"
              dataKey="presupuesto"
              name="Presupuesto"
              stroke="#d1d5db"
              fill="#f3f4f6"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="compromiso"
              name="Ejecutado"
              stroke="#059669"
              fill="#d1fae5"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mes</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Presupuesto</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Ejecutado</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">% Avance</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{h.mes}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">
                  {formatMillions(h.presupuesto)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">
                  {formatMillions(h.compromiso)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(h.pctAvance, 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-700 font-medium w-12 text-right">
                      {h.pctAvance.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
