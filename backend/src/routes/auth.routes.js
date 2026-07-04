import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  loginLimiter,
  passwordChangeLimiter,
  refreshLimiter,
  registerLimiter,
} from '../middlewares/rate-limiters.js';
import { validate } from '../middlewares/validate.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.schemas.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
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
