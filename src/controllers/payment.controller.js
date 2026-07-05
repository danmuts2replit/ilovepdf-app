import pool from '../config/database.js';
import { getPlan } from '../config/plans.js';
import { initializeTransaction, verifyTransaction, verifyWebhookSignature } from '../services/paystack.service.js';
import { createSubscriptionFromPayment } from '../services/subscription.service.js';

async function recordPayment(txData, status, userId) {
  await pool.query(
    `INSERT INTO payments (user_id, plan_name, amount, currency, status, paystack_reference, paystack_response_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId || null,
      (txData && txData.metadata && txData.metadata.planName) || 'unknown',
      txData ? Number(txData.amount || 0) / 100 : 0,
      (txData && txData.currency) || 'USD',
      status,
      (txData && txData.reference) || 'unknown',
      JSON.stringify(txData || {}),
    ]
  );
}

export async function initializePayment(req, res, next) {
  try {
    const { plan } = req.body;
    const planDef = getPlan(plan);
    if (!planDef) return res.status(400).render('payment-failed', { title: 'Payment Failed', message: 'Invalid plan selected.' });

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    const user = rows[0];
    if (!user) return res.redirect('/login');

    const data = await initializeTransaction({
      email: user.email,
      amountMajor: planDef.amountUsd,
      planName: planDef.name,
      currency: process.env.PAYSTACK_CURRENCY || 'USD',
      metadata: { userId: user.id },
    });

    if (!data.status) {
      return res.status(502).render('payment-failed', {
        title: 'Payment Failed',
        message: 'Could not start the payment. Please try again.',
      });
    }

    res.redirect(data.data.authorization_url);
  } catch (err) {
    next(err);
  }
}

export async function paymentCallback(req, res, next) {
  try {
    const reference = req.query.reference || req.query.trxref;
    if (!reference) {
      return res.render('payment-failed', { title: 'Payment Failed', message: 'Missing payment reference.' });
    }

    const verification = await verifyTransaction(reference);
    const txData = verification.data;

    if (!verification.status || !txData || txData.status !== 'success') {
      await recordPayment(txData, 'failed', req.session.userId);
      return res.render('payment-failed', { title: 'Payment Failed', message: 'Your payment was not successful.' });
    }

    const planName = txData.metadata && txData.metadata.planName;
    const userId = (txData.metadata && txData.metadata.userId) || req.session.userId;

    await recordPayment(txData, 'success', userId);

    if (planName && userId) {
      const planDef = getPlan(planName);
      if (planDef) {
        await createSubscriptionFromPayment({
          userId,
          planName,
          amount: planDef.amountUsd,
          currency: txData.currency || 'USD',
          paystackReference: reference,
        });
      }
    }

    res.render('payment-success', {
      title: 'Payment Successful',
      heading: 'Subscription Activated',
      message: 'Your subscription is now active. Enjoy unlimited access to every PDF tool!',
    });
  } catch (err) {
    next(err);
  }
}

export async function paystackWebhook(req, res, next) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.rawBody;

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ status: false, message: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const txData = event.data;
      const planName = txData.metadata && txData.metadata.planName;
      const userId = txData.metadata && txData.metadata.userId;

      await recordPayment(txData, 'success', userId);

      if (planName && userId) {
        const planDef = getPlan(planName);
        if (planDef) {
          await createSubscriptionFromPayment({
            userId,
            planName,
            amount: planDef.amountUsd,
            currency: txData.currency || 'USD',
            paystackReference: txData.reference,
          });
        }
      }
    }

    res.status(200).json({ status: true });
  } catch (err) {
    next(err);
  }
}
