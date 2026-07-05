import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { isValidEmail, isStrongEnoughPassword, sanitizeName } from '../utils/validators.js';

export function renderLogin(req, res) {
  res.render('login', { title: 'Log In', error: null });
}

export function renderRegister(req, res) {
  res.render('register', { title: 'Create Account', error: null });
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || !password) {
      return res.status(400).render('login', { title: 'Log In', error: 'Please enter a valid email and password.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).render('login', { title: 'Log In', error: 'Invalid email or password.' });
    }

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!isValidEmail(email) || !isStrongEnoughPassword(password)) {
      return res.status(400).render('register', {
        title: 'Create Account',
        error: 'Please provide a valid email and a password of at least 6 characters.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length) {
      return res.status(400).render('register', {
        title: 'Create Account',
        error: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [
      sanitizeName(name),
      cleanEmail,
      passwordHash,
    ]);

    req.session.userId = result.insertId;
    req.session.userEmail = cleanEmail;
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  req.session.destroy(() => res.redirect('/'));
}
