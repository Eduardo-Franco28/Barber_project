import { api } from './client.js';

export function getAvailability(date, serviceIds) {
  return api(`/availability?date=${date}&service_ids=${serviceIds.join(',')}`);
}

export function createAppointment({ serviceIds, date, time }) {
  return api('/appointments', {
    method: 'POST',
    body: { service_ids: serviceIds, date, time },
  });
}

export function listAppointments() {
  return api('/appointments');
}

export function listAppointmentsBetween(from, to) {
  return api(`/appointments?from=${from}&to=${to}`);
}

export function cancelAppointment(id) {
  return api(`/appointments/${id}/cancel`, { method: 'POST' });
}

export function markAppointmentDone(id) {
  return api(`/appointments/${id}/done`, { method: 'POST' });
}
