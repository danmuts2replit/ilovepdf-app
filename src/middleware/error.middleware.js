export function notFoundHandler(req, res) {
  res.status(404).render('404', { title: 'Page Not Found', noindex: true });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : err.message;
  res.status(status).render('404', { title: 'Error', message, noindex: true });
}
