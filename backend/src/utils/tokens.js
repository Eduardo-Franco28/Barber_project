import jwt from 'jsonwebtoken';

import env from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign({ role: user.role, type: 'access' }, env.jwtSecret, {
    subject: user.id,
    expiresIn: `${env.jwtAccessTtlMin}m`,
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ type: 'refresh' }, env.jwtSecret, {
    subject: user.id,
    expiresIn: `${env.jwtRefreshTtlDays}d`,
  });
}

// Lança se o token for inválido/expirado ou se o tipo não for o esperado
// (impede usar um refresh token como access token e vice-versa).
export function verifyToken(token, expectedType) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.type !== expectedType) {
    throw new Error(`Tipo de token inesperado: ${payload.type}`);
  }
  return payload;
}
