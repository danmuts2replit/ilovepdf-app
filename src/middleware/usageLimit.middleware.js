import { checkAccess } from '../services/usage.service.js';
import { generateFingerprint, getClientIp } from '../utils/fingerprint.js';

export async function enforceUsageLimit(req, res, next) {
  try {
    const fingerprint = generateFingerprint(req);
    const ipAddress = getClientIp(req);
    const userId = req.session && req.session.userId ? req.session.userId : null;

    const access = await checkAccess({ userId, fingerprint });
    req.accessInfo = { ...access, fingerprint, ipAddress, userId };

    if (!access.allowed) {
      return res.redirect('/usage-blocked');
    }

    next();
  } catch (err) {
    next(err);
  }
}
