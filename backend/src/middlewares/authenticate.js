import { AppError } from '../utils/app-error.js';
import { verifyToken } from '../utils/tokens.js';

export function authenticate(req, _res, next) {
  // Prefere o header Authorization: Bearer <token> (funciona no Safari/iOS, que
  // bloqueia cookies de terceiros entre domínios). Cai no cookie httpOnly como
  // fallback (fluxo antigo, mesmo domínio/desktop).
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearer ?? req.cookies?.access_token;
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
