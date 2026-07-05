// Paystack account for this integration only accepts KES (Kenyan Shillings) — verified
// against the live account, USD/GHS/NGN are rejected with "unsupported_currency".
// These are the exact live prices/plan codes configured in the Paystack dashboard.
// Charging is still amount-based (transaction/initialize), not Paystack's recurring
// subscription API — planCode is carried through as metadata for reconciliation only.
export const PLANS = {
  weekly: { name: 'weekly', label: 'Weekly', amountKes: 390, durationDays: 7, planCode: 'PLN_c17x3g2oebzkikq' },
  monthly: { name: 'monthly', label: 'Monthly', amountKes: 779, durationDays: 30, planCode: 'PLN_fqtq6w0x19uk084' },
  yearly: { name: 'yearly', label: 'Yearly', amountKes: 5179, durationDays: 365, planCode: 'PLN_rssnulxmn82ahdm' },
};

export const TRIAL_DAYS = 3;

export function getPlan(name) {
  return PLANS[name] || null;
}
