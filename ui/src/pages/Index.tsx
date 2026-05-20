import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/conaf/Sidebar';
import { Dashboard } from '@/components/conaf/Dashboard';
import { MultiUploadView } from '@/components/conaf/MultiUploadView';
import { BalanceTable } from '@/components/conaf/BalanceTable';
import { HistoricoView } from '@/components/conaf/HistoricoView';
import { SettingsPanel } from '@/components/conaf/SettingsPanel';
import { NotesPanel } from '@/components/conaf/NotesPanel';
import { AnalyticsPanel } from '@/components/conaf/AnalyticsPanel';
import { HelpGuide } from '@/components/conaf/HelpGuide';
import { CommandPalette } from '@/components/conaf/CommandPalette';
import { ComparisonView } from '@/components/conaf/ComparisonView';
import { Search, Bell, Menu, Loader2, Lock, Sparkles, Command } from 'lucide-react';
import { useIsMobile } from '@/hooks/useAnimatedCounter';
import type { BalanceReport, HistoryEntry } from '@/lib/types';
import type { ParseResult } from '@/lib/parser';
import { saveBalance, loadBalanceList, loadBalance, loadHistory } from '@/lib/db';
import { BalanceManager } from '@/components/conaf/BalanceManager';
import { LoginScreen } from '@/components/conaf/LoginScreen';
import { getStoredProfile, logout, canUpload, type AppProfile } from '@/lib/auth';
import { toast } from 'sonner';

const viewMeta: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Resumen Ejecutivo', subtitle: 'Vista consolidada de la gestión presupuestaria regional' },
  upload: { title: 'Procesador SIGFE', subtitle: 'Importa y consolida datos automáticamente' },
  balance: { title: 'Balance Mensual', subtitle: 'Desglose detallado por programa, oficina y subtítulo' },
  history: { title: 'Análisis Histórico', subtitle: 'Tendencias de ejecución y proyecciones' },
  analytics: { title: 'Analytics Avanzado', subtitle: 'Salud presupuestaria, forecast, varianza y simulador' },
  compare: { title: 'Comparador', subtitle: 'Compara dos períodos lado a lado' },
  help: { title: 'Ayuda', subtitle: 'Guía paso a paso para usar la plataforma' },
  settings: { title: 'Configuración', subtitle: 'Umbrales de alerta y preferencias del sistema' },
};

const pageVariants = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2 } },
};

