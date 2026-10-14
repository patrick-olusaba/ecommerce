// Run: node --test tests/status-email.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStatusEmail, parseOrderDoc } from '../api/send-status-email.js';

test('shipped and delivered render distinct subjects', () => {
  assert.match(buildStatusEmail({ orderId: 'AVT-100101', status: 3 }).subject, /has shipped/);
  assert.match(buildStatusEmail({ orderId: 'AVT-100101', status: 4 }).subject, /was delivered/);
});

test('Order Placed and unknown statuses send nothing', () => {
  assert.equal(buildStatusEmail({ orderId: 'AVT-100101', status: 1 }), null);
  assert.equal(buildStatusEmail({ orderId: 'AVT-100101', status: NaN }), null);
});

test('escapes the customer name', () => {
  const { html } = buildStatusEmail({ orderId: 'AVT-100101', status: 2, name: '<b>x</b>' });
  assert.doesNotMatch(html, /<b>x/);
});

test('parses a Firestore REST order document', () => {
  const doc = { fields: { email: { stringValue: 'a@b.co' }, status: { integerValue: '3' }, customer: { mapValue: { fields: { name: { stringValue: 'Amy' } } } } } };
  assert.deepEqual(parseOrderDoc(doc), { email: 'a@b.co', status: 3, name: 'Amy' });
});
