import { Router } from 'express';

import * as spreadsheetController from '../controllers/spreadsheet.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';

const router = Router();

router.get('/', authenticate, requireRole('owner', 'barber'), spreadsheetController.download);

export default router;
