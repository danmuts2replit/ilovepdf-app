import pool from '../config/database.js';
import { TRIAL_DAYS } from '../config/plans.js';
import { addDays, isFuture } from '../utils/date.js';

export function isTrialActive(user) {
  if (!user || !user.trial_end) return false;
  return isFuture(user.trial_end);
}

export async function startTrial(userId) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  const user = rows[0];
  if (!user) throw new Error('User not found');
  if (user.trial_used) throw new Error('Trial already used');

  const start = new Date();
  const end = addDays(start, TRIAL_DAYS);

  await pool.query('UPDATE users SET trial_used = 1, trial_start = ?, trial_end = ? WHERE id = ?', [
    start,
    end,
    userId,
  ]);

  return { start, end };
}
