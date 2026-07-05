import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { initializePayment, paymentCallback, paystackWebhook } from '../controllers/payment.controller.js';

const router = Router();

router.post('/payment/initialize', requireAuth, initializePayment);
router.get('/payment/callback', paymentCallback);
router.post('/api/paystack/webhook', paystackWebhook);

export default router;