const Index = () => {
  const [profile, setProfile] = useState<AppProfile | null>(getStoredProfile);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [report, setReport] = useState<BalanceReport | null>(null);
  const [oficinas, setOficinas] = useState<{ nombre: string; programas: any[] }[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentBalanceId, setCurrentBalanceId] = useState<string | undefined>();
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const [lastUploadDate, setLastUploadDate] = useState<string | undefined>();
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const isMobile = useIsMobile(1024);
  const view = viewMeta[activeView];

  // Global Cmd+K / Ctrl+K shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setProfile(null);
  }, []);

  useEffect(() => {
    if (!profile) return;

    (async () => {
      try {
        const [balances, hist] = await Promise.all([loadBalanceList(), loadHistory()]);
        setHistory(hist);
        if (balances.length > 0) {
          const latest = balances[0];
          setCurrentBalanceId(latest.id);
          setLastUploadDate(latest.created_at);
          const data = await loadBalance(latest.id);
          setReport(data.report);
          setOficinas(data.oficinas);
        }
      } catch (err) {
        console.error('Error loading from Supabase:', err);
        toast.error('Error al cargar datos desde Supabase');
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const handleSelectBalance = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await loadBalance(id);
      setReport(data.report);
      setOficinas(data.oficinas);
      setCurrentBalanceId(id);
      setParseResult(null);
    } catch (err) {
      console.error('Error loading balance:', err);
      toast.error('Error al cargar el balance');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBalanceDeleted = useCallback(async () => {
    setReport(null);
    setOficinas([]);
    setCurrentBalanceId(undefined);
    setBalanceRefreshKey((k) => k + 1);
    const hist = await loadHistory();
    setHistory(hist);
    const balances = await loadBalanceList();
    if (balances.length > 0) handleSelectBalance(balances[0].id);
  }, [handleSelectBalance]);

  const handleDataLoaded = useCallback(async (result: ParseResult, fileName: string, replaceId?: string) => {
    setParseResult(result);
    setReport(result.consolidado);
    setOficinas(result.oficinas);

    setSaving(true);
    try {
      const newId = await saveBalance(result, fileName, profile?.id, replaceId);
      setCurrentBalanceId(newId);
      setBalanceRefreshKey((k) => k + 1);
      const hist = await loadHistory();
      setHistory(hist);
      toast.success('Balance guardado exitosamente en Supabase', {
        description: `${result.consolidado.periodo} — ${result.oficinas.length} oficinas`,
      });
    } catch (err) {
      console.error('Error saving to Supabase:', err);
      toast.error('Error al guardar en Supabase', {
        description: 'Los datos se mantienen en memoria pero no se persistieron.',
      });
      setHistory((prev) => [
        ...prev,
        {
          mes: result.consolidado.periodo || new Date().toLocaleDateString('es-CL'),
          presupuesto: result.consolidado.totalPresupuesto,
          compromiso: result.consolidado.totalCompromiso,
          pctAvance: result.consolidado.pctAvanceGlobal,
        },
      ]);
    } finally {
      setSaving(false);
    }
  }, [profile?.id]);

  const handleNav = (v: string) => {
    setActiveView(v);
    if (isMobile) setSidebarOpen(false);
  };

  const pseudoParseResult = parseResult || (oficinas.length > 0 ? {
    oficinas,
    consolidado: report!,
  } as ParseResult : null);

  if (!profile) {
    return <LoginScreen onLogin={(p) => setProfile(p)} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto w-16 h-16 mb-5">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-glow-pulse" />
            <div className="relative flex items-center justify-center w-full h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">Cargando datos</p>
          <p className="text-xs text-muted-foreground mt-1">Conectando con Supabase...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobile || sidebarOpen) && (
          <motion.div
            initial={isMobile ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`${isMobile ? 'fixed z-50 h-full' : 'relative'} shrink-0`}
          >
            <Sidebar
              activeView={activeView}
              onViewChange={handleNav}
              onClose={isMobile ? () => setSidebarOpen(false) : undefined}
              profile={profile}
              onLogout={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="glass-strong border-b border-border/50 px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-1 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg lg:text-[20px] font-extrabold text-foreground tracking-tight truncate">DEFA CONAF LOS RÍOS</h1>
              <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">{view?.title} — {view?.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Command palette trigger */}
            <button
              onClick={() => setCmdPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted/60 border border-border/60 rounded-xl text-sm text-muted-foreground hover:bg-card hover:border-primary/30 transition-all group"
              title="Abrir búsqueda rápida (Cmd+K)"
            >
              <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="hidden lg:inline text-[12px]">Buscar o saltar a...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono ml-2">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>

            {/* Notifications */}
            <button className="relative p-2.5 text-muted-foreground hover:text-foreground transition-all hover:bg-muted rounded-xl">
              <Bell className="w-[18px] h-[18px]" />
              {report && report.alertas.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
              )}
            </button>

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Balance selector */}
            <BalanceManager
              currentBalanceId={currentBalanceId}
              onSelect={handleSelectBalance}
              onDeleted={handleBalanceDeleted}
              refreshKey={balanceRefreshKey}
            />

            {/* Status */}
            <div className="hidden sm:flex items-center gap-2 bg-card border border-border text-foreground text-[11px] px-3.5 py-2 rounded-xl font-semibold shadow-sm">
              {saving ? (
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${report ? 'bg-primary' : 'bg-muted-foreground'} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${report ? 'bg-primary' : 'bg-muted-foreground'}`} />
                </span>
              )}
              {saving ? 'Guardando...' : report ? report.periodo : 'Sin datos'}
            </div>

            {/* User */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground text-[11px] font-bold ring-2 ring-primary/20"
                style={{ backgroundColor: profile.color }}
              >
                {profile.iniciales}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-semibold text-foreground leading-tight">{profile.nombre}</p>
                <p className="text-[9px] text-muted-foreground">
                  {profile.rol === 'admin' ? 'Administrador' : profile.rol === 'editor' ? 'Editor' : 'Lectura'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activeView} variants={pageVariants} initial="initial" animate="animate" exit="exit">
                {activeView === 'dashboard' && <Dashboard report={report} onNavigateUpload={() => handleNav('upload')} lastUploadDate={lastUploadDate} />}
                {activeView === 'upload' && (
                  canUpload(profile.rol)
                    ? <MultiUploadView onNavigateBalance={() => handleNav('balance')} onDataLoaded={handleDataLoaded} />
                    : (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Lock className="w-8 h-8 mb-3 text-muted-foreground/50" />
                        <p className="font-semibold">Sin permisos</p>
                        <p className="text-sm mt-1">Tu perfil no tiene acceso para subir archivos</p>
                      </div>
                    )
                )}
                {activeView === 'balance' && (
                  <div className="space-y-6">
                    <BalanceTable
                      report={report}
                      parseResult={pseudoParseResult}
                      canExport={profile.rol === 'admin' || profile.rol === 'editor'}
                    />
                    {currentBalanceId && (
                      <NotesPanel
                        balanceId={currentBalanceId}
                        profileId={profile.id}
                        isAdmin={profile.rol === 'admin'}
                      />
                    )}
                  </div>
                )}
                {activeView === 'history' && <HistoricoView history={history} />}
                {activeView === 'analytics' && <AnalyticsPanel report={report} history={history} />}
                {activeView === 'compare' && <ComparisonView />}
                {activeView === 'help' && <HelpGuide />}
                {activeView === 'settings' && (
                  <SettingsPanel profileId={profile.id} isAdmin={profile.rol === 'admin'} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <CommandPalette
        open={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onNavigate={(v) => { handleNav(v); setCmdPaletteOpen(false); }}
        onLogout={handleLogout}
        report={report}
      />
    </div>
  );
};

export default Index;
