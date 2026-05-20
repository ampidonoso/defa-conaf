import { supabase } from '@/integrations/supabase/client';
import type { ParseResult } from './parser';
import type { BalanceReport, HistoryEntry } from './types';

/**
 * Save a parsed balance to Supabase.
 * Returns the balance ID.
 */
export interface DuplicateCheck {
  isDuplicate: boolean;
  existingId?: string;
  existingPeriodo?: string;
  existingDate?: string;
}

export async function checkDuplicate(periodo: string): Promise<DuplicateCheck> {
  const { data } = await supabase
    .from('balances')
    .select('id, periodo, created_at')
    .eq('periodo', periodo)
    .order('created_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return {
      isDuplicate: true,
      existingId: data[0].id,
      existingPeriodo: data[0].periodo,
      existingDate: data[0].created_at,
    };
  }
  return { isDuplicate: false };
}

export async function deleteBalance(id: string): Promise<void> {
  await supabase.from('balances').delete().eq('id', id);
}

export async function saveBalance(result: ParseResult, fileName: string, profileId?: string, replaceId?: string): Promise<string> {
  const report = result.consolidado;

  // If replacing, delete old one first
  if (replaceId) {
    await supabase.from('balances').delete().eq('id', replaceId);
  }

  // Log the upload
  if (profileId) {
    await (supabase as any).from('access_log').insert({
      profile_id: profileId,
      accion: 'upload',
      detalle: `Subió ${fileName} (${report.periodo}, ${report.totalItems} ítems, ${result.oficinas.length} oficinas)${replaceId ? ' [reemplazó anterior]' : ''}`,
    });
  }

  // 1. Insert balance record
  const { data: balance, error: balErr } = await supabase
    .from('balances')
    .insert({
      periodo: report.periodo,
      fecha_corte: extractFechaCorte(result),
      total_presupuesto: report.totalPresupuesto,
      total_compromiso: report.totalCompromiso,
      total_saldo: report.totalSaldo,
      pct_avance_global: Math.round(report.pctAvanceGlobal * 10) / 10,
      total_rows: report.totalRows,
      total_items: report.totalItems,
      archivo_nombre: fileName,
    })
    .select('id')
    .single();

  if (balErr || !balance) throw new Error(`Error guardando balance: ${balErr?.message}`);
  const balanceId = balance.id;

  // 2. Insert oficinas + programas + items
  for (const oficina of result.oficinas) {
    const { data: ofi, error: ofiErr } = await supabase
      .from('balance_oficinas')
      .insert({
        balance_id: balanceId,
        nombre: oficina.nombre,
        total_presupuesto: oficina.programas.reduce((s, p) => s + p.presupuesto, 0),
        total_compromiso: oficina.programas.reduce((s, p) => s + p.compromiso, 0),
        total_saldo: oficina.programas.reduce((s, p) => s + p.saldo, 0),
        pct_avance: Math.round(
          oficina.programas.reduce((s, p) => s + p.presupuesto, 0) > 0
            ? (oficina.programas.reduce((s, p) => s + p.compromiso, 0) /
                oficina.programas.reduce((s, p) => s + p.presupuesto, 0)) * 1000
            : 0
        ) / 10,
      })
      .select('id')
      .single();

    if (ofiErr || !ofi) continue;

    for (const prog of oficina.programas) {
      const { data: prg, error: prgErr } = await supabase
        .from('balance_programas')
        .insert({
          balance_id: balanceId,
          oficina_id: ofi.id,
          codigo: prog.codigo,
          nombre: prog.nombre,
          presupuesto: prog.presupuesto,
          compromiso: prog.compromiso,
          saldo: prog.saldo,
          pct_avance: Math.round(prog.pctAvance * 10) / 10,
        })
        .select('id')
        .single();

      if (prgErr || !prg) continue;

      // Batch insert items (max 50 at a time)
      const itemRows = prog.items.map((item) => ({
        balance_id: balanceId,
        programa_id: prg.id,
        folio: item.folio,
        titulo: item.titulo,
        tipo: item.tipo,
        presupuesto: item.presupuesto,
        compromiso: item.compromiso,
        saldo: item.saldo,
        pct_avance: Math.round(item.pctAvance * 10) / 10,
        sigfe: item.folio,
      }));

      for (let i = 0; i < itemRows.length; i += 50) {
        await supabase.from('balance_items').insert(itemRows.slice(i, i + 50));
      }
    }
  }

  // 3. Insert alertas
  if (report.alertas.length > 0) {
    const alertRows = report.alertas.map((a) => ({
      balance_id: balanceId,
      tipo: a.tipo,
      programa: a.programa,
      folio: a.folio ?? null,
      titulo: a.titulo,
      pct: Math.round(a.pct * 10) / 10,
      mensaje: a.mensaje,
    }));
    await supabase.from('balance_alertas').insert(alertRows);
  }

  return balanceId;
}

/**
 * Load all saved balances (summary list).
 */
