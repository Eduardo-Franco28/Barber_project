import { Router } from 'express';

import * as appointmentsController from '../controllers/appointments.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import {
  createAppointmentSchema,
  listAppointmentsQuerySchema,
} from '../validators/appointments.schemas.js';

const router = Router();

router.get(
  '/',
  authenticate,
  validateQuery(listAppointmentsQuerySchema),
  appointmentsController.list
);
router.post(
  '/',
  authenticate,
  requireRole('client'),
  validate(createAppointmentSchema),
  appointmentsController.create
);
router.post('/:id/cancel', authenticate, appointmentsController.cancel);
router.post('/:id/done', authenticate, requireRole('owner', 'barber'), appointmentsController.done);

export default router;
