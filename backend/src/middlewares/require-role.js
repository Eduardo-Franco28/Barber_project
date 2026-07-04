import { AppError } from '../utils/app-error.js';

// Usar sempre depois de authenticate. Ex.: router.get('/', authenticate,
// requireRole('barber'), controller.list)
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Acesso negado.');
    }
    next();
  };
}
