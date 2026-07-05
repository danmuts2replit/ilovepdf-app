import axios from 'axios';
import crypto from 'crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function client() {
  return axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

/** Paystack expects amounts in the smallest currency unit (e.g. cents for USD). */
export function toSubunit(amountMajor) {
  return Math.round(Number(amountMajor) * 100);
}

export async function initializeTransaction({ email, amountMajor, planName, currency, metadata }) {
  const payload = {
    email,
    amount: toSubunit(amountMajor),
    currency: currency || process.env.PAYSTACK_CURRENCY || 'USD',
    callback_url: process.env.PAYSTACK_CALLBACK_URL,
    metadata: { planName, ...metadata },
  };
  const { data } = await client().post('/transaction/initialize', payload);
  return data;
}

export async function verifyTransaction(reference) {
  const { data } = await client().get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data;
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  return hash === signature;
}
