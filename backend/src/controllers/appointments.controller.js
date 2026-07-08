import * as appointmentsService from '../services/appointments.service.js';

export async function create(req, res) {
  const appointment = await appointmentsService.create(req.user, req.body);
  res.status(201).json({ appointment });
}

export async function list(req, res) {
  const appointments = await appointmentsService.listFor(req.user, req.validatedQuery);
  res.status(200).json({ appointments });
}

export async function cancel(req, res) {
  const appointment = await appointmentsService.cancel(req.params.id, req.user);
  res.status(200).json({ appointment });
}

export async function done(req, res) {
  const appointment = await appointmentsService.markDone(req.params.id, req.user);
  res.status(200).json({ appointment });
}
