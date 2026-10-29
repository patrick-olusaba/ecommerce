import test from 'node:test';
import assert from 'node:assert/strict';
import { fromFirestore, isFresh, buildAlertEmail } from '../api/notify-new-order.js';

const doc = {
  mapValue: { fields: {
    id: { stringValue: 'AVT-123456-ABC123' },
    date: { stringValue: new Date().toISOString() },
    total: { integerValue: '5000' },
    paymentMethod: { stringValue: 'cod' },
    phone: { stringValue: '0712345678' },
    items: { arrayValue: { values: [{ mapValue: { fields: {
      name: { stringValue: '<b>Tee</b>' }, quantity: { integerValue: '2' }, price: { integerValue: '2500' },
    } } }] } },
    customer: { mapValue: { fields: { name: { stringValue: 'Amina' }, city: { stringValue: 'Nairobi' } } } },
  } },
};

test('unwraps Firestore REST values and renders an alert', () => {
  const order = fromFirestore(doc);
  assert.equal(order.total, 5000);
  const { subject, html } = buildAlertEmail(order);
  assert.match(subject, /confirm on WhatsApp/);
  assert.match(html, /awaiting WhatsApp confirmation/);
  assert.ok(!html.includes('<b>Tee</b>'), 'item names are escaped');
});

test('only recent orders are alertable', () => {
  assert.ok(isFresh({ date: new Date().toISOString() }));
  assert.ok(!isFresh({ date: new Date(Date.now() - 3600_000).toISOString() }));
  assert.ok(!isFresh({}));
});
