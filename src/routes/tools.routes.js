import { Router } from 'express';
import multer from 'multer';
import { renderToolPage, processToolUpload } from '../controllers/tools.controller.js';
import { enforceUsageLimit } from '../middleware/usageLimit.middleware.js';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();

router.get('/tools/:slug', renderToolPage);
router.post('/tools/:slug/process', upload.single('file'), enforceUsageLimit, processToolUpload);

export default router;
