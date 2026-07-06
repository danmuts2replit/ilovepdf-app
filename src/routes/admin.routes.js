import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdminKey } from '../middleware/adminAuth.middleware.js';
import { renderAdmin, renderAdminLogin, adminLogin, adminLogout } from '../controllers/admin.controller.js';

const router = Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin login attempts. Please try again later.',
});

router.get('/admin/login', renderAdminLogin);
router.post('/admin/login', adminLoginLimiter, adminLogin);
router.get('/admin/logout', adminLogout);
router.get('/admin', requireAdminKey, renderAdmin);

export default router;
