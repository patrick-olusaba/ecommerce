import { setDocument, updateDocument, getDocument, getDocuments } from '../firebase/firestore';

const STORAGE_KEY = 'avytrendy_sales';

export interface SaleItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Customer {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  itemCount: number;
  status?: number;
  uid?: string;
  email?: string;
  phone?: string;
  paymentMethod?: string;
  customer?: Customer;
}

export function updateOrderStatus(orderId: string, status: number): void {
  const sales = getAllSales();
  const order = sales.find((s) => s.id === orderId);
  if (order) {
    order.status = status;
    saveAllSales(sales);
  }
  void updateDocument('orders', orderId, { status });
}

export function getOrderStatus(order: Sale): number {
  // Admin-set status takes priority
  if (order.status) return order.status;

  // Otherwise derive from time
  const now = Date.now();
  const orderTime = new Date(order.date).getTime();
  const hoursSince = (now - orderTime) / (1000 * 60 * 60);

  if (hoursSince < 1) return 1;       // Order Placed
  if (hoursSince < 24) return 2;      // Processing
  if (hoursSince < 48) return 3;      // Shipped
  return 4;                            // Delivered
}

function getAllSales(): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fall through to seed
  }
  const seeded = seedDemoSales();
  saveAllSales(seeded);
  return seeded;
}

