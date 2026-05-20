import { useState, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, Filter, ChevronDown, ChevronRight, Search, SlidersHorizontal, X, ArrowUpDown, Maximize2, Minimize2 } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { ItemDetailModal } from './ItemDetailModal';
import type { BalanceReport, ProgramaSummary, BalanceItem } from '@/lib/types';
import type { ParseResult } from '@/lib/parser';
import emptyState from '@/assets/empty-state.png';

function formatCLP(v: number): string {
  return v < 0 ? `-$${Math.abs(v).toLocaleString('es-CL')}` : `$${v.toLocaleString('es-CL')}`;
}

function pctBadge(pct: number) {
  const cls = pct > 100 ? 'bg-red-50 text-red-600 border-red-100' : pct > 90 ? 'bg-amber-50 text-amber-600 border-amber-100' : pct > 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls} font-mono`}>{pct.toFixed(1)}%</span>;
}

interface Props {
  report: BalanceReport | null;
  parseResult: ParseResult | null;
  canExport?: boolean;
}

type SortKey = 'titulo' | 'folio' | 'presupuesto' | 'compromiso' | 'saldo' | 'pctAvance';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'todos' | 'sobregirado' | 'critico' | 'normal' | 'subejecutado';

export function BalanceTable({ report, parseResult, canExport = true }: Props) {
  const [oficina, setOficina] = useState('consolidado');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'bys' | 'viatico'>('todos');
  const [exportOpen, setExportOpen] = useState(false);
  const [expandedProgs, setExpandedProgs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [avanceRange, setAvanceRange] = useState<[number, number]>([0, 200]);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedItem, setSelectedItem] = useState<{ item: BalanceItem; progNombre: string } | null>(null);

  const oficinaTabs = useMemo(() => {
    const tabs = [{ key: 'consolidado', label: 'Consolidado' }];
    if (parseResult) parseResult.oficinas.forEach((o) => tabs.push({ key: o.nombre, label: o.nombre }));
    return tabs;
  }, [parseResult]);

  const baseProgramas: ProgramaSummary[] = useMemo(() => {
    if (oficina === 'consolidado' || !parseResult || !report) return report?.programas ?? [];
    const found = parseResult.oficinas.find((o) => o.nombre === oficina);
    return found ? found.programas : report.programas;
  }, [oficina, parseResult, report]);

  if (!report) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24">
      <motion.img src={emptyState} alt="" className="w-36 h-36 mb-6 drop-shadow-[0_0_20px_rgba(52,211,153,0.15)]" loading="lazy" width={512} height={512}
        animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <p className="text-lg font-bold text-foreground">Sin balance disponible</p>
      <p className="text-sm text-muted-foreground mt-1">Sube un archivo desde el módulo Procesador para ver la tabla</p>
    </motion.div>
  );

  const filteredProgramas = baseProgramas.map((prog) => {
    let items = filterTipo === 'todos' ? prog.items : prog.items.filter((i) => i.tipo === filterTipo);

    // Text search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.titulo.toLowerCase().includes(q) || String(i.folio).includes(q));
    }

    // Avance range filter
    items = items.filter((i) => i.pctAvance >= avanceRange[0] && i.pctAvance <= avanceRange[1]);

    // Status filter
    if (statusFilter !== 'todos') {
      items = items.filter((i) => {
        if (statusFilter === 'sobregirado') return i.pctAvance > 100;
        if (statusFilter === 'critico') return i.pctAvance > 90 && i.pctAvance <= 100;
        if (statusFilter === 'normal') return i.pctAvance >= 30 && i.pctAvance <= 90;
        if (statusFilter === 'subejecutado') return i.pctAvance < 30;
        return true;
      });
    }

    // Sort
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        if (typeof av === 'string' && typeof bv === 'string') {
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      });
    }

    const presupuesto = items.reduce((s, i) => s + i.presupuesto, 0);
    const compromiso = items.reduce((s, i) => s + i.compromiso, 0);
    return { ...prog, items, presupuesto, compromiso, saldo: presupuesto - compromiso, pctAvance: presupuesto > 0 ? (compromiso / presupuesto) * 100 : 0 };
  }).filter((p) => p.items.length > 0);

  const activeFilterCount = [
    filterTipo !== 'todos',
    search !== '',
    statusFilter !== 'todos',
    avanceRange[0] !== 0 || avanceRange[1] !== 200,
    sortKey !== null,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterTipo('todos');
    setSearch('');
    setStatusFilter('todos');
    setAvanceRange([0, 200]);
    setSortKey(null);
    setSortDir('desc');
  };

  const expandAll = () => {
    setExpandedProgs(new Set(filteredProgramas.map((p) => p.codigo)));
  };
  const collapseAll = () => setExpandedProgs(new Set());

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const totalPpto = filteredProgramas.reduce((s, p) => s + p.presupuesto, 0);
  const totalComp = filteredProgramas.reduce((s, p) => s + p.compromiso, 0);
  const totalSaldo = totalPpto - totalComp;
  const totalPct = totalPpto > 0 ? (totalComp / totalPpto) * 100 : 0;

  const toggleProg = (codigo: string) => {
    setExpandedProgs((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo); else next.add(codigo);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Oficina tabs */}
          <div className="flex bg-muted rounded-xl p-1 overflow-x-auto max-w-full">
            {oficinaTabs.map((o) => (
              <button key={o.key} onClick={() => setOficina(o.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${
                  oficina === o.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {o.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {(['todos', 'bys', 'viatico'] as const).map((t) => (
              <button key={t} onClick={() => setFilterTipo(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  filterTipo === t
                    ? (t === 'viatico' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-primary/10 text-primary border-primary/20')
                    : 'bg-card text-muted-foreground border-border hover:border-border/80'
                }`}>
                {t === 'todos' ? 'Todos' : t === 'bys' ? 'ByS' : 'Viáticos'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-card border border-border rounded-lg text-[12px] focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none w-full sm:w-36 transition-all"
            />
          </div>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              showAdvancedFilters || activeFilterCount > 0
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-card text-muted-foreground border-border'
            }`}
            title="Filtros avanzados"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Expand/Collapse */}
          <div className="flex gap-0.5">
            <button onClick={expandAll} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Expandir todos">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={collapseAll} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Colapsar todos">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {canExport && (
            <button onClick={() => setExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-teal-500 text-primary-foreground rounded-xl text-[12px] font-semibold hover:shadow-glow transition-all shrink-0">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card-premium p-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status filter */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Estado</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: 'todos', label: 'Todos', color: 'bg-muted text-muted-foreground border-border' },
                    { key: 'sobregirado', label: 'Sobregirado', color: 'bg-red-50 text-red-600 border-red-100' },
                    { key: 'critico', label: 'Crítico', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                    { key: 'normal', label: 'Normal', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                    { key: 'subejecutado', label: 'Sub-ejec.', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setStatusFilter(s.key as StatusFilter)}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-all ${
                        statusFilter === s.key ? s.color : 'bg-card text-muted-foreground border-border opacity-50 hover:opacity-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avance range */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">
                  Rango de avance: {avanceRange[0]}% — {avanceRange[1]}%
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={200} value={avanceRange[0]}
                    onChange={(e) => setAvanceRange([Number(e.target.value), avanceRange[1]])}
                    className="w-14 px-2 py-1 text-[11px] text-center rounded border border-border bg-card"
                  />
                  <div className="flex-1 flex gap-1.5">
                    {[
                      { label: 'Alto', range: [90, 200] as [number, number] },
                      { label: 'Mid', range: [50, 90] as [number, number] },
                      { label: 'Bajo', range: [0, 30] as [number, number] },
                      { label: 'Todo', range: [0, 200] as [number, number] },
                    ].map((r) => (
                      <button
                        key={r.label}
                        onClick={() => setAvanceRange(r.range)}
                        className="px-1.5 py-1 text-[9px] rounded border border-border text-muted-foreground hover:bg-muted font-semibold"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number" min={0} max={200} value={avanceRange[1]}
                    onChange={(e) => setAvanceRange([avanceRange[0], Number(e.target.value)])}
                    className="w-14 px-2 py-1 text-[11px] text-center rounded border border-border bg-card"
                  />
                </div>
              </div>

              {/* Sort + Clear */}
              <div className="flex items-end justify-between gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Ordenar por</label>
                  <select
                    value={sortKey || ''}
                    onChange={(e) => {
                      const val = e.target.value as SortKey | '';
                      setSortKey(val || null);
                    }}
                    className="w-full px-2 py-1.5 text-[11px] rounded-lg border border-border bg-card font-medium"
                  >
                    <option value="">Sin orden</option>
                    <option value="pctAvance">% Avance</option>
                    <option value="presupuesto">Presupuesto</option>
                    <option value="compromiso">Compromiso</option>
                    <option value="saldo">Saldo</option>
                    <option value="folio">Folio</option>
                    <option value="titulo">Título</option>
                  </select>
                </div>
                {sortKey && (
                  <button
                    onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                    className="p-2 rounded-lg bg-card border border-border hover:bg-muted"
                    title="Cambiar dirección"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-[10px] font-semibold transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Presupuesto', value: formatCLP(totalPpto), accent: 'border-l-primary' },
          { label: 'Compromiso', value: formatCLP(totalComp), accent: 'border-l-info' },
          { label: 'Saldo', value: formatCLP(totalSaldo), accent: 'border-l-warning' },
          { label: 'Avance', value: `${totalPct.toFixed(1)}%`, accent: 'border-l-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className={`card-premium border-l-4 px-4 py-3 ${s.accent}`}>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{s.label}</p>
            <p className="text-[13px] sm:text-[14px] font-bold text-foreground font-mono tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]" style={{ minWidth: 700 }}>
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-3 py-3 font-bold text-muted-foreground" style={{ width: 36 }}></th>
                <th className="text-left px-3 py-3 font-bold text-muted-foreground" style={{ width: 56 }}>Folio</th>
                <th className="text-left px-3 py-3 font-bold text-muted-foreground">Título</th>
                <th className="text-center px-3 py-3 font-bold text-muted-foreground" style={{ width: 64 }}>Tipo</th>
                <th className="text-right px-3 py-3 font-bold text-muted-foreground font-mono" style={{ width: 130 }}>Presupuesto</th>
                <th className="text-right px-3 py-3 font-bold text-muted-foreground font-mono" style={{ width: 130 }}>Compromiso</th>
                <th className="text-right px-3 py-3 font-bold text-muted-foreground font-mono" style={{ width: 130 }}>Saldo</th>
                <th className="text-right px-3 py-3 font-bold text-muted-foreground" style={{ width: 80 }}>Avance</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgramas.map((prog) => {
                const isExpanded = expandedProgs.has(prog.codigo);
                return (
                  <Fragment key={prog.codigo}>
                    <tr
                      className="bg-primary/[0.04] border-t-2 border-primary/20 cursor-pointer hover:bg-primary/[0.06] transition-colors"
                      onClick={() => toggleProg(prog.codigo)}
                    >
                      <td className="px-3 py-2.5">
                        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </td>
                      <td colSpan={2} className="px-3 py-2.5 font-bold text-primary">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span className="truncate">{prog.nombre}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({prog.items.length})</span>
                        </div>
                      </td>
                      <td></td>
                      <td className="text-right px-3 py-2.5 font-bold text-primary font-mono tabular-nums text-[11px]">{formatCLP(prog.presupuesto)}</td>
                      <td className="text-right px-3 py-2.5 font-bold text-primary font-mono tabular-nums text-[11px]">{formatCLP(prog.compromiso)}</td>
                      <td className="text-right px-3 py-2.5 font-bold text-primary font-mono tabular-nums text-[11px]">{formatCLP(prog.saldo)}</td>
                      <td className="text-right px-3 py-2.5">{pctBadge(prog.pctAvance)}</td>
                    </tr>
                    <AnimatePresence>
                      {isExpanded && prog.items.map((item, idx) => (
                        <motion.tr
                          key={`${prog.codigo}-${item.folio}-${item.tipo}-${idx}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onClick={() => setSelectedItem({ item, progNombre: prog.nombre })}
                          className="border-b border-border/50 row-highlight cursor-pointer"
                        >
                          <td></td>
                          <td className="px-3 py-2 text-muted-foreground text-center font-mono tabular-nums">{item.folio}</td>
                          <td className="px-3 py-2 text-foreground truncate max-w-[200px] sm:max-w-none">{item.titulo}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              item.tipo === 'viatico' ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'
                            }`}>
                              {item.tipo === 'viatico' ? 'Viát.' : 'ByS'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{formatCLP(item.presupuesto)}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{formatCLP(item.compromiso)}</td>
                          <td className={`px-3 py-2 text-right font-mono tabular-nums ${item.saldo < 0 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            {formatCLP(item.saldo)}
                          </td>
                          <td className="px-3 py-2 text-right">{pctBadge(item.pctAvance)}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
              <tr className="bg-foreground text-background font-bold">
                <td></td>
                <td colSpan={3} className="px-3 py-3">TOTAL GENERAL</td>
                <td className="text-right px-3 py-3 font-mono tabular-nums text-[11px]">{formatCLP(totalPpto)}</td>
                <td className="text-right px-3 py-3 font-mono tabular-nums text-[11px]">{formatCLP(totalComp)}</td>
                <td className="text-right px-3 py-3 font-mono tabular-nums text-[11px]">{formatCLP(totalSaldo)}</td>
                <td className="text-right px-3 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/20 font-mono">{totalPct.toFixed(1)}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal report={report} open={exportOpen} onClose={() => setExportOpen(false)} />

      <ItemDetailModal
        item={selectedItem?.item || null}
        programaNombre={selectedItem?.progNombre}
        oficinaNombre={oficina === 'consolidado' ? undefined : oficina}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