export async function loadBalanceList(): Promise<{
  id: string;
  periodo: string;
  archivo_nombre: string;
  created_at: string;
  total_presupuesto: number;
  total_compromiso: number;
  pct_avance_global: number;
}[]> {
  const { data, error } = await supabase
    .from('balances')
    .select('id, periodo, archivo_nombre, created_at, total_presupuesto, total_compromiso, pct_avance_global')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error cargando balances: ${error.message}`);
  return (data ?? []) as any[];
}

/**
 * Load a full balance from Supabase by ID, reconstructing the ParseResult-like structure.
 */
export async function loadBalance(balanceId: string): Promise<{
  report: BalanceReport;
  oficinas: { nombre: string; programas: any[] }[];
}> {
  // Load balance
  const { data: bal } = await supabase.from('balances').select('*').eq('id', balanceId).single();
  if (!bal) throw new Error('Balance no encontrado');

  // Load oficinas
  const { data: oficinas } = await supabase
    .from('balance_oficinas')
    .select('*')
    .eq('balance_id', balanceId)
    .order('nombre');

  // Load programas
  const { data: programas } = await supabase
    .from('balance_programas')
    .select('*')
    .eq('balance_id', balanceId);

  // Load items
  const { data: items } = await supabase
    .from('balance_items')
    .select('*')
    .eq('balance_id', balanceId);

  // Load alertas
  const { data: alertas } = await supabase
    .from('balance_alertas')
    .select('*')
    .eq('balance_id', balanceId);

  // Reconstruct programas with items
  const programasMap = new Map<string, any>();
  for (const p of programas ?? []) {
    programasMap.set(p.id, {
      codigo: p.codigo,
      nombre: p.nombre,
      presupuesto: p.presupuesto,
      compromiso: p.compromiso,
      saldo: p.saldo,
      pctAvance: Number(p.pct_avance),
      items: [],
    });
  }
  for (const item of items ?? []) {
    const prog = programasMap.get(item.programa_id);
    if (prog) {
      prog.items.push({
        folio: item.folio,
        titulo: item.titulo,
        programa: prog.codigo,
        programaCodigo: prog.codigo,
        tipo: item.tipo,
        presupuesto: item.presupuesto,
        compromiso: item.compromiso,
        saldo: item.saldo,
        pctAvance: Number(item.pct_avance),
      });
    }
  }

  // Reconstruct oficinas
  const ofiResult = (oficinas ?? []).map((o) => {
    const ofiProgs = (programas ?? [])
      .filter((p) => p.oficina_id === o.id)
      .map((p) => programasMap.get(p.id))
      .filter(Boolean);
    return { nombre: o.nombre, programas: ofiProgs };
  });

  // Consolidado
  const allProgs = [...programasMap.values()];
  // Merge by codigo for consolidado
  const consolidadoMap = new Map<string, any>();
  for (const p of allProgs) {
    if (consolidadoMap.has(p.codigo)) {
      const existing = consolidadoMap.get(p.codigo);
      existing.presupuesto += p.presupuesto;
      existing.compromiso += p.compromiso;
      existing.saldo += p.saldo;
      existing.items.push(...p.items);
      existing.pctAvance = existing.presupuesto > 0 ? (existing.compromiso / existing.presupuesto) * 100 : 0;
    } else {
      consolidadoMap.set(p.codigo, { ...p, items: [...p.items] });
    }
  }

  const report: BalanceReport = {
    oficina: 'Región de Los Ríos',
    periodo: bal.periodo,
    fechaGeneracion: bal.fecha_generacion,
    totalPresupuesto: bal.total_presupuesto,
    totalCompromiso: bal.total_compromiso,
    totalSaldo: bal.total_saldo,
    pctAvanceGlobal: Number(bal.pct_avance_global),
    programas: [...consolidadoMap.values()].sort((a, b) => a.codigo.localeCompare(b.codigo)),
    alertas: (alertas ?? []).map((a) => ({
      tipo: a.tipo as any,
      programa: a.programa,
      folio: a.folio ?? undefined,
      titulo: a.titulo,
      pct: Number(a.pct),
      mensaje: a.mensaje,
    })),
    totalRows: bal.total_rows ?? 0,
    totalItems: bal.total_items ?? 0,
  };

  return { report, oficinas: ofiResult };
}

/**
 * Load history entries from all saved balances.
 */
export async function loadHistory(): Promise<HistoryEntry[]> {
  const { data } = await supabase
    .from('balances')
    .select('periodo, total_presupuesto, total_compromiso, pct_avance_global')
    .order('created_at', { ascending: true });

  return (data ?? []).map((b) => ({
    mes: b.periodo,
    presupuesto: b.total_presupuesto,
    compromiso: b.total_compromiso,
    pctAvance: Number(b.pct_avance_global),
  }));
}

function extractFechaCorte(result: ParseResult): string | null {
  const nombre = result.oficinas[0]?.nombre || '';
  const match = nombre.match(/AL\s+(\d{2})-(\d{2})-(\d{4})/i);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}
