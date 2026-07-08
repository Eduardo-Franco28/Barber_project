import { DateTime } from 'luxon';

import env from '../config/env.js';
import * as appointmentsRepository from '../repositories/appointments.repository.js';
import * as blockedTimesRepository from '../repositories/blocked-times.repository.js';
import * as businessHoursRepository from '../repositories/business-hours.repository.js';
import * as fixedAppointmentsRepository from '../repositories/fixed-appointments.repository.js';
import * as servicesRepository from '../repositories/services.repository.js';
import * as settingsRepository from '../repositories/settings.repository.js';
import * as usersRepository from '../repositories/users.repository.js';
import { AppError } from '../utils/app-error.js';
import { isUuid } from '../utils/uuid.js';

// Regras de borda do agendamento (mudar aqui quando o barbeiro pedir):
export const BOOKING_HORIZON_DAYS = 60; // marca no máximo 60 dias à frente
export const MIN_BOOKING_ADVANCE_MINUTES = 30; // antecedência mínima p/ marcar
const FALLBACK_SLOT_MINUTES = 50; // se o barbeiro não tiver settings

if (!DateTime.now().setZone(env.barbershopTimezone).isValid) {
  throw new Error(`BARBERSHOP_TIMEZONE inválida: ${env.barbershopTimezone}`);
}

function atLocalTime(day, timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  return day.set({ hour, minute, second: 0, millisecond: 0 });
}

// Horários livres de um dia PARA UM BARBEIRO ESCOLHIDO e um conjunto de
// serviços dele. Grade: candidatos a cada default_slot_minutes a partir da
// abertura; cada candidato precisa caber a soma das durações antes do
// fechamento e não colidir com agendamentos 'scheduled', fixos do dia da
// semana e bloqueios — tudo DAQUELE barbeiro.
export async function getAvailability({ barbershopId, barberId, date, serviceIds }) {
  if (!isUuid(barberId)) {
    throw new AppError(400, 'Barbeiro inválido.');
  }
  const barber = await usersRepository.findBarberInShop(barbershopId, barberId);
  if (!barber) {
    throw new AppError(404, 'Barbeiro não encontrado.');
  }

  const zone = env.barbershopTimezone;
  const day = DateTime.fromISO(date, { zone });
  if (!day.isValid) {
    throw new AppError(400, 'Data inválida.');
  }

  const today = DateTime.now().setZone(zone).startOf('day');
  if (day.startOf('day') < today) {
    throw new AppError(400, 'Não é possível agendar em data passada.');
  }
  if (day.startOf('day') > today.plus({ days: BOOKING_HORIZON_DAYS })) {
    throw new AppError(400, `Agendamentos abrem até ${BOOKING_HORIZON_DAYS} dias à frente.`);
  }

  const services = await servicesRepository.findActiveByIdsForBarber(barberId, serviceIds);
  if (services.length !== serviceIds.length) {
    throw new AppError(400, 'Um ou mais serviços são inválidos ou não são deste barbeiro.');
  }

  const settings = await settingsRepository.findByBarberId(barberId);
  const defaultSlotMinutes = settings?.default_slot_minutes ?? FALLBACK_SLOT_MINUTES;
  const durationMinutes = services.reduce(
    (sum, service) => sum + (service.duration_minutes ?? defaultSlotMinutes),
    0
  );

  const weekday = day.weekday % 7; // luxon: 1=seg…7=dom → JS: 0=dom…6=sáb
  const hours = await businessHoursRepository.findByWeekday(barberId, weekday);
  if (!hours || hours.closed) {
    return { date, barber_id: barberId, duration_minutes: durationMinutes, slots: [] };
  }

  const open = atLocalTime(day, hours.open_time);
  const close = atLocalTime(day, hours.close_time);
  const dayStartIso = day.startOf('day').toUTC().toISO();
  const dayEndIso = day.plus({ days: 1 }).startOf('day').toUTC().toISO();

  const [appointments, blocks, fixed] = await Promise.all([
    appointmentsRepository.findScheduledOverlapping(barberId, dayStartIso, dayEndIso),
    blockedTimesRepository.findOverlapping(barberId, dayStartIso, dayEndIso),
    fixedAppointmentsRepository.findActiveByWeekday(barberId, weekday),
  ]);

  const busy = [
    ...appointments.map((a) => [
      DateTime.fromISO(a.start_at).toMillis(),
      DateTime.fromISO(a.end_at).toMillis(),
    ]),
    ...blocks.map((b) => [
      DateTime.fromISO(b.start_at).toMillis(),
      DateTime.fromISO(b.end_at).toMillis(),
    ]),
    ...fixed.map((f) => {
      const start = atLocalTime(day, f.start_time);
      return [start.toMillis(), start.plus({ minutes: f.duration_minutes }).toMillis()];
    }),
  ];

  const minStartMillis = DateTime.now().plus({ minutes: MIN_BOOKING_ADVANCE_MINUTES }).toMillis();

  const slots = [];
  for (
    let candidate = open;
    candidate.plus({ minutes: durationMinutes }) <= close;
    candidate = candidate.plus({ minutes: defaultSlotMinutes })
  ) {
    const start = candidate.toMillis();
    const end = candidate.plus({ minutes: durationMinutes }).toMillis();

    if (start < minStartMillis) continue;
    const hasConflict = busy.some(([busyStart, busyEnd]) => start < busyEnd && busyStart < end);
    if (!hasConflict) {
      slots.push(candidate.toFormat('HH:mm'));
    }
  }

  return { date, barber_id: barberId, duration_minutes: durationMinutes, slots };
}
