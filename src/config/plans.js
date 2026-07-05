// Paystack account for this integration only accepts KES (Kenyan Shillings) — verified
// against the live account, USD/GHS/NGN are rejected with "unsupported_currency".
// amountKes values below were converted from the original USD prices at ~129.23 KES/USD
// (2026-07-05) and rounded to clean numbers. amountUsd is kept for reference/display only.
export const USD_TO_KES_RATE = 129.23;

export const PLANS = {
  weekly: { name: 'weekly', label: 'Weekly', amountUsd: 3, amountKes: 390, durationDays: 7 },
  monthly: { name: 'monthly', label: 'Monthly', amountUsd: 6, amountKes: 780, durationDays: 30 },
  yearly: { name: 'yearly', label: 'Yearly', amountUsd: 40, amountKes: 5200, durationDays: 365 },
};

export const TRIAL_DAYS = 3;

export function getPlan(name) {
  return PLANS[name] || null;
}
