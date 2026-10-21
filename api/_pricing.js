// Prices an order on the server so the browser cannot choose the amount it pays.
// Price precedence mirrors the storefront: admin override > admin-added product > built-in catalog.
import prices from './_prices.json' with { type: 'json' };

// ponytail: keep in step with src/utils/currency.ts (tests/pricing.test.mjs checks it).
export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_COST = 400;

const MAX_ITEMS = 50;

/** Reads a numeric Firestore REST field (integerValue arrives as a string). */
export function fieldNumber(doc, name) {
  const f = doc?.fields?.[name];
  const n = Number(f?.integerValue ?? f?.doubleValue);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function firestorePrice(projectId, collection, id, fetchFn) {
  if (!projectId) return null;
  const res = await fetchFn(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}`);
  return res.ok ? fieldNumber(await res.json(), 'price') : null;
}

/**
 * items: [{ productId, quantity }]. Returns { amount } (KSh, shipping included) or throws Error.
 * ponytail: stock is not checked here (the checkout page does), and a failed Firestore read falls
 * back to the built-in price, so a price the admin just lowered can briefly charge the old one.
 */
export async function priceOrder(items, { projectId = process.env.VITE_FIREBASE_PROJECT_ID, fetchFn = fetch } = {}) {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) throw new Error('Invalid items');

  const lines = await Promise.all(items.map(async (item) => {
    const id = item?.productId;
    const qty = item?.quantity;
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error('Invalid item');
    const builtIn = prices[id];
    const price = (await firestorePrice(projectId, 'product_overrides', id, fetchFn))
      ?? (builtIn ?? await firestorePrice(projectId, 'products', id, fetchFn));
    if (price == null) throw new Error('Unknown product');
    return price * qty;
  }));

  const subtotal = lines.reduce((a, b) => a + b, 0);
  return { amount: Math.ceil(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)) };
}
