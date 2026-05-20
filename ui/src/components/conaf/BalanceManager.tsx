import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FileSpreadsheet, Trash2, Eye, CheckCircle, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { loadBalanceList } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BalanceEntry {
  id: string;
  periodo: string;
  archivo_nombre: string;
  created_at: string;
  total_presupuesto: number;
  total_compromiso: number;
  pct_avance_global: number;
}

interface Props {
  currentBalanceId?: string;
  onSelect: (id: string) => void;
  onDeleted: () => void;
  refreshKey?: number;
}

function fmtShort(v: number) {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function BalanceManager({ currentBalanceId, onSelect, onDeleted, refreshKey = 0 }: Props) {
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBalanceList().then(setBalances).catch(console.error);
  }, [refreshKey, currentBalanceId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este balance? Se borrarán todos los datos asociados.')) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('balances').delete().eq('id', id);
      if (error) throw error;
      setBalances((prev) => prev.filter((b) => b.id !== id));
      toast.success('Balance eliminado correctamente');
      if (id === currentBalanceId) onDeleted();
    } catch (err) {
      console.error('Error deleting balance:', err);
      toast.error('Error al eliminar el balance');
    }
    setDeleting(null);
  };

  if (balances.length === 0) return null;

  const current = balances.find((b) => b.id === currentBalanceId) || balances[0];
  const displayPeriodo = (b: BalanceEntry) => b.periodo || b.archivo_nombre || 'Sin nombre';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl text-[12px] font-semibold text-foreground hover:border-primary/40 transition-all shadow-sm"
      >
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <span className="max-w-[100px] sm:max-w-[120px] truncate">{displayPeriodo(current)}</span>
        <span className="text-muted-foreground text-[10px]">({balances.length})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 z-[100] w-[90vw] sm:w-[420px] bg-card rounded-2xl border border-border shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Balances guardados ({balances.length})
              </p>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
              {balances.map((b) => {
                const isCurrent = b.id === currentBalanceId;
                const isDeleting = deleting === b.id;

                return (
                  <div
                    key={b.id}
                    className={`group transition-colors ${
                      isCurrent ? 'bg-primary/[0.04]' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center px-4 py-3 gap-3">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleSelect(b.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <FileSpreadsheet className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-[13px] font-semibold text-foreground truncate">
                            {displayPeriodo(b)}
                          </span>
                          {isCurrent && (
                            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 ml-6">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fmtDate(b.created_at)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                            {fmtShort(b.total_presupuesto)}
                          </span>
                          <span className={`text-[10px] font-bold font-mono tabular-nums ${
                            Number(b.pct_avance_global) > 90 ? 'text-amber-600' : 'text-primary'
                          }`}>
                            {Number(b.pct_avance_global).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelect(b.id); }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Ver este balance"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, b.id)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                          title="Eliminar balance"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
