import * as servicesRepository from '../repositories/services.repository.js';
import { AppError } from '../utils/app-error.js';
import { UUID_REGEX } from '../utils/uuid.js';

// Cliente vê só os ativos (fluxo de agendamento); barbeiro vê todos (gestão,
// inclusive desativados).
export async function list(role) {
  return role === 'barber' ? servicesRepository.findAll() : servicesRepository.findActive();
}

export async function create(fields) {
  return servicesRepository.create(fields);
}

export async function update(id, fields) {
  if (!UUID_REGEX.test(id)) {
    throw new AppError(404, 'Serviço não encontrado.');
  }

  const service = await servicesRepository.update(id, fields);
  if (!service) {
    throw new AppError(404, 'Serviço não encontrado.');
  }

  return service;
}
