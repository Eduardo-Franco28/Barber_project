import { api } from './client.js';

export function login(email, password) {
  return api('/auth/login', { method: 'POST', body: { email, password } });
}

export function register(fields) {
  return api('/auth/register', { method: 'POST', body: fields });
}

export function me() {
  return api('/auth/me');
}

export function logout() {
  return api('/auth/logout', { method: 'POST' });
}

export function updateProfile(fields) {
  return api('/auth/me', { method: 'PATCH', body: fields });
}

export function changePassword(fields) {
  return api('/auth/password', { method: 'PATCH', body: fields });
}
