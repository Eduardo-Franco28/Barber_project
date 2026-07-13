const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Guardamos os tokens no localStorage e mandamos o access no header
// Authorization. Isso substitui o cookie de sessão no Safari/iOS, que bloqueia
// cookies de terceiros (front no Vercel + back no Render, domínios diferentes).
// Trade-off (aceito): token no navegador tem mais exposição a XSS que o cookie
// httpOnly. O back-end ainda seta o cookie, então no desktop o fluxo antigo
// segue como fallback.
const ACCESS_KEY = 'bb_access_token';
const REFRESH_KEY = 'bb_refresh_token';

export function setTokens(tokens) {
  if (tokens?.access_token) localStorage.setItem(ACCESS_KEY, tokens.access_token);
  if (tokens?.refresh_token) localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function doFetch(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const accessToken = localStorage.getItem(ACCESS_KEY);
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include', // mantém o cookie como fallback (desktop/mesmo domínio)
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor. Ele está no ar?');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Erro inesperado.', data?.details);
  }
  return data;
}

// 401 fora das rotas de auth = access token expirado: renova a sessão uma vez
// (refresh token) e repete a chamada original.
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export async function api(path, options) {
  try {
    return await doFetch(path, options);
  } catch (err) {
    // includes (não startsWith): o login/cadastro agora é /b/:slug/auth/login.
    const retryable =
      err instanceof ApiError && err.status === 401 && !AUTH_PATHS.some((p) => path.includes(p));
    if (!retryable) throw err;

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    try {
      // Manda o refresh no corpo; sem ele (fluxo antigo por cookie) o back cai
      // no cookie de refresh.
      const data = await doFetch('/auth/refresh', {
        method: 'POST',
        body: refreshToken ? { refresh_token: refreshToken } : undefined,
      });
      setTokens(data?.tokens);
    } catch {
      clearTokens();
      throw err;
    }
    return doFetch(path, options);
  }
}
