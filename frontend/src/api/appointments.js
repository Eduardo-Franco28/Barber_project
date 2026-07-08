import { api } from './client.js';

// Marcar (autenticado) — o barbeiro escolhido vai no corpo.
export function createAppointment({ barberId, serviceIds, date, time }) {
  return api('/appointments', {
    method: 'POST',
    body: { barber_id: barberId, service_ids: serviceIds, date, time },
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
