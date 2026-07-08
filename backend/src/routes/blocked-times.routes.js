import { Router } from 'express';

import * as blockedTimesController from '../controllers/blocked-times.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import { createBlockedTimeSchema } from '../validators/barber.schemas.js';

const router = Router();

router.use(authenticate, requireRole('owner', 'barber'));

router.get('/', blockedTimesController.list);
router.post('/', validate(createBlockedTimeSchema), blockedTimesController.create);
router.delete('/:id', blockedTimesController.remove);

export default router;
