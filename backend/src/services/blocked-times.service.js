import { DateTime } from 'luxon';

import env from '../config/env.js';
import * as blockedTimesRepository from '../repositories/blocked-times.repository.js';
import { AppError } from '../utils/app-error.js';
import { isUuid } from '../utils/uuid.js';
import * as excelService from './excel.service.js';

export async function list(barberId) {
  return blockedTimesRepository.findUpcomingByBarber(barberId, new Date().toISOString());
}

export async function create(barbershopId, barberId, { start_date, start_time, end_date, end_time, reason }) {
  const zone = env.barbershopTimezone;
  const start = DateTime.fromISO(`${start_date}T${start_time}`, { zone });
  const end = DateTime.fromISO(`${end_date}T${end_time}`, { zone });

  if (!start.isValid || !end.isValid) {
    throw new AppError(400, 'Data ou horário inválidos.');
  }
  if (end <= start) {
    throw new AppError(400, 'O fim do bloqueio deve ser depois do início.');
  }

  const created = await blockedTimesRepository.create({
    barbershop_id: barbershopId,
    barber_id: barberId,
    start_at: start.toUTC().toISO(),
    end_at: end.toUTC().toISO(),
    reason: reason || null,
  });
  excelService.scheduleSync();
  return created;
}

export async function remove(barberId, id) {
  if (!isUuid(id)) {
    throw new AppError(404, 'Bloqueio não encontrado.');
  }

  const removed = await blockedTimesRepository.deleteByIdForBarber(id, barberId);
  if (!removed) {
    throw new AppError(404, 'Bloqueio não encontrado.');
  }

  excelService.scheduleSync();
}
