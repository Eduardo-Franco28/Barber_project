import { Router } from 'express';

import * as businessHoursController from '../controllers/business-hours.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import { updateBusinessHoursSchema } from '../validators/barber.schemas.js';

const router = Router();

router.use(authenticate, requireRole('owner', 'barber'));

router.get('/', businessHoursController.list);
router.put('/', validate(updateBusinessHoursSchema), businessHoursController.update);

export default router;
