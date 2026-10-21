// Writes api/_prices.json (id -> base price) from the built-in catalog in src/data/products.ts,
// so the M-Pesa function can price an order without trusting the browser.
// Runs before every build (npm "prebuild"); tests/pricing.test.mjs fails if the committed copy is stale.
import { readFileSync, writeFileSync } from 'node:fs';

export function extractPrices(source) {
  const start = source.indexOf('const staticProducts');
  const end = source.indexOf('const mixedProducts');
  if (start < 0 || end < 0) throw new Error('products.ts layout changed: staticProducts block not found');
  const body = source.slice(start, end);
  const ids = [...body.matchAll(/^ {4}id:\s*(\d+),/gm)];
  const prices = {};
  ids.forEach((m, i) => {
    const block = body.slice(m.index, i + 1 < ids.length ? ids[i + 1].index : body.length);
    const price = /^ {4}price:\s*(\d+),/m.exec(block);
    if (!price) throw new Error(`No price found for product ${m[1]}`);
    prices[m[1]] = Number(price[1]);
  });
  return prices;
}

if (process.argv[1]?.endsWith('gen-prices.mjs')) {
  const prices = extractPrices(readFileSync('src/data/products.ts', 'utf8'));
  writeFileSync('api/_prices.json', JSON.stringify(prices, null, 1) + '\n');
  console.log(`api/_prices.json: ${Object.keys(prices).length} products`);
}
