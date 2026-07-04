import * as fixedAppointmentsService from '../services/fixed-appointments.service.js';

export async function list(req, res) {
  const fixedAppointments = await fixedAppointmentsService.list(req.user.id);
  res.status(200).json({ fixed_appointments: fixedAppointments });
}

export async function create(req, res) {
  const fixedAppointment = await fixedAppointmentsService.create(req.user.id, req.body);
  res.status(201).json({ fixed_appointment: fixedAppointment });
}

export async function remove(req, res) {
  await fixedAppointmentsService.remove(req.user.id, req.params.id);
  res.status(204).end();
}
