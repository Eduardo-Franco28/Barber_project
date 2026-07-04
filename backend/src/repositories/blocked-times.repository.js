import { supabase } from '../config/supabase.js';

const COLUMNS = 'id, start_at, end_at, reason, created_at';

// Bloqueios que intersectam a janela [startIso, endIso).
export async function findOverlapping(barberId, startIso, endIso) {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('id, start_at, end_at, reason')
    .eq('barber_id', barberId)
    .lt('start_at', endIso)
    .gt('end_at', startIso);

  if (error) {
    throw new Error(`Busca de bloqueios falhou: ${error.message}`);
  }

  return data;
}

// Bloqueios ainda vigentes ou futuros (fim depois de agora).
export async function findUpcomingByBarber(barberId, nowIso) {
  const { data, error } = await supabase
    .from('blocked_times')
    .select(COLUMNS)
    .eq('barber_id', barberId)
    .gt('end_at', nowIso)
    .order('start_at');

  if (error) {
    throw new Error(`Listagem de bloqueios falhou: ${error.message}`);
  }

  return data;
}

export async function create(fields) {
  const { data, error } = await supabase
    .from('blocked_times')
    .insert(fields)
    .select(COLUMNS)
    .single();

  if (error) {
    throw new Error(`Criação de bloqueio falhou: ${error.message}`);
  }

  return data;
}

// Remove apenas se pertencer ao barbeiro; retorna null se nada foi removido.
export async function deleteByIdForBarber(id, barberId) {
  const { data, error } = await supabase
    .from('blocked_times')
    .delete()
    .eq('id', id)
    .eq('barber_id', barberId)
    .select('id');

  if (error) {
    throw new Error(`Remoção de bloqueio falhou: ${error.message}`);
  }

  return data[0] ?? null;
}
