export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function isStrongEnoughPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

export function sanitizeName(name) {
  return String(name || '').trim().slice(0, 255);
}
