import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/app-error.js';

const COLUMNS = 'id, client_id, barber_id, start_at, end_at, status, created_at';

const WITH_SERVICES = `${COLUMNS},
  barbershop:barbershops ( name ),
  appointment_services ( service:services ( id, name, price, duration_minutes ) )`;

const WITH_SERVICES_AND_CLIENT = `${WITH_SERVICES},
  client:users!appointments_client_id_fkey ( id, name, phone )`;

// Agendamentos 'scheduled' que intersectam a janela [startIso, endIso).
export async function findScheduledOverlapping(barberId, startIso, endIso) {
  const { data, error } = await supabase
    .from('appointments')
    .select(COLUMNS)
    .eq('barber_id', barberId)
    .eq('status', 'scheduled')
    .lt('start_at', endIso)
    .gt('end_at', startIso);

  if (error) {
    throw new Error(`Busca de agendamentos falhou: ${error.message}`);
  }

  return data;
}

// Para a planilha: marcados e concluídos (cancelado libera a célula), com o
// nome do cliente.
export async function findForExcel(barberId, startIso, endIso) {
  const { data, error } = await supabase
    .from('appointments')
    .select('start_at, end_at, status, client:users!appointments_client_id_fkey ( name )')
    .eq('barber_id', barberId)
    .in('status', ['scheduled', 'done'])
    .lt('start_at', endIso)
    .gt('end_at', startIso);

  if (error) {
    throw new Error(`Busca de agendamentos para a planilha falhou: ${error.message}`);
  }

  return data;
}

export async function create(fields) {
  const { data, error } = await supabase.from('appointments').insert(fields).select(COLUMNS).single();

  if (error) {
    // 23P01 = exclusion_violation (appointments_no_overlap): outro cliente
    // pegou o mesmo horário entre a checagem de disponibilidade e o insert.
    if (error.code === '23P01') {
      throw new AppError(409, 'Horário indisponível. Escolha outro horário.');
    }
    throw new Error(`Criação de agendamento falhou: ${error.message}`);
  }

  return data;
}

export async function addServices(appointmentId, serviceIds) {
  const rows = serviceIds.map((serviceId) => ({
    appointment_id: appointmentId,
    service_id: serviceId,
  }));
  const { error } = await supabase.from('appointment_services').insert(rows);

  if (error) {
    throw new Error(`Vínculo de serviços ao agendamento falhou: ${error.message}`);
  }
}

// Compensação usada quando addServices falha (PostgREST não dá transação
// multi-tabela; sem isso ficaria um agendamento órfão ocupando horário).
export async function hardDelete(id) {
  const { error } = await supabase.from('appointments').delete().eq('id', id);

  if (error) {
    throw new Error(`Exclusão de agendamento falhou: ${error.message}`);
  }
}

export async function findById(id) {
  const { data, error } = await supabase
    .from('appointments')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de agendamento falhou: ${error.message}`);
  }

  return data;
}

export async function findByIdWithServices(id) {
  const { data, error } = await supabase
    .from('appointments')
    .select(WITH_SERVICES)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de agendamento falhou: ${error.message}`);
  }

  return data;
}

export async function listByClient(clientId) {
  const { data, error } = await supabase
    .from('appointments')
    .select(WITH_SERVICES)
    .eq('client_id', clientId)
    .order('start_at', { ascending: false });

  if (error) {
    throw new Error(`Listagem de agendamentos falhou: ${error.message}`);
  }

  return data;
}

export async function listForBarberBetween(barberId, startIso, endIso) {
  const { data, error } = await supabase
    .from('appointments')
    .select(WITH_SERVICES_AND_CLIENT)
    .eq('barber_id', barberId)
    .gte('start_at', startIso)
    .lt('start_at', endIso)
    .order('start_at', { ascending: true });

  if (error) {
    throw new Error(`Listagem da agenda falhou: ${error.message}`);
  }

  return data;
}

// Marca como concluído apenas se ainda estiver 'scheduled'.
export async function markDone(id) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'done' })
    .eq('id', id)
    .eq('status', 'scheduled')
    .select(COLUMNS);

  if (error) {
    throw new Error(`Conclusão de agendamento falhou: ${error.message}`);
  }

  return data[0] ?? null;
}

// Agendamentos que começam na janela (nowIso, untilIso] e ainda não têm
// lembrete enviado, com tudo que a mensagem precisa.
export async function findNeedingReminder(nowIso, untilIso) {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `id, start_at, created_at,
       barbershop:barbershops ( name ),
       client:users!appointments_client_id_fkey ( name, phone ),
       barber:users!appointments_barber_id_fkey ( name, phone ),
       appointment_services ( service:services ( name ) )`
    )
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null)
    .gt('start_at', nowIso)
    .lte('start_at', untilIso);

  if (error) {
    throw new Error(`Busca de lembretes pendentes falhou: ${error.message}`);
  }

  return data;
}

// Marca o lembrete como enviado só se ainda estava pendente (idempotente);
// retorna null se outro tick já marcou.
export async function claimReminder(id) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', id)
    .is('reminder_sent_at', null)
    .select('id');

  if (error) {
    throw new Error(`Marcação de lembrete falhou: ${error.message}`);
  }

  return data[0] ?? null;
}

// Cancela apenas se ainda estiver 'scheduled' (guarda contra corrida);
// retorna null se nada foi cancelado.
export async function cancel(id) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'canceled' })
    .eq('id', id)
    .eq('status', 'scheduled')
    .select(COLUMNS);

  if (error) {
    throw new Error(`Cancelamento falhou: ${error.message}`);
  }

  return data[0] ?? null;
}
