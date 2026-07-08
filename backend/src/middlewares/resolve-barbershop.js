import * as barbershopsRepository from '../repositories/barbershops.repository.js';
import { AppError } from '../utils/app-error.js';

// Resolve a barbearia pelo :slug da URL (rotas /b/:slug/...) e coloca em
// req.barbershop. Usado nas rotas públicas por barbearia (cadastro/login do
// cliente) — o tenant vem do link, não de uma sessão.
export async function resolveBarbershop(req, _res, next) {
  const barbershop = await barbershopsRepository.findBySlug(req.params.slug);
  if (!barbershop || !barbershop.active) {
    throw new AppError(404, 'Barbearia não encontrada.');
  }
  req.barbershop = barbershop;
  next();
}
