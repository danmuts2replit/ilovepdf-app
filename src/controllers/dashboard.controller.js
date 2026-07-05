import pool from '../config/database.js';
import { TOOLS } from '../config/tools.js';

export async function renderDashboard(req, res, next) {
  try {
    const userId = req.session.userId;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    const [usageRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM tool_usage WHERE user_id = ? AND usage_type = 'free'`,
      [userId]
    );
    const freeToolUsed = usageRows[0].cnt > 0;

    res.render('dashboard', {
      title: 'Dashboard',
      user,
      freeToolUsed,
      tools: TOOLS,
    });
  } catch (err) {
    next(err);
  }
}
