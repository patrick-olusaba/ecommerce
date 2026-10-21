// Asks Daraja whether an STK push was paid. Returns { status: 'paid' | 'pending' | 'failed', message? }.
// The browser never decides "paid" itself; it only believes this answer.
import { darajaPost, mpesaConfig, stkPassword, timestamp } from './_mpesa.js';

/** Maps a Daraja STK query response onto paid / pending / failed. */
export function interpretQuery({ ok, data }) {
  if (ok && data.ResultCode !== undefined) {
    if (String(data.ResultCode) === '0') return { status: 'paid' };
    if (String(data.ResultCode) === '4999') return { status: 'pending' }; // Daraja: "still under processing"
    return { status: 'failed', message: data.ResultDesc || 'Payment was not completed' };
  }
  // While the customer is still entering their PIN Daraja answers with an error, not a result.
  return { status: 'pending' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cfg = mpesaConfig();
  if (!cfg) return res.status(200).json({ status: 'failed', message: 'M-Pesa is not configured' });

  const id = req.body?.checkoutRequestId;
  if (typeof id !== 'string' || !/^ws_CO_\w+$/.test(id)) return res.status(400).json({ error: 'Invalid request id' });

  try {
    const ts = timestamp();
    const result = await darajaPost(cfg, '/mpesa/stkpushquery/v1/query', {
      BusinessShortCode: cfg.shortcode,
      Password: stkPassword(cfg.shortcode, cfg.passkey, ts),
      Timestamp: ts,
      CheckoutRequestID: id,
    });
    return res.status(200).json(interpretQuery(result));
  } catch (err) {
    console.error('STK query failed', err);
    return res.status(200).json({ status: 'pending' });
  }
}
