import argon2 from 'argon2';

import * as usersRepository from '../repositories/users.repository.js';
import { AppError } from '../utils/app-error.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/tokens.js';

// Hash de referência para equalizar o tempo de resposta quando o e-mail não
// existe (evita enumeração de e-mails por timing no login).
const DUMMY_HASH = await argon2.hash('senha-de-referencia-para-timing');

function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

// Cadastro público cria SEMPRE 'client'; a conta do barbeiro é criada por
// scripts/seed-barber.js (decisão de 2026-07-02).
export async function register({ name, email, phone, password }) {
  const passwordHash = await argon2.hash(password);
  const user = await usersRepository.create({
    name,
    email,
    phone,
    passwordHash,
    role: 'client',
  });

  return { user, tokens: issueTokens(user) };
}

export async function login({ email, password }) {
  const user = await usersRepository.findByEmail(email);

  // Verifica contra um hash de referência mesmo sem usuário, para o tempo de
  // resposta não revelar se o e-mail existe.
  const passwordMatches = await argon2.verify(user?.password_hash ?? DUMMY_HASH, password);
  if (!user || !passwordMatches) {
    throw new AppError(401, 'Credenciais inválidas.');
  }

  const { password_hash: _ignored, ...publicUser } = user;
  return { user: publicUser, tokens: issueTokens(publicUser) };
}

export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError(401, 'Não autenticado.');
  }

  let payload;
  try {
    payload = verifyToken(refreshToken, 'refresh');
  } catch {
    throw new AppError(401, 'Sessão expirada. Faça login novamente.');
  }

  // Recarrega o usuário para o novo token refletir dados/papel atuais.
  const user = await usersRepository.findById(payload.sub);
  if (!user) {
    throw new AppError(401, 'Sessão expirada. Faça login novamente.');
  }

  return { user, tokens: issueTokens(user) };
}

export async function getMe(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new AppError(401, 'Não autenticado.');
  }
  return user;
}

export async function updateProfile(userId, { name, phone }) {
  const user = await usersRepository.updateProfile(userId, { name, phone });
  if (!user) {
    throw new AppError(401, 'Não autenticado.');
  }
  return user;
}

// Exige a senha atual (seção de Segurança do CLAUDE.md). 400 — e não 401 —
// para não parecer sessão expirada. Obs.: com refresh stateless, sessões já
// abertas continuam válidas após a troca (trade-off registrado na etapa 4).
export async function changePassword(userId, { current_password: currentPassword, new_password: newPassword }) {
  const user = await usersRepository.findByIdWithPassword(userId);
  if (!user) {
    throw new AppError(401, 'Não autenticado.');
  }

  const matches = await argon2.verify(user.password_hash, currentPassword);
  if (!matches) {
    throw new AppError(400, 'Senha atual incorreta.');
  }

  const passwordHash = await argon2.hash(newPassword);
  await usersRepository.updatePassword(userId, passwordHash);
}
