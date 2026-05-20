import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Hash, Tag, DollarSign, TrendingUp, AlertTriangle,
  Calendar, Copy, CheckCircle, Wallet, Info,
} from 'lucide-react';
import type { BalanceItem } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  item: BalanceItem | null;
  programaNombre?: string;
  oficinaNombre?: string;
  onClose: () => void;
}

function formatCLP(v: number): string {
  return v < 0 ? `-$${Math.abs(v).toLocaleString('es-CL')}` : `$${v.toLocaleString('es-CL')}`;
}

function fmtShort(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${v < 0 ? '-' : ''}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${v < 0 ? '-' : ''}$${(abs / 1e6).toFixed(1)}M`;
  return `${v < 0 ? '-' : ''}$${(abs / 1e3).toFixed(0)}K`;
}

function getStatus(pct: number): { label: string; color: string; bg: string; icon: typeof AlertTriangle } {
  if (pct > 100) return { label: 'Sobregirado', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: AlertTriangle };
  if (pct > 90) return { label: 'Crítico', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: AlertTriangle };
  if (pct >= 30) return { label: 'Normal', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle };
  return { label: 'Sub-ejecutado', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: Info };
}

export function ItemDetailModal({ item, programaNombre, oficinaNombre, onClose }: Props) {
  if (!item) return null;

  const status = getStatus(item.pctAvance);
  const StatusIcon = status.icon;

  const copyDetails = () => {
    const text = `Folio: ${item.folio}
Título: ${item.titulo}
Tipo: ${item.tipo === 'viatico' ? 'Viático' : 'Bienes y Servicios'}
Programa: ${programaNombre || item.programa}
${oficinaNombre ? `Oficina: ${oficinaNombre}\n` : ''}Presupuesto: ${formatCLP(item.presupuesto)}
Compromiso: ${formatCLP(item.compromiso)}
Saldo: ${formatCLP(item.saldo)}
% Avance: ${item.pctAvance.toFixed(2)}%
Estado: ${status.label}`;
    navigator.clipboard.writeText(text);
    toast.success('Detalles copiados al portapapeles');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-muted/40 to-transparent">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg ${item.tipo === 'viatico' ? 'bg-purple-100' : 'bg-primary/10'}`}>
                <Hash className={`w-4 h-4 ${item.tipo === 'viatico' ? 'text-purple-600' : 'text-primary'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Folio {item.folio}</p>
                <p className="text-sm font-bold text-foreground truncate">{item.titulo}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                item.tipo === 'viatico' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-muted text-foreground border border-border'
              }`}>
                <Tag className="w-3 h-3" />
                {item.tipo === 'viatico' ? 'Viático' : 'Bienes y Servicios'}
              </span>
              {programaNombre && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <Calendar className="w-3 h-3" />
                  {programaNombre}
                </span>
              )}
              {oficinaNombre && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {oficinaNombre}
                </span>
              )}
            </div>

            {/* Status banner */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${status.bg}`}>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <div className="flex-1">
                <p className={`text-sm font-bold ${status.color}`}>{status.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.pctAvance.toFixed(2)}% de ejecución</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-extrabold ${status.color}`}>{item.pctAvance.toFixed(1)}%</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div className="relative w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    item.pctAvance > 100 ? 'bg-red-500' : item.pctAvance > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.pctAvance, 100)}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
                {item.pctAvance > 100 && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-red-700" />
                )}
              </div>
            </div>

            {/* Amounts grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Presupuesto', value: item.presupuesto, short: fmtShort(item.presupuesto), icon: DollarSign, color: 'text-emerald-600' },
                { label: 'Compromiso', value: item.compromiso, short: fmtShort(item.compromiso), icon: TrendingUp, color: 'text-blue-600' },
                { label: 'Saldo', value: item.saldo, short: fmtShort(item.saldo), icon: Wallet, color: item.saldo < 0 ? 'text-red-600' : 'text-amber-600' },
              ].map((a) => (
                <div key={a.label} className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <a.icon className={`w-3 h-3 ${a.color}`} />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{a.label}</p>
                  </div>
                  <p className={`text-lg font-extrabold ${a.color} font-mono tabular-nums`}>{a.short}</p>
                  <p className="text-[9px] text-muted-foreground font-mono tabular-nums mt-0.5">
                    {formatCLP(a.value)}
                  </p>
                </div>
              ))}
            </div>

            {/* Extra info */}
            <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border text-[12px]">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Folio SIGFE</span>
                <span className="font-mono font-semibold text-foreground">#{item.folio}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Código programa</span>
                <span className="font-mono font-semibold text-foreground">{item.programaCodigo}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-muted-foreground">% Avance exacto</span>
                <span className="font-mono font-semibold text-foreground">{item.pctAvance.toFixed(4)}%</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Clasificación</span>
                <span className={`font-semibold ${status.color}`}>{status.label}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
            <button
              onClick={copyDetails}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors text-[11px] font-semibold text-foreground"
            >
              <Copy className="w-3 h-3" />
              Copiar detalles
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:shadow-glow transition-all text-[11px] font-semibold"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
