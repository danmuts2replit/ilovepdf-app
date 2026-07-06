export function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_KEY;

  if (!expected) {
    return res.status(503).render('404', {
      title: 'Admin Disabled',
      message: 'Set ADMIN_KEY in your environment to enable the admin dashboard.',
    });
  }

  if (req.session && req.session.isAdmin) {
    return next();
  }

  const provided = req.query.key || req.headers['x-admin-key'];
  if (provided === expected) {
    req.session.isAdmin = true;
    return next();
  }

  return res.redirect('/admin/login');
}
