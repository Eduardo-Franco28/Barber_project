import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import { loginLimiter, registerLimiter } from '../middlewares/rate-limiters.js';
import { resolveBarbershop } from '../middlewares/resolve-barbershop.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.schemas.js';

// Montado em /b/:slug/auth — cadastro e login do CLIENTE dentro de uma
// barbearia específica (o tenant vem do link, não da sessão).
const router = Router({ mergeParams: true });

router.use(resolveBarbershop);

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

export default router;
