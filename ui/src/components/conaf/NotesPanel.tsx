import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, CheckCircle, AlertTriangle, Zap, Eye, Send, X } from 'lucide-react';
import { loadNotes, addNote, resolveNote, type BalanceNote } from '@/lib/settings';
import { toast } from 'sonner';

interface Props {
  balanceId?: string;
  profileId?: string;
  isAdmin: boolean;
  programaCodigo?: string;
}

const TIPO_META: Record<string, { label: string; icon: typeof MessageSquare; color: string; bg: string }> = {
  observacion: { label: 'Observación', icon: Eye, color: 'text-slate-600', bg: 'bg-slate-50' },
  accion: { label: 'Acción requerida', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
  alerta_manual: { label: 'Alerta manual', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  resuelto: { label: 'Resuelto', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export function NotesPanel({ balanceId, profileId, isAdmin, programaCodigo }: Props) {
  const [notes, setNotes] = useState<BalanceNote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newNota, setNewNota] = useState('');
  const [newTipo, setNewTipo] = useState<BalanceNote['tipo']>('observacion');
  const [sending, setSending] = useState(false);

  const refresh = useCallback(() => {
    if (!balanceId) return;
    loadNotes(balanceId).then((all) => {
      const filtered = programaCodigo ? all.filter((n) => n.programa_codigo === programaCodigo || !n.programa_codigo) : all;
      setNotes(filtered);
    }).catch(console.error);
  }, [balanceId, programaCodigo]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = async () => {
    if (!newNota.trim() || !balanceId || !profileId) return;
    setSending(true);
    try {
      await addNote(balanceId, newNota.trim(), newTipo, profileId, programaCodigo);
      toast.success('Nota agregada');
      setNewNota('');
      setShowForm(false);
      refresh();
    } catch { toast.error('Error al agregar nota'); }
    setSending(false);
  };

  const handleResolve = async (noteId: string) => {
    if (!profileId) return;
    try {
      await resolveNote(noteId, profileId);
      toast.success('Nota marcada como resuelta');
      refresh();
    } catch { toast.error('Error al resolver nota'); }
  };

  if (!balanceId) return null;

  const pending = notes.filter((n) => !n.resolved_at);
  const resolved = notes.filter((n) => n.resolved_at);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Notas y observaciones</h3>
          {pending.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pending.length}
            </span>
          )}
        </div>
        {(isAdmin || profileId) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancelar' : 'Agregar'}
          </button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card-premium p-4 space-y-3">
            <div className="flex gap-2">
              {Object.entries(TIPO_META).filter(([k]) => k !== 'resuelto').map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setNewTipo(key as BalanceNote['tipo'])}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    newTipo === key ? `${meta.bg} ${meta.color} border-current/20` : 'bg-white text-muted-foreground border-border'
                  }`}
                >
                  <meta.icon className="w-3 h-3" />
                  {meta.label}
                </button>
              ))}
            </div>
            <textarea
              value={newNota}
              onChange={(e) => setNewNota(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none"
            />
            <button
              onClick={handleAdd}
              disabled={!newNota.trim() || sending}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-teal-500 text-white rounded-lg text-[12px] font-semibold disabled:opacity-50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Enviando...' : 'Agregar nota'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-4">Sin notas para este balance</p>
      ) : (
        <div className="space-y-2">
          {pending.map((note) => {
            const meta = TIPO_META[note.tipo] || TIPO_META.observacion;
            return (
              <motion.div key={note.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-xl border ${meta.bg} border-current/5`}>
                <div className="flex items-start gap-2.5">
                  <meta.icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase ${meta.color}`}>{meta.label}</span>
                      {note.programa_codigo && (
                        <span className="text-[9px] bg-white/60 px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                          {note.programa_codigo}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-foreground">{note.nota}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">{note.profile_nombre}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {(isAdmin || note.created_by === profileId) && (
                    <button
                      onClick={() => handleResolve(note.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0"
                      title="Marcar como resuelto"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {resolved.length > 0 && (
            <details className="mt-3">
              <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                {resolved.length} nota(s) resuelta(s)
              </summary>
              <div className="mt-2 space-y-1.5">
                {resolved.map((note) => (
                  <div key={note.id} className="p-2.5 rounded-lg bg-muted/30 border border-border/50 opacity-60">
                    <p className="text-[11px] text-muted-foreground line-through">{note.nota}</p>
                    <span className="text-[9px] text-muted-foreground">{note.profile_nombre} — resuelto</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
