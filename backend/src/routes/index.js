import { Router } from 'express';

import appointmentsRoutes from './appointments.routes.js';
import authRoutes from './auth.routes.js';
import availabilityRoutes from './availability.routes.js';
import blockedTimesRoutes from './blocked-times.routes.js';
import businessHoursRoutes from './business-hours.routes.js';
import fixedAppointmentsRoutes from './fixed-appointments.routes.js';
import healthRoutes from './health.routes.js';
import servicesRoutes from './services.routes.js';
import settingsRoutes from './settings.routes.js';
import spreadsheetRoutes from './spreadsheet.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/services', servicesRoutes);
router.use('/availability', availabilityRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/fixed-appointments', fixedAppointmentsRoutes);
router.use('/blocked-times', blockedTimesRoutes);
router.use('/business-hours', businessHoursRoutes);
router.use('/settings', settingsRoutes);
router.use('/spreadsheet', spreadsheetRoutes);

export default router;
