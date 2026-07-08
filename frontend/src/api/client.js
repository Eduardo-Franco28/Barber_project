const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function doFetch(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include', // cookies httpOnly de sessão vão e voltam aqui
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
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
// (cookie de refresh) e repete a chamada original.
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export async function api(path, options) {
  try {
    return await doFetch(path, options);
  } catch (err) {
    // includes (não startsWith): o login/cadastro agora é /b/:slug/auth/login.
    const retryable =
      err instanceof ApiError && err.status === 401 && !AUTH_PATHS.some((p) => path.includes(p));
    if (!retryable) throw err;

    try {
      await doFetch('/auth/refresh', { method: 'POST' });
    } catch {
      throw err;
    }
    return doFetch(path, options);
  }
}
