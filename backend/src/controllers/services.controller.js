import * as servicesService from '../services/services.service.js';

// Gestão dos serviços DO PRÓPRIO barbeiro logado (barber_id = req.user.id).
export async function listOwn(req, res) {
  const services = await servicesService.listOwn(req.user.id);
  res.status(200).json({ services });
}

export async function create(req, res) {
  const service = await servicesService.create(req.user.barbershopId, req.user.id, req.body);
  res.status(201).json({ service });
}

export async function update(req, res) {
  const service = await servicesService.update(req.user.id, req.params.id, req.body);
  res.status(200).json({ service });
}
