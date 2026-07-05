import pool from '../config/database.js';
import { startTrial } from '../services/trial.service.js';

export function renderTrialPage(req, res) {
  res.render('trial', { title: 'Start Your Free Trial', error: null });
}

export async function startTrialHandler(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    const user = rows[0];

    if (!user) return res.redirect('/login');

    if (user.trial_used) {
      return res.status(400).render('trial', {
        title: 'Start Your Free Trial',
        error: 'You have already used your free trial.',
      });
    }

    await startTrial(user.id);
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
}
