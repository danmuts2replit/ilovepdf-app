import { Router } from 'express';
import { requireAdminKey } from '../middleware/adminAuth.middleware.js';
import { renderAdmin } from '../controllers/admin.controller.js';

const router = Router();

router.get('/admin', requireAdminKey, renderAdmin);

export default router;
