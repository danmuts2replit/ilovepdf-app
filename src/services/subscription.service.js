import pool from '../config/database.js';
import { getPlan } from '../config/plans.js';
import { addDays } from '../utils/date.js';

export async function getActiveSubscription(userId) {
  if (!userId) return null;
  const [rows] = await pool.query(
    `SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND end_date >= NOW() ORDER BY end_date DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// Idempotent by paystackReference: if a payment's success row is recorded but subscription
// creation fails transiently (network blip, process restart, etc.), the callback/webhook may
// be retried against a reference that's already marked as a processed payment. Without this
// check, that retry would silently never create the subscription (since the payment-level
// idempotency guard in payment.controller.js would already consider the reference "handled").
// Checking for an existing subscription row for this reference lets us safely re-attempt.
export async function createSubscriptionFromPayment({ userId, planName, amount, currency, paystackReference }) {
  const plan = getPlan(planName);
  if (!plan) throw new Error(`Invalid plan: ${planName}`);

  if (paystackReference) {
    const [existing] = await pool.query(
      `SELECT id, start_date, end_date FROM subscriptions WHERE paystack_reference = ? LIMIT 1`,
      [paystackReference]
    );
    if (existing.length > 0) {
      return { startDate: existing[0].start_date, endDate: existing[0].end_date };
    }
  }

  const startDate = new Date();
  const endDate = addDays(startDate, plan.durationDays);

  await pool.query(
    `INSERT INTO subscriptions (user_id, plan_name, amount, currency, status, start_date, end_date, paystack_reference)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
    [userId, planName, amount, currency || 'KES', startDate, endDate, paystackReference || null]
  );

  return { startDate, endDate };
}
