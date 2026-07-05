import { Router } from 'express';
import multer from 'multer';
import { renderToolPage, processToolUpload, downloadResult } from '../controllers/tools.controller.js';
import { enforceUsageLimit } from '../middleware/usageLimit.middleware.js';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024, files: 20 },
});

const router = Router();

router.get('/tools/:slug', renderToolPage);
router.post('/tools/:slug/process', upload.array('file', 20), enforceUsageLimit, processToolUpload);
router.get('/tools/:slug/download/:fileName', downloadResult);

export default router;
