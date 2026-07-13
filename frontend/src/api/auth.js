import { api, clearTokens, setTokens } from './client.js';

// Cadastro e login são POR BARBEARIA (pelo link /b/:slug).
export async function login(slug, email, password) {
  const data = await api(`/b/${slug}/auth/login`, { method: 'POST', body: { email, password } });
  setTokens(data.tokens);
  return data;
}

export async function register(slug, fields) {
  const data = await api(`/b/${slug}/auth/register`, { method: 'POST', body: fields });
  setTokens(data.tokens);
  return data;
}

// Sessão (o tenant vem do token — não precisa do slug).
export function me() {
  return api('/auth/me');
}

export async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
}

export function updateProfile(fields) {
  return api('/auth/me', { method: 'PATCH', body: fields });
}

export function changePassword(fields) {
  return api('/auth/password', { method: 'PATCH', body: fields });
}
