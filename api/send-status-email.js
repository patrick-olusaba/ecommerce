// Vercel serverless function: emails the buyer when the admin moves an order's status.
// The recipient and status come from the order document in Firestore, never from the
// request, so a caller can only re-send the order's real current status to its real buyer.
// Needs RESEND_API_KEY (and VITE_FIREBASE_PROJECT_ID, already set for the web app).
//
// ponytail: no auth and no dedupe — anyone can POST an order id and re-send that
// order's status mail to its buyer. Add an ID-token check + a statusEmailedFor field if abused.

const ORDER_ID_RE = /^AVT-\d{6}(-[A-Z0-9]{6})?$/;

const MESSAGES = {
  2: { subject: 'is being prepared', heading: 'We\'re packing your order', body: 'Your order is now processing. We\'ll let you know when it ships.' },
  3: { subject: 'has shipped', heading: 'Your order is on its way', body: 'Your order has shipped and is on the way to you.' },
  4: { subject: 'was delivered', heading: 'Your order was delivered', body: 'Your order has been delivered. Thank you for shopping with Avytrendy!' },
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Returns { subject, html } for statuses 2-4, or null when there is nothing to send (1, unknown). */
export function buildStatusEmail({ orderId, status, name }) {
  const msg = MESSAGES[status];
  if (!msg) return null;
  const hello = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e">
  <h1 style="font-size:1.3rem;margin:0 0 4px">${msg.heading}</h1>
  <p style="color:#94a3b8;margin:0 0 20px">Order #${escapeHtml(orderId)}</p>
  <p>${hello}</p><p>${msg.body}</p>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px">Track your order at avytrendy.com/track-order</p>
</div>`;
  return { subject: `Your Avytrendy order ${orderId} ${msg.subject}`, html };
}

/** Reads the fields we need out of a Firestore REST document. */
export function parseOrderDoc(doc) {
  const f = doc?.fields ?? {};
  return {
    email: f.email?.stringValue,
    status: Number(f.status?.integerValue),
    name: f.customer?.mapValue?.fields?.name?.stringValue,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ sent: false, error: 'Method not allowed' });

  const orderId = req.body?.orderId;
  if (typeof orderId !== 'string' || !ORDER_ID_RE.test(orderId)) return res.status(400).json({ sent: false, error: 'Invalid order id' });

  const apiKey = process.env.RESEND_API_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return res.status(200).json({ sent: false, error: 'Email not configured' });

  try {
    const docResp = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/orders/${orderId}`);
    if (!docResp.ok) return res.status(200).json({ sent: false, error: 'Order not found' });
    const order = parseOrderDoc(await docResp.json());
    if (!order.email) return res.status(200).json({ sent: false, error: 'Order has no email' });
    const email = buildStatusEmail({ orderId, status: order.status, name: order.name });
    if (!email) return res.status(200).json({ sent: false, error: 'No email for this status' });

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM || 'Avytrendy <onboarding@resend.dev>',
        to: [order.email],
        subject: email.subject,
        html: email.html,
      }),
    });
    if (!resp.ok) {
      console.error('Resend rejected status email', resp.status, await resp.text());
      return res.status(200).json({ sent: false, error: `Resend ${resp.status}` });
    }
    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('Status email failed', err);
    return res.status(200).json({ sent: false, error: 'Email delivery failed' });
  }
}
