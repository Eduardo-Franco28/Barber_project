import { supabase } from '../config/supabase.js';

const COLUMNS = 'weekday, closed, open_time, close_time';

export async function findByWeekday(barberId, weekday) {
  const { data, error } = await supabase
    .from('business_hours')
    .select(COLUMNS)
    .eq('barber_id', barberId)
    .eq('weekday', weekday)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de horário de funcionamento falhou: ${error.message}`);
  }

  return data;
}

export async function findAllByBarber(barberId) {
  const { data, error } = await supabase
    .from('business_hours')
    .select(COLUMNS)
    .eq('barber_id', barberId)
    .order('weekday');

  if (error) {
    throw new Error(`Listagem de horários de funcionamento falhou: ${error.message}`);
  }

  return data;
}

// Upsert dos 7 dias de uma vez (constraint unique barber_id+weekday).
// Linhas homogêneas: chave ausente em insert em lote vira NULL no PostgREST.
export async function upsertMany(rows) {
  const { data, error } = await supabase
    .from('business_hours')
    .upsert(rows, { onConflict: 'barber_id,weekday' })
    .select(COLUMNS);

  if (error) {
    throw new Error(`Atualização de horários de funcionamento falhou: ${error.message}`);
  }

  return data;
}
