// Run: node --test tests/order-email.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderEmail } from '../api/send-order-email.js';

const valid = {
  to: 'buyer@example.com',
  orderId: 'AVT-100101',
  items: [{ name: 'Floral Midi Dress', quantity: 2, price: 3500 }],
  total: 7400,
  shipping: 400,
};

test('renders line totals and the grand total', () => {
  const { subject, html } = buildOrderEmail(valid);
  assert.equal(subject, 'Your Avytrendy order AVT-100101');
  assert.match(html, /KSh 7,000/); // 2 x 3500
  assert.match(html, /KSh 7,400/);
});

test('free shipping renders as Free, not KSh 0', () => {
  const { html } = buildOrderEmail({ ...valid, shipping: 0, total: 7000 });
  assert.match(html, />Free</);
});

test('escapes item names so a product title cannot inject markup', () => {
  const { html } = buildOrderEmail({
    ...valid,
    items: [{ name: '<script>alert(1)</script>', quantity: 1, price: 100 }],
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('rejects bad input instead of mailing it', () => {
  for (const bad of [
    undefined,
    { ...valid, to: 'not-an-email' },
    { ...valid, orderId: 'DROP-TABLE' },
    { ...valid, items: [] },
    { ...valid, total: -1 },
    { ...valid, items: [{ name: 'Tee', quantity: 1.5, price: 800 }] },
    { ...valid, items: [{ name: 'Tee', quantity: 1, price: 'free' }] },
  ]) {
    assert.throws(() => buildOrderEmail(bad));
  }
});
