import { Router } from 'express';

import * as settingsController from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import { updateSettingsSchema } from '../validators/barber.schemas.js';

const router = Router();

router.use(authenticate, requireRole('owner', 'barber'));

router.get('/', settingsController.get);
router.patch('/', validate(updateSettingsSchema), settingsController.update);

export default router;
