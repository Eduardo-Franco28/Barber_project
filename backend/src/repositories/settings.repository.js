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

// Cria a configuração padrão de um barbeiro (usado no onboarding).
export async function createDefaults(barbershopId, barberId, defaultSlotMinutes = 50) {
  const { error } = await supabase.from('settings').insert({
    barbershop_id: barbershopId,
    barber_id: barberId,
    default_slot_minutes: defaultSlotMinutes,
  });

  if (error) {
    throw new Error(`Criação de settings falhou: ${error.message}`);
  }
}

export async function upsert(barbershopId, barberId, fields) {
  const { data, error } = await supabase
    .from('settings')
    .upsert(
      {
        barbershop_id: barbershopId,
        barber_id: barberId,
        ...fields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'barber_id' }
    )
    .select(COLUMNS)
    .single();

  if (error) {
    throw new Error(`Atualização de settings falhou: ${error.message}`);
  }

  return data;
}
