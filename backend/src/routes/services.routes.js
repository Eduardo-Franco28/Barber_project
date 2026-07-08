import { Router } from 'express';

import * as servicesController from '../controllers/services.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import { createServiceSchema, updateServiceSchema } from '../validators/services.schemas.js';

// Gestão dos serviços do próprio barbeiro (dono ou barbeiro). O cliente vê os
// serviços de um barbeiro em GET /barbers/:barberId/services.
const router = Router();

router.get('/', authenticate, requireRole('owner', 'barber'), servicesController.listOwn);
router.post(
  '/',
  authenticate,
  requireRole('owner', 'barber'),
  validate(createServiceSchema),
  servicesController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole('owner', 'barber'),
  validate(updateServiceSchema),
  servicesController.update
);

export default router;
