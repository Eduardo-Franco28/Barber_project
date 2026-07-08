import { api } from './client.js';

// Cadastro e login são POR BARBEARIA (pelo link /b/:slug).
export function login(slug, email, password) {
  return api(`/b/${slug}/auth/login`, { method: 'POST', body: { email, password } });
}

export function register(slug, fields) {
  return api(`/b/${slug}/auth/register`, { method: 'POST', body: fields });
}

// Sessão (o tenant vem do cookie/JWT — não precisa do slug).
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
