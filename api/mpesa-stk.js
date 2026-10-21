// Starts an M-Pesa STK push (the prompt on the customer's phone). Returns { checkoutRequestId }.
// The amount is priced here from the cart's product ids and quantities (api/_pricing.js);
// the browser's own total is never trusted.
import { priceOrder } from './_pricing.js';
import { darajaPost, mpesaConfig, normalizePhone, stkPassword, timestamp } from './_mpesa.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cfg = mpesaConfig();
  if (!cfg) return res.status(200).json({ error: 'M-Pesa is not configured' });

  const phone = normalizePhone(req.body?.phone);
  if (!phone) return res.status(400).json({ error: 'Invalid phone number' });

  let amount;
  try {
    ({ amount } = await priceOrder(req.body?.items));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (amount < 1 || amount > 250000) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const ts = timestamp();
    const { ok, data } = await darajaPost(cfg, '/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: cfg.shortcode,
      Password: stkPassword(cfg.shortcode, cfg.passkey, ts),
      Timestamp: ts,
      TransactionType: cfg.txnType,
      Amount: amount,
      PartyA: phone,
      PartyB: cfg.shortcode,
      PhoneNumber: phone,
      CallBackURL: cfg.callbackUrl,
      AccountReference: 'AVYTRENDY',
      TransactionDesc: 'Avytrendy order',
    });
    if (!ok || data.ResponseCode !== '0') {
      console.error('STK push rejected', data);
      return res.status(200).json({ error: data.errorMessage || data.ResponseDescription || 'Could not start M-Pesa payment' });
    }
    return res.status(200).json({ checkoutRequestId: data.CheckoutRequestID, amount });
  } catch (err) {
    console.error('STK push failed', err);
    // Daraja auth errors carry only a status code (no secrets), and are the usual first-setup failure.
    return res.status(200).json({ error: String(err?.message).startsWith('Daraja') ? err.message : 'Could not reach M-Pesa' });
  }
}
