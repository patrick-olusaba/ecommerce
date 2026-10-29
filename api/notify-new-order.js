// Vercel serverless function: emails the shop owner when a new order lands.
// Set ADMIN_ALERT_EMAIL (plus RESEND_API_KEY, shared with the receipt emails) in the Vercel env.
//
// Everything in the email comes from the order document in Firestore, never from the request,
// so a caller can only ask for an alert about a real order. Orders older than MAX_AGE_MS are
// ignored so an old order id can't be replayed to spam the inbox.
//
// ponytail: no dedupe within the window — add an `alerted` field on the order if it gets repeated.

const ORDER_ID_RE = /^AVT-\d{6}(-[A-Z0-9]{6})?$/;
const MAX_AGE_MS = 10 * 60 * 1000;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const ksh = (n) => `KSh ${Number(n).toLocaleString('en-KE')}`;

/** Firestore REST wraps every value ({ stringValue }, { mapValue }, ...); unwrap it to plain JSON. */
export function fromFirestore(v) {
  if (v == null) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromFirestore);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, fromFirestore(x)]));
  return undefined;
}

export function isFresh(order, now = Date.now()) {
  const t = Date.parse(order?.date);
  return Number.isFinite(t) && now - t >= 0 && now - t <= MAX_AGE_MS;
}

/** Renders the alert for a plain order object. */
export function buildAlertEmail(order) {
  const c = order.customer ?? {};
  const cod = order.paymentMethod === 'cod';
  const rows = (order.items ?? []).map((i) =>
    `<tr><td>${escapeHtml(i.name)}</td><td align="center">${escapeHtml(i.quantity)}</td><td align="right">${ksh(i.price * i.quantity)}</td></tr>`).join('');
  const note = cod
    ? (order.confirmed
      ? 'Cash on Delivery — returning customer, already confirmed.'
      : 'Cash on Delivery — <strong>awaiting WhatsApp confirmation</strong>. Don\'t dispatch until they confirm.')
    : 'Paid by M-Pesa.';
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e">
  <h1 style="font-size:1.2rem;margin:0 0 4px">New order ${escapeHtml(order.id)}</h1>
  <p style="margin:0 0 16px;color:#64748b">${note}</p>
  <p style="margin:0 0 16px;font-size:14px">
    <strong>${escapeHtml(c.name)}</strong><br>
    ${escapeHtml(order.phone)}<br>
    ${escapeHtml(c.address)}, ${escapeHtml(c.city)}
  </p>
  <table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:14px">
    <tbody>${rows}
      <tr style="border-top:2px solid #1a1a2e;font-weight:700"><td colspan="2">Total</td><td align="right">${ksh(order.total)}</td></tr>
    </tbody>
  </table>
</div>`;
  return { subject: `New order ${order.id} — ${ksh(order.total)}${cod && !order.confirmed ? ' (confirm on WhatsApp)' : ''}`, html };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ sent: false, error: 'Method not allowed' });
  const orderId = req.body?.orderId;
  if (typeof orderId !== 'string' || !ORDER_ID_RE.test(orderId)) return res.status(400).json({ sent: false, error: 'Invalid order id' });

  const apiKey = process.env.RESEND_API_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!apiKey || !projectId || !to) return res.status(200).json({ sent: false, error: 'Alert not configured' });

  try {
    const docResp = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/orders/${orderId}`);
    if (!docResp.ok) return res.status(200).json({ sent: false, error: 'Order not found' });
    const order = fromFirestore({ mapValue: { fields: (await docResp.json()).fields } });
    if (!isFresh(order)) return res.status(200).json({ sent: false, error: 'Order too old' });

    const { subject, html } = buildAlertEmail(order);
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM || 'Avytrendy <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });
    if (!resp.ok) {
      console.error('Resend rejected admin alert', resp.status, await resp.text());
      return res.status(200).json({ sent: false, error: `Resend ${resp.status}` });
    }
    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('Admin alert failed', err);
    return res.status(200).json({ sent: false, error: 'Alert delivery failed' });
  }
}
