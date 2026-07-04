import { Router } from 'express';

import * as availabilityController from '../controllers/availability.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateQuery } from '../middlewares/validate.js';
import { availabilityQuerySchema } from '../validators/appointments.schemas.js';

const router = Router();

router.get('/', authenticate, validateQuery(availabilityQuerySchema), availabilityController.get);

export default router;
