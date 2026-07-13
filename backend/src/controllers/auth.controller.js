import * as authService from '../services/auth.service.js';
import { clearAuthCookies, setAuthCookies } from '../utils/cookies.js';

// Além do cookie httpOnly, devolvemos os tokens no corpo para o front guardar
// e mandar via header Authorization — necessário no Safari/iOS, que bloqueia
// cookies de terceiros entre domínios (Vercel front + Render back).
function tokenBody({ accessToken, refreshToken }) {
  return { access_token: accessToken, refresh_token: refreshToken };
}

export async function register(req, res) {
  const { user, tokens } = await authService.register(req.barbershop.id, req.body);
  setAuthCookies(res, tokens);
  res.status(201).json({ user, barbershop: req.barbershop, tokens: tokenBody(tokens) });
}

export async function login(req, res) {
  const { user, tokens } = await authService.login(req.barbershop.id, req.body);
  setAuthCookies(res, tokens);
  res.status(200).json({ user, barbershop: req.barbershop, tokens: tokenBody(tokens) });
}

export async function refresh(req, res) {
  // Refresh token vem do corpo (fluxo header) ou do cookie (fluxo antigo).
  const refreshToken = req.body?.refresh_token ?? req.cookies?.refresh_token;
  const { user, tokens } = await authService.refresh(refreshToken);
  setAuthCookies(res, tokens);
  res.status(200).json({ user, tokens: tokenBody(tokens) });
}

export function logout(req, res) {
  clearAuthCookies(res);
  res.status(204).end();
}

export async function me(req, res) {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ user });
}

export async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.status(200).json({ user });
}

export async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body);
  res.status(204).end();
}
