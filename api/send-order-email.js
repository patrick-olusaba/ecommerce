// Vercel serverless function: sends the order confirmation the checkout promises.
// Set RESEND_API_KEY (and ORDER_EMAIL_FROM, once your domain is verified) in the
// Vercel project env. Without a key it reports sent:false and the UI stays honest.
//
// ponytail: no order-authenticity check — anyone who can POST here can mail a
// receipt to any address. Add a Firestore lookup of `orderId` if that gets abused.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const ORDER_ID_RE = /^AVT-\d{6}$/;
const MAX_ITEMS = 50;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function ksh(amount) {
  return `KSh ${Number(amount).toLocaleString('en-KE')}`;
}

function isMoney(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Validates the payload and renders the email. Throws Error on bad input. */
export function buildOrderEmail(payload) {
  const { to, orderId, items, total, shipping } = payload ?? {};

  if (typeof to !== 'string' || to.length > 200 || !EMAIL_RE.test(to)) throw new Error('Invalid recipient');
  if (typeof orderId !== 'string' || !ORDER_ID_RE.test(orderId)) throw new Error('Invalid order id');
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) throw new Error('Invalid items');
  if (!isMoney(total) || !isMoney(shipping)) throw new Error('Invalid totals');

  const rows = items.map((item) => {
    const { name, quantity, price } = item ?? {};
    if (typeof name !== 'string' || name.length === 0 || name.length > 120) throw new Error('Invalid item name');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Invalid item quantity');
    if (!isMoney(price)) throw new Error('Invalid item price');
    return `<tr><td>${escapeHtml(name)}</td><td align="center">${quantity}</td><td align="right">${ksh(price * quantity)}</td></tr>`;
  }).join('');

  const subtotal = total - shipping;
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e">
  <h1 style="font-size:1.3rem;margin:0 0 4px">Thanks for your order</h1>
  <p style="color:#94a3b8;margin:0 0 20px">Order #${escapeHtml(orderId)}</p>
  <table width="100%" cellpadding="8" style="border-collapse:collapse;font-size:14px">
    <thead><tr style="border-bottom:2px solid #e2e8f0;color:#94a3b8">
      <th align="left">Item</th><th align="center">Qty</th><th align="right">Price</th>
    </tr></thead>
    <tbody>${rows}
      <tr><td colspan="2">Subtotal</td><td align="right">${ksh(subtotal)}</td></tr>
      <tr><td colspan="2">Shipping</td><td align="right">${shipping === 0 ? 'Free' : ksh(shipping)}</td></tr>
      <tr style="border-top:2px solid #1a1a2e;font-weight:700"><td colspan="2">Total</td><td align="right">${ksh(total)}</td></tr>
    </tbody>
  </table>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px">Track your order at avytrendy.com/track-order</p>
</div>`;

  return { to, subject: `Your Avytrendy order ${orderId}`, html };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ sent: false, error: 'Method not allowed' });

  let email;
  try {
    email = buildOrderEmail(req.body);
  } catch (err) {
    return res.status(400).json({ sent: false, error: err.message });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(200).json({ sent: false, error: 'Email not configured' });

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM || 'Avytrendy <onboarding@resend.dev>',
        to: [email.to],
        subject: email.subject,
        html: email.html,
      }),
    });
    if (!resp.ok) {
      // ponytail: pass the provider's message straight through. Buried in Vercel
      // logs it is useless; the usual one is "you can only send testing emails to
      // your own address" — an unverified sender domain.
      const detail = await resp.text();
      console.error('Resend rejected order email', resp.status, detail);
      return res.status(200).json({ sent: false, error: `Resend ${resp.status}: ${detail.slice(0, 300)}` });
    }
    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('Order email failed', err);
    return res.status(200).json({ sent: false, error: 'Email delivery failed' });
  }
}
