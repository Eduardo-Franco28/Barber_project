import * as authService from '../services/auth.service.js';
import { clearAuthCookies, setAuthCookies } from '../utils/cookies.js';

export async function register(req, res) {
  const { user, tokens } = await authService.register(req.barbershop.id, req.body);
  setAuthCookies(res, tokens);
  res.status(201).json({ user, barbershop: req.barbershop });
}

export async function login(req, res) {
  const { user, tokens } = await authService.login(req.barbershop.id, req.body);
  setAuthCookies(res, tokens);
  res.status(200).json({ user, barbershop: req.barbershop });
}

export async function refresh(req, res) {
  const { user, tokens } = await authService.refresh(req.cookies?.refresh_token);
  setAuthCookies(res, tokens);
  res.status(200).json({ user });
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
