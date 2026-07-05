export const PLANS = {
  weekly: { name: 'weekly', label: 'Weekly', amountUsd: 3, durationDays: 7 },
  monthly: { name: 'monthly', label: 'Monthly', amountUsd: 6, durationDays: 30 },
  yearly: { name: 'yearly', label: 'Yearly', amountUsd: 40, durationDays: 365 },
};

export const TRIAL_DAYS = 3;

export function getPlan(name) {
  return PLANS[name] || null;
}
