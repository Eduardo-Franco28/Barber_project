import * as servicesRepository from '../repositories/services.repository.js';
import * as usersRepository from '../repositories/users.repository.js';
import { AppError } from '../utils/app-error.js';
import { isUuid } from '../utils/uuid.js';

// Serviços são POR BARBEIRO. O barbeiro/dono gerencia os SEUS (barber_id =
// ele mesmo); o cliente vê os ativos de um barbeiro que escolheu.

export async function listOwn(barberId) {
  return servicesRepository.findAllByBarber(barberId);
}

export async function listActiveOfBarber(barbershopId, barberId) {
  if (!isUuid(barberId)) {
    throw new AppError(404, 'Barbeiro não encontrado.');
  }
  const barber = await usersRepository.findBarberInShop(barbershopId, barberId);
  if (!barber) {
    throw new AppError(404, 'Barbeiro não encontrado.');
  }
  return servicesRepository.findActiveByBarber(barberId);
}

export async function create(barbershopId, barberId, fields) {
  return servicesRepository.create({
    barbershop_id: barbershopId,
    barber_id: barberId,
    ...fields,
  });
}

export async function update(barberId, id, fields) {
  if (!isUuid(id)) {
    throw new AppError(404, 'Serviço não encontrado.');
  }

  const service = await servicesRepository.update(id, barberId, fields);
  if (!service) {
    throw new AppError(404, 'Serviço não encontrado.');
  }

  return service;
}
