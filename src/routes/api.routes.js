import { Router } from 'express';

const router = Router();

router.get('/api/status', (req, res) => {
  res.json({ status: 'ok', app: 'ilovepdf-app', time: new Date().toISOString() });
});

export default router;
