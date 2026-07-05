export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

export function attachUser(req, res, next) {
  res.locals.isAuthenticated = !!(req.session && req.session.userId);
  res.locals.userEmail = (req.session && req.session.userEmail) || null;
  next();
}
