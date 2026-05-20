import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, AlertTriangle, Sliders, RotateCcw } from 'lucide-react';
import { loadThresholds, saveThresholds, type AlertThresholds } from '@/lib/settings';
import { toast } from 'sonner';

interface Props {
  profileId?: string;
  isAdmin: boolean;
}

export function SettingsPanel({ profileId, isAdmin }: Props) {
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    sobregirado: 100, critico: 90, alto: 80, sub_ejecutado: 30,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadThresholds().then(setThresholds).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!isAdmin) { toast.error('Solo administradores pueden cambiar configuraciones'); return; }
    setSaving(true);
    try {
      await saveThresholds(thresholds, profileId);
      toast.success('Umbrales guardados');
    } catch { toast.error('Error al guardar'); }
    setSaving(false);
  };

  const handleReset = () => {
    setThresholds({ sobregirado: 100, critico: 90, alto: 80, sub_ejecutado: 30 });
  };

  const fields = [
    { key: 'sobregirado' as const, label: 'Sobregirado', desc: 'Ejecución supera el presupuesto', color: 'text-red-600', bg: 'bg-red-50', emoji: '🔴' },
    { key: 'critico' as const, label: 'Crítico', desc: 'Próximo a agotarse', color: 'text-amber-600', bg: 'bg-amber-50', emoji: '🟠' },
    { key: 'alto' as const, label: 'Alto', desc: 'Ejecución elevada', color: 'text-yellow-600', bg: 'bg-yellow-50', emoji: '🟡' },
    { key: 'sub_ejecutado' as const, label: 'Sub-ejecutado', desc: 'Ejecución muy baja', color: 'text-blue-600', bg: 'bg-blue-50', emoji: '🔵' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Alert thresholds */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Umbrales de Alerta</h3>
              <p className="text-[11px] text-muted-foreground">Define los % que disparan alertas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Restaurar defaults">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className={`flex items-center gap-4 p-3 rounded-xl ${f.bg} border border-transparent`}>
              <span className="text-lg">{f.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${f.color}`}>{f.label}</p>
                <p className="text-[11px] text-muted-foreground">{f.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={thresholds[f.key]}
                  onChange={(e) => setThresholds((t) => ({ ...t, [f.key]: Number(e.target.value) }))}
                  disabled={!isAdmin}
                  className="w-20 px-3 py-1.5 text-center text-sm font-bold rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:opacity-50"
                />
                <span className="text-sm text-muted-foreground font-medium">%</span>
              </div>
            </div>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-teal-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar umbrales'}
          </button>
        )}
      </motion.div>

      {/* Info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-blue-50">
            <Sliders className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Cómo funcionan las alertas</h3>
            <p className="text-[11px] text-muted-foreground">Clasificación automática de ítems presupuestarios</p>
          </div>
        </div>
        <div className="space-y-2 text-[12px] text-muted-foreground">
          <p>• Cada ítem (ByS o Viático) se evalúa por su % de avance (compromiso / presupuesto × 100)</p>
          <p>• Si supera el umbral de <span className="text-red-600 font-semibold">Sobregirado</span>, se marca como sobregiro — hay más gasto que presupuesto</p>
          <p>• Si está entre <span className="text-amber-600 font-semibold">Crítico</span> y Sobregirado, está próximo a agotarse</p>
          <p>• Si está bajo <span className="text-blue-600 font-semibold">Sub-ejecutado</span>, indica que se está gastando muy poco</p>
          <p>• Las alertas se generan al procesar el archivo y aparecen en el Dashboard</p>
        </div>
      </motion.div>
    </div>
  );
}
