import crypto from 'crypto';

export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

export function generateFingerprint(req) {
  const ua = req.headers['user-agent'] || '';
  const acceptLang = req.headers['accept-language'] || '';
  const ip = getClientIp(req);
  const raw = `${ip}|${ua}|${acceptLang}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}
