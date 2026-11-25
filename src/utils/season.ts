import { Order, SeasonSettlement } from '../types';

/**
 * Jeju Mandarin Season Utility
 * Citrus season runs across year-end: November/December through January/February of the following year.
 * (e.g. 2026.11 ~ 2027.02 belongs to the "2026-2027 시즌")
 */

export function getOrderSeasonKey(dateStr: string): string {
  if (!dateStr) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }

  // Parse YYYY-MM
  const parts = dateStr.slice(0, 10).split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (month >= 8) {
    // August to December belong to this year's harvest kick-off
    return `${year}-${year + 1}`;
  } else {
    // January to July belong to previous year's winter season harvest
    return `${year - 1}-${year}`;
  }
}

export function formatSeasonLabel(seasonKey: string): string {
  const parts = seasonKey.split('-');
  if (parts.length === 2) {
    const [startYear, endYear] = parts;
    return `${seasonKey} 감귤 시즌 (${startYear}.10 ~ ${endYear}.02)`;
  }
  return `${seasonKey} 감귤 시즌`;
}

export function getNextSeasonKey(existingKeys: string[]): string {
  let maxStartYear = 2026;
  existingKeys.forEach((key) => {
    const [y1] = key.split('-');
    const parsed = parseInt(y1, 10);
    if (!isNaN(parsed) && parsed > maxStartYear) {
      maxStartYear = parsed;
    }
  });
  const nextStart = maxStartYear + 1;
  return `${nextStart}-${nextStart + 1}`;
}

export function getAllSeasonKeys(
  orders: Order[],
  customSeasons: string[] = [],
  deletedSeasons: string[] = []
): string[] {
  const currentKey = getOrderSeasonKey(new Date().toISOString().slice(0, 10));
  const set = new Set<string>([currentKey, '2026-2027', '2025-2026', ...(customSeasons || [])]);

  orders.forEach((o) => {
    const key = getOrderSeasonKey(o.createdAt || o.dispatchDate);
    if (key) set.add(key);
  });

  const deletedSet = new Set(deletedSeasons || []);
  const result = Array.from(set).filter((k) => {
    if (deletedSet.has(k)) {
      // Only keep if orders actually exist in it
      return orders.some((o) => getOrderSeasonKey(o.createdAt || o.dispatchDate) === k);
    }
    return true;
  });

  return result.sort().reverse();
}

export function calculateSeasonTotals(orders: Order[], seasonKey: string): {
  totalRevenue: number;
  totalShippingCost: number;
  totalBoxCost: number;
  totalNetProfit: number;
  totalOrders: number;
  total10kgBoxes: number;
  total5kgBoxes: number;
  boxCost10kg: number;
  boxCost5kg: number;
} {
  const seasonOrders = orders.filter((o) => {
    if (o.status === 'cancelled') return false;
    return getOrderSeasonKey(o.createdAt || o.dispatchDate) === seasonKey;
  });

  let totalRevenue = 0;
  let totalShippingCost = 0;
  let totalBoxCost = 0;
  let total10kgBoxes = 0;
  let total5kgBoxes = 0;
  let boxCost10kg = 0;
  let boxCost5kg = 0;

  seasonOrders.forEach((o) => {
    totalRevenue += o.totalAmount;
    totalShippingCost += o.shippingCost;
    totalBoxCost += o.boxCost || 0;

    o.items.forEach((item) => {
      if (item.type === '10kg') total10kgBoxes += item.quantity;
      if (item.type === '5kg') total5kgBoxes += item.quantity;
    });
  });

  const totalNetProfit = totalRevenue - totalShippingCost - totalBoxCost;

  return {
    totalRevenue,
    totalShippingCost,
    totalBoxCost,
    totalNetProfit,
    totalOrders: seasonOrders.length,
    total10kgBoxes,
    total5kgBoxes,
    boxCost10kg,
    boxCost5kg,
  };
}
