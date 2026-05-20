import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, Upload, FileSpreadsheet, History,
  Settings, HelpCircle, Zap, GitCompare, LogOut, ChevronRight,
  Hash, Command, FileText, AlertTriangle,
} from 'lucide-react';
import type { BalanceReport } from '@/lib/types';

interface CommandItem {
  id: string;
  label: string;
  desc?: string;
  category: 'Navegación' | 'Programa' | 'Folio' | 'Acción';
  icon: typeof LayoutDashboard;
  action: () => void;
  keywords?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
  report?: BalanceReport | null;
}

export function CommandPalette({ open, onClose, onNavigate, onLogout, report }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build commands dynamically
  const commands = useMemo<CommandItem[]>(() => {
    const navCommands: CommandItem[] = [
      { id: 'nav-dashboard', label: 'Ir a Resumen', desc: 'Dashboard principal', category: 'Navegación', icon: LayoutDashboard, action: () => onNavigate('dashboard'), keywords: ['dashboard', 'inicio', 'home'] },
      { id: 'nav-upload', label: 'Ir a Procesador', desc: 'Subir nuevo archivo SIGFE', category: 'Navegación', icon: Upload, action: () => onNavigate('upload'), keywords: ['subir', 'sigfe', 'procesador'] },
      { id: 'nav-balance', label: 'Ir a Balance', desc: 'Tabla de balance mensual', category: 'Navegación', icon: FileSpreadsheet, action: () => onNavigate('balance'), keywords: ['tabla', 'detalle'] },
      { id: 'nav-history', label: 'Ir a Histórico', desc: 'Evolución mes a mes', category: 'Navegación', icon: History, action: () => onNavigate('history'), keywords: ['historial', 'tendencia'] },
      { id: 'nav-compare', label: 'Ir a Comparador', desc: 'Comparar dos períodos', category: 'Navegación', icon: GitCompare, action: () => onNavigate('compare'), keywords: ['comparacion', 'deltas'] },
      { id: 'nav-analytics', label: 'Ir a Analytics', desc: 'Análisis avanzado', category: 'Navegación', icon: Zap, action: () => onNavigate('analytics'), keywords: ['analisis', 'forecast'] },
      { id: 'nav-help', label: 'Ir a Ayuda', desc: 'Guía de uso', category: 'Navegación', icon: HelpCircle, action: () => onNavigate('help'), keywords: ['ayuda', 'manual', 'guia'] },
      { id: 'nav-settings', label: 'Ir a Configuración', desc: 'Umbrales y ajustes', category: 'Navegación', icon: Settings, action: () => onNavigate('settings'), keywords: ['config', 'ajustes', 'alertas'] },
    ];

    const actionCommands: CommandItem[] = [];
    if (onLogout) {
      actionCommands.push({ id: 'action-logout', label: 'Cerrar sesión', category: 'Acción', icon: LogOut, action: onLogout, keywords: ['salir', 'logout'] });
    }

    // Program commands from current report
    const progCommands: CommandItem[] = [];
    if (report) {
      for (const prog of report.programas) {
        progCommands.push({
          id: `prog-${prog.codigo}`,
          label: prog.nombre,
          desc: `${prog.items.length} ítems · ${prog.pctAvance.toFixed(1)}% avance`,
          category: 'Programa',
          icon: FileSpreadsheet,
          action: () => onNavigate('balance'),
          keywords: [prog.codigo, 'programa'],
        });
      }

      // Top folios (items with highest montos)
      const allItems = report.programas.flatMap((p) => p.items);
      const topItems = [...allItems].sort((a, b) => b.compromiso - a.compromiso).slice(0, 15);
      for (const item of topItems) {
        progCommands.push({
          id: `folio-${item.folio}-${item.tipo}`,
          label: `Folio ${item.folio}: ${item.titulo.substring(0, 50)}`,
          desc: `${item.tipo === 'viatico' ? 'Viático' : 'ByS'} · ${item.pctAvance.toFixed(1)}% · $${(item.compromiso / 1e6).toFixed(1)}M`,
          category: 'Folio',
          icon: Hash,
          action: () => onNavigate('balance'),
          keywords: [String(item.folio), item.titulo.toLowerCase()],
        });
      }
    }

    return [...navCommands, ...progCommands, ...actionCommands];
  }, [report, onNavigate, onLogout]);

  // Fuzzy filter
  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => {
      if (c.label.toLowerCase().includes(q)) return true;
      if (c.desc?.toLowerCase().includes(q)) return true;
      if (c.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [commands, query]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    return groups;
  }, [filtered]);

  // Flat ordered list (for keyboard nav)
  const orderedItems = useMemo(() => {
    const ordered: CommandItem[] = [];
    ['Navegación', 'Programa', 'Folio', 'Acción'].forEach((cat) => {
      if (grouped[cat]) ordered.push(...grouped[cat]);
    });
    return ordered;
  }, [grouped]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Focus input when open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, orderedItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = orderedItems[selectedIdx];
        if (selected) {
          selected.action();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, orderedItems, selectedIdx, onClose]);

  if (!open) return null;

  let flatIdx = 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Palette */}
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Search */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar o escribir comando..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground border border-border">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {orderedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Sin resultados</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Prueba con otra palabra</p>
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                    {category}
                  </p>
                  {items.map((item) => {
                    const isSelected = flatIdx === selectedIdx;
                    const currentIdx = flatIdx++;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { item.action(); onClose(); }}
                        onMouseEnter={() => setSelectedIdx(currentIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {item.label}
                          </p>
                          {item.desc && <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>}
                        </div>
                        {isSelected && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-card border border-border font-mono">↑↓</kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-card border border-border font-mono">↵</kbd>
                Seleccionar
              </span>
              <span className="flex items-center gap-1 hidden sm:inline-flex">
                <kbd className="px-1 py-0.5 rounded bg-card border border-border font-mono">ESC</kbd>
                Cerrar
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>{orderedItems.length} resultados</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
