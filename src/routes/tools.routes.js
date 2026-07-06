import { Router } from 'express';
import multer from 'multer';
import { renderToolPage, processToolUpload, downloadResult, redirectLegacyToolPage } from '../controllers/tools.controller.js';
import { enforceUsageLimit } from '../middleware/usageLimit.middleware.js';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024, files: 20 },
});

// Legacy nested URLs (/tools/:slug) — permanently redirect the page view to the new flat,
// long-tail URL (/:slug) so search engines consolidate ranking signal there. The process/download
// action endpoints are left working under the old prefix too, in case any in-flight session or
// bookmark still references them; they aren't pages that get indexed anyway.
const router = Router();
router.get('/tools/:slug', redirectLegacyToolPage);
router.post('/tools/:slug/process', upload.array('file', 20), enforceUsageLimit, processToolUpload);
router.get('/tools/:slug/download/:fileName', downloadResult);

export default router;

// Flat, root-level tool URLs, e.g. /word-to-pdf instead of /tools/word-to-pdf. Mounted last in
// server.js (right before the 404 handler) so every other named route (/login, /admin, /trial,
// etc.) is matched first; only truly unknown single-segment paths reach the tool-or-404 lookup.
export const cleanToolRouter = Router();
cleanToolRouter.post('/:slug/process', upload.array('file', 20), enforceUsageLimit, processToolUpload);
cleanToolRouter.get('/:slug/download/:fileName', downloadResult);
cleanToolRouter.get('/:slug', renderToolPage);
