import { getActiveSubscription } from '../services/subscription.service.js';
import { isTrialActive } from '../services/trial.service.js';
import pool from '../config/database.js';

export async function attachSubscriptionStatus(req, res, next) {
  try {
    if (req.session && req.session.userId) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
      const user = rows[0] || null;
      res.locals.subscription = await getActiveSubscription(req.session.userId);
      res.locals.trialActive = isTrialActive(user);
      res.locals.currentUser = user;
    } else {
      res.locals.subscription = null;
      res.locals.trialActive = false;
      res.locals.currentUser = null;
    }
    next();
  } catch (err) {
    next(err);
  }
}
