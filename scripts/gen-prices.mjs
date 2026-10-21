// Generates, from the built-in catalog in src/data/products.ts:
//   api/_prices.json   id -> base price      (M-Pesa server prices orders with it)
//   api/_catalog.json  id -> name/description/image  (api/product-meta.js builds share previews with it)
//   public/sitemap.xml home, shop, categories, info pages and every product
// Runs before every build (npm "prebuild"); tests/pricing.test.mjs fails if the committed copies are stale.
import { readFileSync, writeFileSync } from 'node:fs';

export const SITE = 'https://avytrendy.vercel.app'; // ponytail: change when a custom domain is added

/** One entry per built-in product: { id, price, name, description, image }. */
export function extractCatalog(source) {
  const start = source.indexOf('const staticProducts');
  const end = source.indexOf('const mixedProducts');
  if (start < 0 || end < 0) throw new Error('products.ts layout changed: staticProducts block not found');
  const body = source.slice(start, end);
  const ids = [...body.matchAll(/^ {4}id:\s*(\d+),/gm)];
  const field = (block, re, id, what) => {
    const m = re.exec(block);
    if (!m) throw new Error(`No ${what} found for product ${id}`);
    return m[1];
  };
  return ids.map((m, i) => {
    const block = body.slice(m.index, i + 1 < ids.length ? ids[i + 1].index : body.length);
    return {
      id: Number(m[1]),
      price: Number(field(block, /^ {4}price:\s*(\d+),/m, m[1], 'price')),
      name: field(block, /^ {4}name:\s*'([^']*)',/m, m[1], 'name'),
      description: field(block, /^ {4}description:\s*'([^']*)',/m, m[1], 'description'),
      image: field(block, /^ {4}images:\s*\['([^']*)'/m, m[1], 'image'),
    };
  });
}

export function extractPrices(source) {
  return Object.fromEntries(extractCatalog(source).map((p) => [p.id, p.price]));
}

export function extractMeta(source) {
  return Object.fromEntries(extractCatalog(source).map((p) => [p.id, { name: p.name, description: p.description, image: p.image }]));
}

export function buildSitemap(ids) {
  const pages = ['/', '/shop', ...['watches', 'dresses', 'pants', 'blouses', 'tshirts', 'sweaters'].map((c) => `/shop/${c}`),
    '/about', '/contact', '/faq', '/size-guide', '/track-order', '/privacy', '/terms', '/returns', ...ids.map((id) => `/product/${id}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n')}\n</urlset>\n`;
}

if (process.argv[1]?.endsWith('gen-prices.mjs')) {
  const source = readFileSync('src/data/products.ts', 'utf8');
  const prices = extractPrices(source);
  writeFileSync('api/_prices.json', JSON.stringify(prices, null, 1) + '\n');
  writeFileSync('api/_catalog.json', JSON.stringify(extractMeta(source), null, 1) + '\n');
  writeFileSync('public/sitemap.xml', buildSitemap(Object.keys(prices)));
  console.log(`generated ${Object.keys(prices).length} products`);
}
