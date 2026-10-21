import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { priceOrder, fieldNumber, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../api/_pricing.js';
import { extractPrices } from '../scripts/gen-prices.mjs';

const noFirestore = { projectId: '', fetchFn: () => { throw new Error('should not fetch'); } };
const doc = (price) => ({ ok: true, json: async () => ({ fields: { price: { integerValue: String(price) } } }) });
const missing = { ok: false };

test('api/_prices.json matches src/data/products.ts', () => {
  const fresh = extractPrices(readFileSync('src/data/products.ts', 'utf8'));
  const committed = JSON.parse(readFileSync('api/_prices.json', 'utf8'));
  assert.deepEqual(committed, fresh, 'run: node scripts/gen-prices.mjs');
});

test('shipping constants match src/utils/currency.ts', () => {
  const src = readFileSync('src/utils/currency.ts', 'utf8');
  assert.equal(Number(/FREE_SHIPPING_THRESHOLD = (\d+)/.exec(src)[1]), FREE_SHIPPING_THRESHOLD);
  assert.equal(Number(/SHIPPING_COST = (\d+)/.exec(src)[1]), SHIPPING_COST);
});

test('prices from the built-in catalog, shipping added below the threshold', async () => {
  // product 50 costs 2500
  assert.equal((await priceOrder([{ productId: 50, quantity: 1 }], noFirestore)).amount, 2500 + SHIPPING_COST);
  assert.equal((await priceOrder([{ productId: 50, quantity: 2 }], noFirestore)).amount, 5000); // free shipping
});

test('an admin override beats the built-in price; admin products are priced from Firestore', async () => {
  const fetchFn = async (url) => (url.includes('/product_overrides/50') ? doc(3000) : url.includes('/products/99999') ? doc(7000) : missing);
  const opts = { projectId: 'p', fetchFn };
  assert.equal((await priceOrder([{ productId: 50, quantity: 1 }], opts)).amount, 3000 + SHIPPING_COST);
  assert.equal((await priceOrder([{ productId: 99999, quantity: 1 }], opts)).amount, 7000);
});

test('rejects bad input and unknown products', async () => {
  for (const items of [[], null, [{ productId: 50, quantity: 0 }], [{ productId: 50, quantity: 1.5 }], [{ productId: '50', quantity: 1 }]])
    await assert.rejects(priceOrder(items, noFirestore));
  await assert.rejects(priceOrder([{ productId: 123456, quantity: 1 }], noFirestore), /Unknown product/);
});

test('fieldNumber reads integer and double values', () => {
  assert.equal(fieldNumber({ fields: { price: { integerValue: '12' } } }, 'price'), 12);
  assert.equal(fieldNumber({ fields: { price: { doubleValue: 12.5 } } }, 'price'), 12.5);
  assert.equal(fieldNumber({}, 'price'), null);
});
