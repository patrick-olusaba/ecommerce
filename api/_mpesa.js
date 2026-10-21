// Shared Daraja helpers (underscore prefix: Vercel does not expose this file as a route).
// Env: MPESA_ENV (sandbox|live, default sandbox), MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
// MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL, MPESA_TXN_TYPE (optional:
// CustomerPayBillOnline [default] or CustomerBuyGoodsOnline for a Till).

/** Normalises 07XXXXXXXX / +2547XXXXXXXX / 2547XXXXXXXX to 2547XXXXXXXX, or null. */
export function normalizePhone(input) {
  const m = /^(?:\+?254|0)(7\d{8})$/.exec(String(input ?? '').replace(/[\s-]/g, ''));
  return m ? `254${m[1]}` : null;
}

export function timestamp(date = new Date()) {
  return date.toISOString().replace(/\D/g, '').slice(0, 14); // YYYYMMDDHHmmss (UTC)
}

export function stkPassword(shortcode, passkey, ts) {
  return Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
}

export function mpesaConfig(env = process.env) {
  const { MPESA_CONSUMER_KEY: key, MPESA_CONSUMER_SECRET: secret, MPESA_SHORTCODE: shortcode, MPESA_PASSKEY: passkey, MPESA_CALLBACK_URL: callbackUrl } = env;
  if (!key || !secret || !shortcode || !passkey || !callbackUrl) return null;
  return {
    key, secret, shortcode, passkey, callbackUrl,
    txnType: env.MPESA_TXN_TYPE || 'CustomerPayBillOnline',
    base: env.MPESA_ENV === 'live' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke',
  };
}

export async function getToken(cfg) {
  const auth = Buffer.from(`${cfg.key}:${cfg.secret}`).toString('base64');
  const res = await fetch(`${cfg.base}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) throw new Error(`Daraja auth failed (${res.status})`);
  return (await res.json()).access_token;
}

export async function darajaPost(cfg, path, body) {
  const token = await getToken(cfg);
  const res = await fetch(`${cfg.base}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}
