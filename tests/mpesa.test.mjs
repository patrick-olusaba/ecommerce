import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, stkPassword, timestamp, mpesaConfig } from '../api/_mpesa.js';
import { interpretQuery } from '../api/mpesa-status.js';

test('normalizePhone accepts the Kenyan formats', () => {
  for (const p of ['0712345678', '+254712345678', '254712345678', '+254 712 345 678']) assert.equal(normalizePhone(p), '254712345678');
  for (const p of ['0112345678', '12345', '', undefined]) assert.equal(normalizePhone(p), null);
});

test('stkPassword and timestamp follow the Daraja format', () => {
  assert.equal(timestamp(new Date('2026-10-20T12:34:56Z')), '20261020123456');
  assert.equal(stkPassword('174379', 'pass', '20261020123456'), Buffer.from('174379pass20261020123456').toString('base64'));
});

test('mpesaConfig is null until every variable is set, sandbox by default', () => {
  assert.equal(mpesaConfig({}), null);
  const cfg = mpesaConfig({ MPESA_CONSUMER_KEY: 'k', MPESA_CONSUMER_SECRET: 's', MPESA_SHORTCODE: '174379', MPESA_PASSKEY: 'p', MPESA_CALLBACK_URL: 'https://x/cb' });
  assert.equal(cfg.base, 'https://sandbox.safaricom.co.ke');
});

test('interpretQuery maps Daraja answers', () => {
  assert.deepEqual(interpretQuery({ ok: true, data: { ResultCode: '0' } }), { status: 'paid' });
  assert.equal(interpretQuery({ ok: true, data: { ResultCode: '1032', ResultDesc: 'Request cancelled by user' } }).status, 'failed');
  assert.deepEqual(interpretQuery({ ok: false, data: { errorCode: '500.001.1001' } }), { status: 'pending' });
});
