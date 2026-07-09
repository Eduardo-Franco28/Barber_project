import { DateTime } from 'luxon';

import env from '../config/env.js';
import * as usersRepository from '../repositories/users.repository.js';
import * as whatsappService from './whatsapp.service.js';

function formatWhen(iso) {
  const dt = DateTime.fromISO(iso).setZone(env.barbershopTimezone).setLocale('pt-BR');
  return { data: dt.toFormat('cccc, dd/MM'), hora: dt.toFormat('HH:mm') };
}

function joinServiceNames(services) {
  return (services ?? []).map((service) => service.name).join(' + ') || 'atendimento';
}

// Momento 1 (CLAUDE.md): na confirmação — cliente e barbeiro.
// Chamada fire-and-forget pelo appointments.service; nunca derruba a request.
export async function notifyAppointmentCreated(appointment) {
  try {
    const [client, barber] = await Promise.all([
      usersRepository.findById(appointment.client_id),
      usersRepository.findById(appointment.barber_id),
    ]);
    const { data, hora } = formatWhen(appointment.start_at);
    const servicos = joinServiceNames(appointment.services);
    const shop = appointment.barbershop?.name ?? 'Barbearia';
    const instance = appointment.barbershop?.whatsapp_instance;

    // Só o BARBEIRO é notificado (o cliente vê o horário no app). Não mandamos
    // WhatsApp para clientes: reduz o volume e o risco de bloqueio do número.
    if (barber?.phone) {
      await whatsappService.sendMessage(
        barber.phone,
        `${shop}: novo agendamento — ${client?.name ?? 'cliente'}, ${data} às ${hora} (${servicos}).`,
        instance
      );
    }
  } catch (err) {
    console.error('Notificação de confirmação falhou:', err.message);
  }
}

// Aviso de cancelamento — só o BARBEIRO é notificado, e só quando quem
// cancelou foi o CLIENTE (se o próprio barbeiro cancelou, ele já sabe). O
// cliente não recebe WhatsApp: ele vê o cancelamento no app.
// Fire-and-forget pelo appointments.service; nunca derruba a request.
export async function notifyAppointmentCanceled(appointment, canceledByRole) {
  try {
    const [client, barber] = await Promise.all([
      usersRepository.findById(appointment.client_id),
      usersRepository.findById(appointment.barber_id),
    ]);
    const { data, hora } = formatWhen(appointment.start_at);
    const servicos = joinServiceNames(appointment.services);
    const shop = appointment.barbershop?.name ?? 'Barbearia';
    const instance = appointment.barbershop?.whatsapp_instance;

    if (canceledByRole === 'client' && barber?.phone) {
      await whatsappService.sendMessage(
        barber.phone,
        `${shop}: agendamento CANCELADO — ${client?.name ?? 'cliente'}, ${data} às ${hora} ` +
          `(${servicos}). O horário está livre de novo.`,
        instance
      );
    }
  } catch (err) {
    console.error('Notificação de cancelamento falhou:', err.message);
  }
}
