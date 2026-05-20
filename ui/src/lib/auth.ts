import { supabase } from '@/integrations/supabase/client';

export interface AppProfile {
  id: string;
  nombre: string;
  cargo: string;
  iniciales: string;
  rol: 'admin' | 'editor' | 'viewer';
  color: string;
}

const SESSION_KEY = 'conaf-defa-profile';

export async function loginWithCode(codigo: string): Promise<AppProfile | null> {
  const { data, error } = await (supabase as any)
    .from('app_profiles')
    .select('id, nombre, cargo, iniciales, rol, color')
    .eq('codigo', codigo)
    .eq('activo', true)
    .single();

  if (error || !data) return null;

  // Update last access
  await (supabase as any).from('app_profiles').update({ ultimo_acceso: new Date().toISOString() }).eq('id', data.id);

  // Log access
  await (supabase as any).from('access_log').insert({
    profile_id: data.id,
    accion: 'login',
    detalle: `${data.nombre} ingresó al sistema`,
  });

  const profile = data as AppProfile;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  return profile;
}

export function getStoredProfile(): AppProfile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppProfile;
  } catch {
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function canUpload(rol: string): boolean {
  return rol === 'admin' || rol === 'editor';
}

export function canDelete(rol: string): boolean {
  return rol === 'admin';
}

export function canExport(rol: string): boolean {
  return rol === 'admin' || rol === 'editor';
}
