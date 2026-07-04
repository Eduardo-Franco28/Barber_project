import * as servicesService from '../services/services.service.js';

export async function list(req, res) {
  const services = await servicesService.list(req.user.role);
  res.status(200).json({ services });
}

export async function create(req, res) {
  const service = await servicesService.create(req.body);
  res.status(201).json({ service });
}

export async function update(req, res) {
  const service = await servicesService.update(req.params.id, req.body);
  res.status(200).json({ service });
}
