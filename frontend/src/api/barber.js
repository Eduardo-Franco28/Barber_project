import { api } from './client.js';

export function listFixed() {
  return api('/fixed-appointments');
}

export function createFixed(body) {
  return api('/fixed-appointments', { method: 'POST', body });
}

export function deleteFixed(id) {
  return api(`/fixed-appointments/${id}`, { method: 'DELETE' });
}

export function listBlocked() {
  return api('/blocked-times');
}

export function createBlocked(body) {
  return api('/blocked-times', { method: 'POST', body });
}

export function deleteBlocked(id) {
  return api(`/blocked-times/${id}`, { method: 'DELETE' });
}

export function getBusinessHours() {
  return api('/business-hours');
}

export function saveBusinessHours(days) {
  return api('/business-hours', { method: 'PUT', body: { days } });
}

export function getSettings() {
  return api('/settings');
}

export function saveSettings(body) {
  return api('/settings', { method: 'PATCH', body });
}
