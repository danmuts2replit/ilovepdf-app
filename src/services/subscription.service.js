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

export async function createSubscriptionFromPayment({ userId, planName, amount, currency, paystackReference }) {
  const plan = getPlan(planName);
  if (!plan) throw new Error(`Invalid plan: ${planName}`);

  const startDate = new Date();
  const endDate = addDays(startDate, plan.durationDays);

  await pool.query(
    `INSERT INTO subscriptions (user_id, plan_name, amount, currency, status, start_date, end_date, paystack_reference)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
    [userId, planName, amount, currency || 'USD', startDate, endDate, paystackReference || null]
  );

  return { startDate, endDate };
}
