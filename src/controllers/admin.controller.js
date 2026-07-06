import pool from '../config/database.js';

async function countQuery(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows[0].count;
}

export function renderAdminLogin(req, res) {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.render('admin-login', { title: 'Admin Login', error: null, noindex: true });
}

export function adminLogin(req, res) {
  const expected = process.env.ADMIN_KEY;
  const { key } = req.body;

  if (!expected) {
    return res.status(503).render('404', {
      title: 'Admin Disabled',
      message: 'Set ADMIN_KEY in your environment to enable the admin dashboard.',
      noindex: true,
    });
  }

  if (key !== expected) {
    return res.status(403).render('admin-login', { title: 'Admin Login', error: 'Invalid admin key.', noindex: true });
  }

  req.session.isAdmin = true;
  res.redirect('/admin');
}

export function adminLogout(req, res) {
  if (req.session) {
    req.session.isAdmin = false;
  }
  res.redirect('/admin/login');
}

export async function renderAdmin(req, res, next) {
  try {
    const totalUsers = await countQuery('SELECT COUNT(*) AS count FROM users');
    const activeTrials = await countQuery(
      `SELECT COUNT(*) AS count FROM users WHERE trial_end IS NOT NULL AND trial_end >= NOW()`
    );
    const activeSubscriptions = await countQuery(
      `SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'active' AND end_date >= NOW()`
    );
    const totalPayments = await countQuery(`SELECT COUNT(*) AS count FROM payments WHERE status = 'success'`);
    const totalToolUsages = await countQuery('SELECT COUNT(*) AS count FROM tool_usage');
    const guestsBlocked = await countQuery('SELECT COUNT(*) AS count FROM guest_usage WHERE used_count >= 1');

    const [revenueRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'success'`
    );
    const totalRevenue = revenueRows[0].total;

    const [mostUsedTools] = await pool.query(
      `SELECT tool_slug, COUNT(*) AS usage_count FROM tool_usage GROUP BY tool_slug ORDER BY usage_count DESC LIMIT 5`
    );

    const [recentPayments] = await pool.query(
      `SELECT p.*, u.email FROM payments p LEFT JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT 10`
    );

    res.render('admin', {
      title: 'Admin Dashboard',
      stats: {
        totalUsers,
        activeTrials,
        activeSubscriptions,
        totalPayments,
        totalToolUsages,
        guestsBlocked,
        totalRevenue,
      },
      mostUsedTools,
      recentPayments,
      noindex: true,
    });
  } catch (err) {
    next(err);
  }
}
