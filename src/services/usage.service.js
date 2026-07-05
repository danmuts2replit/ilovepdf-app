import pool from '../config/database.js';
import { getActiveSubscription } from './subscription.service.js';
import { isTrialActive } from './trial.service.js';

/**
 * Determine whether the current visitor (logged-in user or guest) may use a tool right now,
 * and under what usage type ('subscription' | 'trial' | 'free').
 */
export async function checkAccess({ userId, fingerprint }) {
  if (userId) {
    const subscription = await getActiveSubscription(userId);
    if (subscription) return { allowed: true, type: 'subscription' };

    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = userRows[0];
    if (user && isTrialActive(user)) return { allowed: true, type: 'trial' };

    const [usageRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM tool_usage WHERE user_id = ? AND usage_type = 'free'`,
      [userId]
    );
    if (usageRows[0].cnt === 0) return { allowed: true, type: 'free' };

    return { allowed: false, type: null };
  }

  // Guest visitor - tracked by device/browser fingerprint
  const [guestRows] = await pool.query('SELECT * FROM guest_usage WHERE fingerprint = ?', [fingerprint]);
  const guest = guestRows[0];
  if (!guest || guest.used_count === 0) return { allowed: true, type: 'free' };

  return { allowed: false, type: null };
}

export async function recordUsage({ userId, fingerprint, ipAddress, toolSlug, usageType }) {
  await pool.query(
    `INSERT INTO tool_usage (user_id, guest_fingerprint, tool_slug, usage_type) VALUES (?, ?, ?, ?)`,
    [userId || null, userId ? null : fingerprint, toolSlug, usageType]
  );

  if (userId) return;

  const [rows] = await pool.query('SELECT id FROM guest_usage WHERE fingerprint = ?', [fingerprint]);
  if (rows.length) {
    await pool.query('UPDATE guest_usage SET used_count = used_count + 1, ip_address = ? WHERE fingerprint = ?', [
      ipAddress,
      fingerprint,
    ]);
  } else {
    await pool.query(
      'INSERT INTO guest_usage (fingerprint, ip_address, used_count, first_tool_slug) VALUES (?, ?, 1, ?)',
      [fingerprint, ipAddress, toolSlug]
    );
  }
}
