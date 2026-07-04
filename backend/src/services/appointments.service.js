import { DateTime } from 'luxon';

import env from '../config/env.js';
import * as appointmentsRepository from '../repositories/appointments.repository.js';
import * as usersRepository from '../repositories/users.repository.js';
import { AppError } from '../utils/app-error.js';
import { isUuid } from '../utils/uuid.js';
import * as availabilityService from './availability.service.js';
import * as excelService from './excel.service.js';
import * as notificationsService from './notifications.service.js';

export const CANCEL_MIN_ADVANCE_HOURS = 2; // cliente cancela até 2h antes
const BARBER_AGENDA_DEFAULT_DAYS = 7;
const BARBER_AGENDA_MAX_DAYS = 90;

function shapeAppointment(row) {
  const { appointment_services: appointmentServices, ...rest } = row;
  return { ...rest, services: (appointmentServices ?? []).map((item) => item.service) };
}

export async function create(clientId, { service_ids: serviceIds, date, time }) {
  // Recalcula a disponibilidade server-side com as MESMAS regras do GET
  // /availability — o horário pedido precisa estar na grade livre.
  const availability = await availabilityService.getAvailability({ date, serviceIds });
  if (!availability.slots.includes(time)) {
    throw new AppError(409, 'Horário indisponível. Escolha outro horário.');
  }

  const barber = await usersRepository.findBarber();
  const start = DateTime.fromISO(`${date}T${time}`, { zone: env.barbershopTimezone });
  const end = start.plus({ minutes: availability.duration_minutes });

  const appointment = await appointmentsRepository.create({
    client_id: clientId,
    barber_id: barber.id,
    start_at: start.toUTC().toISO(),
    end_at: end.toUTC().toISO(),
  });

  try {
    await appointmentsRepository.addServices(appointment.id, serviceIds);
  } catch (err) {
    // Sem transação via PostgREST: desfaz o agendamento para não deixar um
    // horário ocupado sem serviços.
    await appointmentsRepository.hardDelete(appointment.id).catch((cleanupErr) => {
      console.error('Falha ao desfazer agendamento órfão:', appointment.id, cleanupErr.message);
    });
    throw err;
  }

  excelService.scheduleSync(); // planilha espelha o agendamento novo

  const shaped = shapeAppointment(
    await appointmentsRepository.findByIdWithServices(appointment.id)
  );
  notificationsService.notifyAppointmentCreated(shaped); // fire-and-forget (loga erro internamente)

  return shaped;
}

export async function listFor(user, { from, to } = {}) {
  if (user.role !== 'barber') {
    const rows = await appointmentsRepository.listByClient(user.id);
    return rows.map(shapeAppointment);
  }

  const zone = env.barbershopTimezone;
  const fromDay = from
    ? DateTime.fromISO(from, { zone })
    : DateTime.now().setZone(zone).startOf('day');
  const toDay = to
    ? DateTime.fromISO(to, { zone })
    : fromDay.plus({ days: BARBER_AGENDA_DEFAULT_DAYS });

  if (!fromDay.isValid || !toDay.isValid) {
    throw new AppError(400, 'Período inválido.');
  }
  if (toDay < fromDay) {
    throw new AppError(400, 'O fim do período não pode ser antes do início.');
  }
  if (toDay.diff(fromDay, 'days').days > BARBER_AGENDA_MAX_DAYS) {
    throw new AppError(400, `Período máximo: ${BARBER_AGENDA_MAX_DAYS} dias.`);
  }

  const rows = await appointmentsRepository.listForBarberBetween(
    user.id,
    fromDay.startOf('day').toUTC().toISO(),
    toDay.plus({ days: 1 }).startOf('day').toUTC().toISO()
  );
  return rows.map(shapeAppointment);
}

// Barbeiro marca o próprio atendimento como concluído (sem restrição de hora).
export async function markDone(appointmentId, requester) {
  if (!isUuid(appointmentId)) {
    throw new AppError(404, 'Agendamento não encontrado.');
  }

  const appointment = await appointmentsRepository.findById(appointmentId);
  if (!appointment || appointment.barber_id !== requester.id) {
    throw new AppError(404, 'Agendamento não encontrado.');
  }
  if (appointment.status !== 'scheduled') {
    throw new AppError(409, 'Este agendamento não pode ser concluído.');
  }

  const done = await appointmentsRepository.markDone(appointmentId);
  if (!done) {
    throw new AppError(409, 'Este agendamento não pode ser concluído.');
  }

  return done;
}

export async function cancel(appointmentId, requester) {
  if (!isUuid(appointmentId)) {
    throw new AppError(404, 'Agendamento não encontrado.');
  }

  const appointment = await appointmentsRepository.findById(appointmentId);
  const isOwnerClient =
    requester.role === 'client' && appointment?.client_id === requester.id;
  const isOwnerBarber =
    requester.role === 'barber' && appointment?.barber_id === requester.id;

  // 404 também para agendamento de terceiros: não revelar que o id existe.
  if (!appointment || (!isOwnerClient && !isOwnerBarber)) {
    throw new AppError(404, 'Agendamento não encontrado.');
  }

  if (appointment.status !== 'scheduled') {
    throw new AppError(409, 'Este agendamento não pode ser cancelado.');
  }

  // Cliente tem antecedência mínima; o barbeiro cancela quando precisar.
  if (isOwnerClient) {
    const limit = DateTime.fromISO(appointment.start_at).minus({
      hours: CANCEL_MIN_ADVANCE_HOURS,
    });
    if (DateTime.now() > limit) {
      throw new AppError(
        400,
        `Cancelamento permitido só até ${CANCEL_MIN_ADVANCE_HOURS} horas antes do horário.`
      );
    }
  }

  const canceled = await appointmentsRepository.cancel(appointmentId);
  if (!canceled) {
    throw new AppError(409, 'Este agendamento não pode ser cancelado.');
  }

  excelService.scheduleSync(); // cancelamento libera a célula na planilha

  return canceled;
}
