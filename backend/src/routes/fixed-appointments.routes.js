import { Router } from 'express';

import * as fixedAppointmentsController from '../controllers/fixed-appointments.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import { createFixedAppointmentSchema } from '../validators/barber.schemas.js';

const router = Router();

router.use(authenticate, requireRole('barber'));

router.get('/', fixedAppointmentsController.list);
router.post('/', validate(createFixedAppointmentSchema), fixedAppointmentsController.create);
router.delete('/:id', fixedAppointmentsController.remove);

export default router;