function saveAllSales(sales: Sale[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

function seedDemoSales(): Sale[] {
  const demoSales: Sale[] = [
    {
      id: 'AVT-100101',
      date: daysAgo(0),
      items: [
        { productId: 22, name: 'High-Waist Straight Jeans', quantity: 1, price: 3200 },
        { productId: 40, name: 'Essential Crew Neck Tee', quantity: 2, price: 800 },
      ],
      total: 4800,
      itemCount: 3,
    },
    {
      id: 'AVT-100102',
      date: daysAgo(0),
      items: [
        { productId: 3, name: 'Sport Diver Pro', quantity: 1, price: 8500 },
      ],
      total: 8500,
      itemCount: 1,
    },
    {
      id: 'AVT-100103',
      date: daysAgo(1),
      items: [
        { productId: 10, name: 'Floral Midi Dress', quantity: 1, price: 3500 },
        { productId: 34, name: 'Ribbed Knit Tank', quantity: 1, price: 1500 },
      ],
      total: 5000,
      itemCount: 2,
    },
    {
      id: 'AVT-100104',
      date: daysAgo(1),
      items: [
        { productId: 1, name: 'Classic Chronograph', quantity: 1, price: 6800 },
      ],
      total: 6800,
      itemCount: 1,
    },
    {
      id: 'AVT-100105',
      date: daysAgo(2),
      items: [
        { productId: 41, name: 'Oversized Graphic Tee', quantity: 2, price: 1200 },
        { productId: 21, name: 'Slim Fit Chinos', quantity: 1, price: 2800 },
      ],
      total: 5200,
      itemCount: 3,
    },
    {
      id: 'AVT-100106',
      date: daysAgo(4),
      items: [
        { productId: 5, name: 'Vintage Leather Watch', quantity: 1, price: 3800 },
        { productId: 42, name: 'V-Neck Relaxed Tee', quantity: 2, price: 800 },
      ],
      total: 5400,
      itemCount: 3,
    },
    {
      id: 'AVT-100107',
      date: daysAgo(5),
      items: [
        { productId: 11, name: 'Elegant Evening Gown', quantity: 1, price: 9500 },
      ],
      total: 9500,
      itemCount: 1,
    },
    {
      id: 'AVT-100108',
      date: daysAgo(8),
      items: [
        { productId: 30, name: 'Silk Button-Up Blouse', quantity: 1, price: 3200 },
        { productId: 25, name: 'Slim Fit Dress Trousers', quantity: 1, price: 3500 },
      ],
      total: 6700,
      itemCount: 2,
    },
    {
      id: 'AVT-100109',
      date: daysAgo(12),
      items: [
        { productId: 7, name: 'Ceramic Skeleton Watch', quantity: 1, price: 12500 },
      ],
      total: 12500,
      itemCount: 1,
    },
    {
      id: 'AVT-100110',
      date: daysAgo(16),
      items: [
        { productId: 20, name: 'Tailored Wide-Leg Pants', quantity: 1, price: 3500 },
        { productId: 43, name: 'Striped Breton Tee', quantity: 1, price: 1200 },
      ],
      total: 4700,
      itemCount: 2,
    },
    {
      id: 'AVT-100111',
      date: daysAgo(20),
      items: [
        { productId: 40, name: 'Essential Crew Neck Tee', quantity: 3, price: 800 },
        { productId: 15, name: 'Linen Wrap Dress', quantity: 1, price: 2800 },
      ],
      total: 5200,
      itemCount: 4,
    },
    {
      id: 'AVT-100112',
      date: daysAgo(25),
      items: [
        { productId: 9, name: 'Chronograph Tachymeter', quantity: 1, price: 7500 },
        { productId: 44, name: 'Ribbed Fitted Tee', quantity: 2, price: 700 },
      ],
      total: 8900,
      itemCount: 3,
    },
  ];

  return demoSales;
}

/**
 * Local write is synchronous so the UI can move on; the Firestore write is what
 * actually reaches the shop owner. Resolves false when Firebase is unconfigured
 * or offline — the order still lives in this browser either way.
 */
export function recordSale(sale: Sale): Promise<boolean> {
  const sales = getAllSales();
  sales.push(sale);
  saveAllSales(sales);
  return setDocument('orders', sale.id, { ...sale, createdAt: sale.date });
}

/** Merge remote orders into the local cache so the sync readers below see them. */
export async function syncOrders(): Promise<void> {
  const remote = await getDocuments<Sale>('orders');
  if (remote.length === 0) return;
  mergeIntoLocal(remote);
}

/** Look up one order by number, falling back to Firestore for orders placed elsewhere. */
export async function findOrder(orderId: string): Promise<Sale | null> {
  const local = getAllSales().find((s) => s.id === orderId);
  const remote = await getDocument<Sale>('orders', orderId);
  if (remote) {
    mergeIntoLocal([remote]);
    return remote;
  }
  return local ?? null;
}

// Remote wins on conflict: an admin on another device may have moved the status on.
function mergeIntoLocal(remote: Sale[]): void {
  const byId = new Map(getAllSales().map((s) => [s.id, s]));
  for (const order of remote) byId.set(order.id, { ...byId.get(order.id), ...order });
  saveAllSales([...byId.values()]);
}

export function getSales(): Sale[] {
  return getAllSales();
}

export function getSalesForPeriod(days: number): Sale[] {
  const now = Date.now();
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  return getAllSales().filter((s) => s.date >= cutoff);
}

export function getTodaySales(): Sale[] {
  const today = new Date().toISOString().split('T')[0];
  return getAllSales().filter((s) => s.date.startsWith(today));
}

export function getWeekSales(): Sale[] {
  return getSalesForPeriod(7);
}

export function getMonthSales(): Sale[] {
  return getSalesForPeriod(30);
}

export function getSalesTotal(sales: Sale[]): number {
  return sales.reduce((sum, s) => sum + s.total, 0);
}

export function getItemsSold(sales: Sale[]): number {
  return sales.reduce((sum, s) => sum + s.itemCount, 0);
}

export function getDailyRevenue(days: number): { day: string; revenue: number }[] {
  const result: { day: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const daySales = getAllSales().filter((s) => s.date.startsWith(key));
    result.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: getSalesTotal(daySales),
    });
  }
  return result;
}

export function getTopProducts(limit = 5): { name: string; count: number; revenue: number }[] {
  const map = new Map<string, { count: number; revenue: number }>();
  for (const sale of getAllSales()) {
    for (const item of sale.items) {
      const existing = map.get(item.name) || { count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.price * item.quantity;
      map.set(item.name, existing);
    }
  }
  return Array.from(map.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function clearSales(): void {
  localStorage.removeItem(STORAGE_KEY);
}
