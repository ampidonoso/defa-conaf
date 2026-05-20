import { motion } from 'framer-motion';
import {
  LogOut,
  X,
  Zap,
} from 'lucide-react';
import logo3d from '@/assets/conaf-logo-3d.png';
import sidebarPattern from '@/assets/sidebar-pattern.jpg';
import iconDashboard from '@/assets/icon-dashboard-3d.png';
import iconUpload from '@/assets/icon-upload-3d.png';
import iconBalance from '@/assets/icon-balance-3d.png';
import iconHistory from '@/assets/icon-history-3d.png';
import type { AppProfile } from '@/lib/auth';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onClose?: () => void;
  profile?: AppProfile | null;
  onLogout?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Resumen', desc: 'Vista general', icon3d: iconDashboard },
  { id: 'upload', label: 'Procesador', desc: 'Importar SIGFE', icon3d: iconUpload },
  { id: 'balance', label: 'Balance', desc: 'Detalle mensual', icon3d: iconBalance },
  { id: 'history', label: 'Histórico', desc: 'Tendencias', icon3d: iconHistory },
  { id: 'analytics', label: 'Analytics', desc: 'Análisis avanzado', icon3d: iconDashboard },
  { id: 'compare', label: 'Comparador', desc: 'Dos períodos', icon3d: iconHistory },
  { id: 'help', label: 'Ayuda', desc: 'Guía de uso', icon3d: iconDashboard },
  { id: 'settings', label: 'Configuración', desc: 'Alertas y ajustes', icon3d: iconDashboard },
];

export function Sidebar({ activeView, onViewChange, onClose, profile, onLogout }: SidebarProps) {
  return (
    <aside className="w-[270px] bg-[#0a0f1e] text-white flex flex-col h-full relative overflow-hidden select-none">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `url(${sidebarPattern})`, backgroundSize: 'cover' }}
      />

      {/* Ambient glows */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-emerald-500/[0.06] rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-600/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <motion.div
            className="relative"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-xl scale-150" />
            <img src={logo3d} alt="" className="relative w-11 h-11 drop-shadow-[0_0_16px_rgba(52,211,153,0.35)]" />
          </motion.div>
          <div>
            <h1 className="text-[17px] font-extrabold tracking-tight leading-none">
              CONAF<span className="text-gradient">Sync</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap className="w-2.5 h-2.5 text-emerald-400" />
              <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                Los Ríos · v2.0
              </p>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-1 custom-scroll-dark overflow-y-auto">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-3 px-3">
          Módulos
        </p>
        {navItems.map((item, idx) => {
          const isActive = activeView === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="w-full relative group"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(20,184,166,0.06) 100%)',
                    boxShadow: 'inset 0 1px 0 0 rgba(52,211,153,0.08)',
                  }}
                  transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-400 rounded-r-full"
                  transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                  style={{ boxShadow: '0 0 12px 2px rgba(52,211,153,0.4)' }}
                />
              )}
              <div className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive ? '' : 'hover:bg-white/[0.03]'
              }`}>
                <motion.div
                  className={`relative shrink-0 transition-all duration-300 ${
                    isActive ? '' : 'grayscale opacity-50 group-hover:opacity-80 group-hover:grayscale-0'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {isActive && (
                    <div className="absolute -inset-1 bg-emerald-500/20 rounded-lg blur-md" />
                  )}
                  <img src={item.icon3d} alt="" className="relative w-8 h-8 drop-shadow-[0_0_8px_rgba(52,211,153,0.25)]" loading="lazy" width={32} height={32} />
                </motion.div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-[13px] font-semibold transition-colors duration-200 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {item.label}
                  </p>
                  <p className={`text-[10px] transition-colors duration-200 ${
                    isActive ? 'text-emerald-500/60' : 'text-slate-600 group-hover:text-slate-500'
                  }`}>
                    {item.desc}
                  </p>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-ring"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* System status */}
      <div className="mx-5 mb-3">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Sistema operativo</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-600">
            <span>Supabase conectado</span>
            <span className="text-emerald-500/70">Online</span>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />

      {/* User */}
      <div className="relative p-4 px-5">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full blur-[6px] opacity-40" />
            <div
              className="relative w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] text-white ring-2 ring-white/10"
              style={{ backgroundColor: profile?.color || '#059669' }}
            >
              {profile?.iniciales || 'US'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[12px] text-slate-200 truncate">
              {profile?.rol === 'admin' ? 'Administrador' : profile?.rol === 'editor' ? 'Editor' : 'Consulta'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {profile?.cargo || 'Sin cargo'}
            </p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
