// Serves the normal index.html for /product/:id, with that product's title, description and
// picture in the share tags. WhatsApp/TikTok previews don't run JavaScript, so without this
// every product link shows the generic site card. Any failure falls back to the plain page.
import catalog from './_catalog.json' with { type: 'json' };

const SITE = 'https://avytrendy.vercel.app'; // ponytail: keep in step with scripts/gen-prices.mjs

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = (url) => (url.startsWith('http') ? url : `${SITE}${url}`);

/** Swaps the product's tags into the page HTML. Pure, so it is unit-tested. */
export function withProductMeta(html, id, p) {
  const title = `${p.name} | Avytrendy`;
  const desc = p.description.length > 200 ? `${p.description.slice(0, 197)}...` : p.description;
  const set = (h, re, tag) => (re.test(h) ? h.replace(re, tag) : h);
  let out = html;
  out = set(out, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  out = set(out, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`);
  out = set(out, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  out = set(out, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`);
  out = set(out, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(abs(p.image))}" />`);
  out = set(out, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="product" /><meta property="og:url" content="${SITE}/product/${id}" />`);
  out = set(out, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  out = set(out, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(desc)}" />`);
  out = set(out, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(abs(p.image))}" />`);
  return out;
}

export default async function handler(req, res) {
  const id = String(req.query?.id ?? '');
  try {
    const page = await fetch(`https://${req.headers.host}/index.html`);
    if (!page.ok) throw new Error(`index.html ${page.status}`);
    const html = await page.text();
    // ponytail: admin-added products aren't in the built-in catalog and get the generic card.
    const product = /^\d+$/.test(id) ? catalog[id] : undefined;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(product ? withProductMeta(html, id, product) : html);
  } catch (err) {
    console.error('product-meta failed', err);
    return res.redirect(302, '/');
  }
}
