import { api } from './client.js';

export function listServices() {
  return api('/services');
}

export function createService(body) {
  return api('/services', { method: 'POST', body });
}

export function updateService(id, body) {
  return api(`/services/${id}`, { method: 'PATCH', body });
}
