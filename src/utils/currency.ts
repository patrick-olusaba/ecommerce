export function formatKSh(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}

export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_COST = 400;
