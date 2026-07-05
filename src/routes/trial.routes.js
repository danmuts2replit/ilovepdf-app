import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { renderTrialPage, startTrialHandler } from '../controllers/trial.controller.js';

const router = Router();

router.get('/trial', requireAuth, renderTrialPage);
router.post('/trial/start', requireAuth, startTrialHandler);

export default router;
