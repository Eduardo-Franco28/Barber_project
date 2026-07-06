import env from '../config/env.js';

// httpOnly: JS do front nunca lê o token (mitiga XSS). SameSite controla o
// envio cross-site: 'lax' em dev; 'none' em produção quando front e back estão
// em domínios diferentes (exige Secure). Secure só em produção (dev roda http).
const baseOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.cookieSameSite,
};

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie('access_token', accessToken, {
    ...baseOptions,
    path: '/',
    maxAge: env.jwtAccessTtlMin * 60 * 1000,
  });
  // Refresh restrito ao path /auth: o navegador não o envia nas demais rotas.
  res.cookie('refresh_token', refreshToken, {
    ...baseOptions,
    path: '/auth',
    maxAge: env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie('access_token', { ...baseOptions, path: '/' });
  res.clearCookie('refresh_token', { ...baseOptions, path: '/auth' });
}
