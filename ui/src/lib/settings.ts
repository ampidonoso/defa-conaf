import { supabase } from '@/integrations/supabase/client';

export interface AlertThresholds {
  sobregirado: number;
  critico: number;
  alto: number;
  sub_ejecutado: number;
}

export interface DisplayPreferences {
  default_format: 'pesos' | 'miles' | 'millones';
  default_oficina: string;
  show_empty_programs: boolean;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  sobregirado: 100, critico: 90, alto: 80, sub_ejecutado: 30,
};

const DEFAULT_DISPLAY: DisplayPreferences = {
  default_format: 'pesos', default_oficina: 'consolidado', show_empty_programs: false,
};

export async function loadThresholds(): Promise<AlertThresholds> {
  const { data } = await (supabase as any)
    .from('app_settings')
    .select('value')
    .eq('key', 'alert_thresholds')
    .single();
  return data?.value || DEFAULT_THRESHOLDS;
}

export async function saveThresholds(thresholds: AlertThresholds, profileId?: string): Promise<void> {
  await (supabase as any)
    .from('app_settings')
    .update({ value: thresholds, updated_by: profileId, updated_at: new Date().toISOString() })
    .eq('key', 'alert_thresholds');
}

export async function loadDisplayPrefs(): Promise<DisplayPreferences> {
  const { data } = await (supabase as any)
    .from('app_settings')
    .select('value')
    .eq('key', 'display_preferences')
    .single();
  return data?.value || DEFAULT_DISPLAY;
}

export async function saveDisplayPrefs(prefs: DisplayPreferences, profileId?: string): Promise<void> {
  await (supabase as any)
    .from('app_settings')
    .update({ value: prefs, updated_by: profileId, updated_at: new Date().toISOString() })
    .eq('key', 'display_preferences');
}

// Notes
export interface BalanceNote {
  id: string;
  balance_id: string;
  programa_codigo: string | null;
  folio: number | null;
  nota: string;
  tipo: 'observacion' | 'accion' | 'alerta_manual' | 'resuelto';
  created_by: string | null;
  created_at: string;
  resolved_at: string | null;
  // joined
  profile_nombre?: string;
}

export async function loadNotes(balanceId: string): Promise<BalanceNote[]> {
  const { data } = await (supabase as any)
    .from('balance_notes')
    .select('*, app_profiles(nombre)')
    .eq('balance_id', balanceId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((n: any) => ({
    ...n,
    profile_nombre: n.app_profiles?.nombre || 'Sistema',
  }));
}

export async function addNote(
  balanceId: string,
  nota: string,
  tipo: BalanceNote['tipo'],
  profileId: string,
  programaCodigo?: string,
  folio?: number,
): Promise<void> {
  await (supabase as any).from('balance_notes').insert({
    balance_id: balanceId,
    programa_codigo: programaCodigo || null,
    folio: folio || null,
    nota,
    tipo,
    created_by: profileId,
  });
}

export async function resolveNote(noteId: string, profileId: string): Promise<void> {
  await (supabase as any).from('balance_notes').update({
    resolved_at: new Date().toISOString(),
    resolved_by: profileId,
  }).eq('id', noteId);
}
