export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days));
  return d;
}

export function isPast(date) {
  if (!date) return true;
  return new Date(date).getTime() < Date.now();
}

export function isFuture(date) {
  if (!date) return false;
  return new Date(date).getTime() >= Date.now();
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}
