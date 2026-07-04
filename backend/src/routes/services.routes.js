import { Router } from 'express';

import * as servicesController from '../controllers/services.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import { createServiceSchema, updateServiceSchema } from '../validators/services.schemas.js';

const router = Router();

router.get('/', authenticate, servicesController.list);
router.post(
  '/',
  authenticate,
  requireRole('barber'),
  validate(createServiceSchema),
  servicesController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole('barber'),
  validate(updateServiceSchema),
  servicesController.update
);

export default router;
