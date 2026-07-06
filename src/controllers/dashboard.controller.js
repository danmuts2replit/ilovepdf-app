import pool from '../config/database.js';
import { TOOLS } from '../config/tools.js';
import { FREE_USES_LIMIT } from '../services/usage.service.js';

export async function renderDashboard(req, res, next) {
  try {
    const userId = req.session.userId;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    const [usageRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM tool_usage WHERE user_id = ? AND usage_type = 'free'`,
      [userId]
    );
    const freeUsesRemaining = Math.max(0, FREE_USES_LIMIT - usageRows[0].cnt);

    res.render('dashboard', {
      title: 'Dashboard',
      user,
      freeUsesRemaining,
      tools: TOOLS,
      noindex: true,
    });
  } catch (err) {
    next(err);
  }
}
