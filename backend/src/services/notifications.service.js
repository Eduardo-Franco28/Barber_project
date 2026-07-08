import { DateTime } from 'luxon';

import env from '../config/env.js';
import * as appointmentsRepository from '../repositories/appointments.repository.js';
import * as usersRepository from '../repositories/users.repository.js';
import * as whatsappService from './whatsapp.service.js';

export const REMINDER_WINDOW_HOURS = 2;
const JOB_INTERVAL_MS = 5 * 60 * 1000;

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

    if (client?.phone) {
      await whatsappService.sendMessage(
        client.phone,
        `${shop}: horário confirmado! ${data} às ${hora} — ${servicos}. ` +
          'Se precisar, cancele pelo app até 2h antes.'
      );
    }
    if (barber?.phone) {
      await whatsappService.sendMessage(
        barber.phone,
        `${shop}: novo agendamento — ${client?.name ?? 'cliente'}, ${data} às ${hora} (${servicos}).`
      );
    }
  } catch (err) {
    console.error('Notificação de confirmação falhou:', err.message);
  }
}

// Aviso de cancelamento — informa o LADO OPOSTO de quem cancelou:
// cliente cancelou → avisa o barbeiro (o horário abriu de novo);
// barbeiro/dono cancelou → avisa o cliente (o horário dele caiu).
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
    const canceledByClient = canceledByRole === 'client';

    if (canceledByClient && barber?.phone) {
      await whatsappService.sendMessage(
        barber.phone,
        `${shop}: agendamento CANCELADO — ${client?.name ?? 'cliente'}, ${data} às ${hora} ` +
          `(${servicos}). O horário está livre de novo.`
      );
    }
    if (!canceledByClient && client?.phone) {
      await whatsappService.sendMessage(
        client.phone,
        `${shop}: seu horário de ${data} às ${hora} (${servicos}) foi cancelado pela barbearia. ` +
          'Se quiser, marque outro pelo app.'
      );
    }
  } catch (err) {
    console.error('Notificação de cancelamento falhou:', err.message);
  }
}

// Momento 2 (CLAUDE.md): lembrete ~2h antes, via verificação periódica.
export function startReminderJob() {
  const timer = setInterval(runReminderTick, JOB_INTERVAL_MS);
  timer.unref?.();
  runReminderTick();
  console.log('Lembretes de WhatsApp: job ativo (verificação a cada 5min).');
}

export async function runReminderTick() {
  let pending;
  try {
    const now = DateTime.now();
    pending = await appointmentsRepository.findNeedingReminder(
      now.toUTC().toISO(),
      now.plus({ hours: REMINDER_WINDOW_HOURS }).toUTC().toISO()
    );
  } catch (err) {
    if (String(err.message).includes('reminder_sent_at')) {
      console.error(
        'Lembretes: aplique a migration 0003_reminders.sql no Supabase —',
        err.message
      );
    } else {
      console.error('Lembretes: verificação falhou —', err.message);
    }
    return;
  }

  for (const appointment of pending) {
    try {
      // Marca ANTES de enviar: no máximo um lembrete por agendamento, mesmo
      // que o envio falhe (trade-off aceito no MVP — falha fica no log).
      const claimed = await appointmentsRepository.claimReminder(appointment.id);
      if (!claimed) continue;

      // Agendamento criado já dentro da janela de 2h: a confirmação que
      // acabou de sair cumpre o papel de lembrete — só marca e segue.
      const bookedInsideWindow =
        DateTime.fromISO(appointment.created_at) >
        DateTime.fromISO(appointment.start_at).minus({ hours: REMINDER_WINDOW_HOURS });
      if (bookedInsideWindow) continue;

      const { data, hora } = formatWhen(appointment.start_at);
      const servicos = joinServiceNames(
        appointment.appointment_services?.map((item) => item.service)
      );
      const shop = appointment.barbershop?.name ?? 'Barbearia';

      if (appointment.client?.phone) {
        await whatsappService.sendMessage(
          appointment.client.phone,
          `${shop}: lembrete! Seu horário é ${data} às ${hora} — ${servicos}. Até já!`
        );
      }
      if (appointment.barber?.phone) {
        await whatsappService.sendMessage(
          appointment.barber.phone,
          `${shop}: em ~2h — ${appointment.client?.name ?? 'cliente'} às ${hora} (${servicos}).`
        );
      }
    } catch (err) {
      console.error(`Lembrete do agendamento ${appointment.id} falhou:`, err.message);
    }
  }
}
