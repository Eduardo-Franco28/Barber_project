import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { passwordChangeLimiter, refreshLimiter } from '../middlewares/rate-limiters.js';
import { validate } from '../middlewares/validate.js';
import { changePasswordSchema, updateProfileSchema } from '../validators/auth.schemas.js';

// Rotas de SESSÃO (o tenant vem do JWT, não do link). Cadastro e login ficam
// por barbearia em /b/:slug/auth (barbershop-auth.routes.js).
const router = Router();

router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.patch(
  '/password',
  authenticate,
  passwordChangeLimiter,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
