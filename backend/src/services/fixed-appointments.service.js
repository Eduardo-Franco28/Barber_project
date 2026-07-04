import * as fixedAppointmentsRepository from '../repositories/fixed-appointments.repository.js';
import { AppError } from '../utils/app-error.js';
import { isUuid } from '../utils/uuid.js';
import * as excelService from './excel.service.js';

export async function list(barberId) {
  return fixedAppointmentsRepository.findAllByBarber(barberId);
}

export async function create(barberId, fields) {
  const created = await fixedAppointmentsRepository.create({ barber_id: barberId, ...fields });
  excelService.scheduleSync();
  return created;
}

export async function remove(barberId, id) {
  if (!isUuid(id)) {
    throw new AppError(404, 'Atendimento fixo não encontrado.');
  }

  const removed = await fixedAppointmentsRepository.deleteByIdForBarber(id, barberId);
  if (!removed) {
    throw new AppError(404, 'Atendimento fixo não encontrado.');
  }

  excelService.scheduleSync();
}
