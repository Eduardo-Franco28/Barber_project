import * as availabilityService from '../services/availability.service.js';
import * as barbersService from '../services/barbers.service.js';
import * as servicesService from '../services/services.service.js';

// Vitrine PÚBLICA da barbearia (sem login) — o tenant vem do :slug da URL
// (req.barbershop, posto pelo resolveBarbershop). Marcar continua exigindo
// conta; aqui é só para a pessoa navegar antes de se cadastrar.
export function info(req, res) {
  const { name, slug } = req.barbershop;
  res.status(200).json({ barbershop: { name, slug } });
}

export async function barbers(req, res) {
  const list = await barbersService.listBarbers(req.barbershop.id);
  res.status(200).json({ barbers: list });
}

export async function services(req, res) {
  const list = await servicesService.listActiveOfBarber(req.barbershop.id, req.params.barberId);
  res.status(200).json({ services: list });
}

export async function availability(req, res) {
  const { date, service_ids: serviceIds } = req.validatedQuery;
  const result = await availabilityService.getAvailability({
    barbershopId: req.barbershop.id,
    barberId: req.params.barberId,
    date,
    serviceIds,
  });
  res.status(200).json(result);
}
