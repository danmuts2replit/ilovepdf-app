import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { renderDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/dashboard', requireAuth, renderDashboard);

export default router;
