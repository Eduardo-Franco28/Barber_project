import { Router } from 'express';

import * as publicController from '../controllers/barbershop-public.controller.js';
import { resolveBarbershop } from '../middlewares/resolve-barbershop.js';
import { validateQuery } from '../middlewares/validate.js';
import { availabilityQuerySchema } from '../validators/appointments.schemas.js';

// Montado em /b/:slug — vitrine pública da barbearia (sem login). O cadastro/
// login ficam em /b/:slug/auth (barbershop-auth.routes.js).
const router = Router({ mergeParams: true });

router.use(resolveBarbershop);

router.get('/', publicController.info);
router.get('/barbers', publicController.barbers);
router.get('/barbers/:barberId/services', publicController.services);
router.get(
  '/barbers/:barberId/availability',
  validateQuery(availabilityQuerySchema),
  publicController.availability
);

export default router;
