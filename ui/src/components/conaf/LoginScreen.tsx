import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, ArrowRight, Shield, Eye, Edit3 } from 'lucide-react';
import { loginWithCode, type AppProfile } from '@/lib/auth';
import loginBg from '@/assets/login-bg.jpg';
import logo3d from '@/assets/conaf-logo-3d.png';

interface Props {
  onLogin: (profile: AppProfile) => void;
}

const ROLES = [
  { name: 'Administrador', role: 'Acceso completo', icon: Shield, color: 'bg-emerald-500' },
  { name: 'Editor', role: 'Subir y exportar', icon: Edit3, color: 'bg-blue-500' },
  { name: 'Consulta', role: 'Solo lectura', icon: Eye, color: 'bg-purple-500' },
];

export function LoginScreen({ onLogin }: Props) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError('');

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    if (value && index === 3) {
      const code = newDigits.join('');
      if (code.length === 4) handleLogin(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleLogin = async (code: string) => {
    setLoading(true);
    setError('');
    const profile = await loginWithCode(code);
    if (profile) {
      onLogin(profile);
    } else {
      setError('Código incorrecto');
      setDigits(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
    setLoading(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setDigits(pasted.split(''));
      handleLogin(pasted);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[#060a14]/85 backdrop-blur-sm" />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400/20 rounded-full"
          initial={{ x: `${15 + i * 12}%`, y: `${25 + (i % 4) * 18}%`, opacity: 0 }}
          animate={{
            y: [`${25 + (i % 4) * 18}%`, `${15 + (i % 4) * 12}%`],
            opacity: [0, 0.5, 0],
          }}
          transition={{ duration: 5 + i * 0.5, repeat: Infinity, delay: i * 0.8 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            className="relative inline-block mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 bg-emerald-500/15 rounded-full blur-3xl scale-[2]" />
            <img src={logo3d} alt="CONAFSync" className="relative w-24 h-24 drop-shadow-[0_0_30px_rgba(52,211,153,0.25)]" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CONAF<span className="text-gradient">Sync</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">DEFA CONAF — Los Ríos</p>
        </div>

        {/* Glass card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.07] rounded-2xl p-8 shadow-deep">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Código de acceso</p>
              <p className="text-[11px] text-slate-500">Ingresa tu PIN de 4 dígitos</p>
            </div>
          </div>

          <div className="flex justify-center gap-3.5 mb-7">
            {digits.map((digit, i) => (
              <motion.div key={i} whileFocus={{ scale: 1.05 }}>
                <input
                  ref={inputRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={loading}
                  className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all bg-white/[0.03] text-white
                    ${error ? 'border-red-500/50 shake' : digit ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.1)]' : 'border-white/[0.08] focus:border-emerald-500/40 focus:shadow-[0_0_20px_rgba(52,211,153,0.08)]'}
                    ${loading ? 'opacity-50' : ''}
                  `}
                />
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 justify-center text-red-400 text-sm mb-5"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-center">
              <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Roles */}
        <div className="mt-7 space-y-2">
          {ROLES.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.04] hover:bg-white/[0.05] transition-all cursor-default group"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} style={{ boxShadow: '0 0 8px currentColor' }} />
              <p.icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-colors" />
              <span className="text-[12px] text-slate-400 flex-1 font-medium">{p.name}</span>
              <span className="text-[10px] text-slate-600">{p.role}</span>
              <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-slate-500 transition-colors" />
            </motion.div>
          ))}
        </div>

      </motion.div>

      <style>{`
        .shake { animation: shake 0.4s ease-in-out; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
