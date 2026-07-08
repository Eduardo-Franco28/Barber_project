import { api } from './client.js';

// Vitrine pública da barbearia (pelo link /b/:slug) — sem login.
export function getBarbershop(slug) {
  return api(`/b/${slug}`);
}

export function getBarbers(slug) {
  return api(`/b/${slug}/barbers`);
}

export function getBarberServices(slug, barberId) {
  return api(`/b/${slug}/barbers/${barberId}/services`);
}

export function getAvailability(slug, barberId, date, serviceIds) {
  return api(
    `/b/${slug}/barbers/${barberId}/availability?date=${date}&service_ids=${serviceIds.join(',')}`
  );
}
