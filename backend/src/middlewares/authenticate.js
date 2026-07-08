import { AppError } from '../utils/app-error.js';
import { verifyToken } from '../utils/tokens.js';

export function authenticate(req, _res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    throw new AppError(401, 'Não autenticado.');
  }

  let payload;
  try {
    payload = verifyToken(token, 'access');
  } catch {
    throw new AppError(401, 'Não autenticado.');
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
    barbershopId: payload.barbershop_id,
  };
  next();
}
