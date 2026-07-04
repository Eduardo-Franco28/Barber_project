import { supabase } from '../config/supabase.js';

const COLUMNS = 'id, client_name, weekday, start_time, duration_minutes, active, created_at';

export async function findActiveByWeekday(barberId, weekday) {
  const { data, error } = await supabase
    .from('fixed_appointments')
    .select('id, client_name, weekday, start_time, duration_minutes')
    .eq('barber_id', barberId)
    .eq('weekday', weekday)
    .eq('active', true);

  if (error) {
    throw new Error(`Busca de atendimentos fixos falhou: ${error.message}`);
  }

  return data;
}

export async function findAllByBarber(barberId) {
  const { data, error } = await supabase
    .from('fixed_appointments')
    .select(COLUMNS)
    .eq('barber_id', barberId)
    .order('weekday')
    .order('start_time');

  if (error) {
    throw new Error(`Listagem de atendimentos fixos falhou: ${error.message}`);
  }

  return data;
}

export async function create(fields) {
  const { data, error } = await supabase
    .from('fixed_appointments')
    .insert(fields)
    .select(COLUMNS)
    .single();

  if (error) {
    throw new Error(`Criação de atendimento fixo falhou: ${error.message}`);
  }

  return data;
}

// Remove apenas se pertencer ao barbeiro; retorna null se nada foi removido.
export async function deleteByIdForBarber(id, barberId) {
  const { data, error } = await supabase
    .from('fixed_appointments')
    .delete()
    .eq('id', id)
    .eq('barber_id', barberId)
    .select('id');

  if (error) {
    throw new Error(`Remoção de atendimento fixo falhou: ${error.message}`);
  }

  return data[0] ?? null;
}
