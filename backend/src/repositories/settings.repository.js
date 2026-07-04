import { supabase } from '../config/supabase.js';

const COLUMNS = 'barber_id, default_slot_minutes, updated_at';

export async function findByBarberId(barberId) {
  const { data, error } = await supabase
    .from('settings')
    .select(COLUMNS)
    .eq('barber_id', barberId)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de settings falhou: ${error.message}`);
  }

  return data;
}

export async function upsert(barberId, fields) {
  const { data, error } = await supabase
    .from('settings')
    .upsert(
      { barber_id: barberId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'barber_id' }
    )
    .select(COLUMNS)
    .single();

  if (error) {
    throw new Error(`Atualização de settings falhou: ${error.message}`);
  }

  return data;
}
