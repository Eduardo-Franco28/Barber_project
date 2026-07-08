import * as usersRepository from '../repositories/users.repository.js';

// Barbeiros de uma barbearia (para o cliente escolher com quem marcar).
export async function listBarbers(barbershopId) {
  return usersRepository.findBarbersInShop(barbershopId);
}
