export function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_KEY;

  if (!expected) {
    return res.status(503).render('404', {
      title: 'Admin Disabled',
      message: 'Set ADMIN_KEY in your environment to enable the admin dashboard.',
    });
  }

  const provided = req.query.key || req.headers['x-admin-key'];
  if (provided !== expected) {
    return res.status(403).render('404', { title: 'Forbidden', message: 'Invalid or missing admin key.' });
  }

  next();
}
