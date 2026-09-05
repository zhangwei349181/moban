/**
 * Pricing 页：登录用户当前 article 的活跃订阅订单（续费 / 升级 / 降级禁用）
 */

import { getSessionToken, getAuthTenantId } from './auth';
import {
  listMyGt6SubscriptionOrders,
  fetchGt6SubscriptionOrderStaticJson,
} from './gt6-subscription-orders-api';
import type { SubscriptionPlanCartPayloadJson } from './subscription-cart';

export type PricingCardAction = 'subscribe' | 'renew' | 'upgrade' | 'disabled';

export interface ActiveArticleSubscription {
  orderId: string;
  articleId: string;
  variantId: string;
  paymentPeriod: string;
  basePrice: number;
  status: string;
  createdAt: string;
}

const ACTIVE_STATUSES = new Set(['active', 'past_due']);

const BILLING_RANK: Record<string, number> = {
  monthly: 1,
  month: 1,
  default: 1,
  quarterly: 2,
  quarter: 2,
  yearly: 3,
  year: 3,
  annual: 3,
};

export function billingPeriodRank(code: string): number {
  const c = String(code || '').toLowerCase();
  return BILLING_RANK[c] ?? 1;
}

export function isBillingPeriodAtLeast(code: string, minCode: string): boolean {
  return billingPeriodRank(code) >= billingPeriodRank(minCode);
}

function pickStr(j: Record<string, unknown>, key: string, fallback = ''): string {
  const v = j[key];
  return typeof v === 'string' ? v : fallback;
}

function pickNum(j: Record<string, unknown>, key: string): number {
  const v = j[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function mapOrderJson(j: Record<string, unknown>): ActiveArticleSubscription {
  return {
    orderId: pickStr(j, 'id'),
    articleId: pickStr(j, 'article_id'),
    variantId: pickStr(j, 'variant_id'),
    paymentPeriod: pickStr(j, 'payment_period', pickStr(j, 'billing_code')),
    basePrice: pickNum(j, 'base_price'),
    status: pickStr(j, 'status'),
    createdAt: pickStr(j, 'created_at'),
  };
}

export function resolvePricingCardAction(
  cardVariantId: string,
  cardBasePrice: number,
  sub: ActiveArticleSubscription | null
): PricingCardAction {
  if (!sub) return 'subscribe';
  if (cardVariantId === sub.variantId) return 'renew';
  if (cardBasePrice < sub.basePrice) return 'disabled';
  if (cardBasePrice > sub.basePrice) return 'upgrade';
  return 'subscribe';
}

export function parseCartPayloadFromCard(card: Element): SubscriptionPlanCartPayloadJson | null {
  const raw = card.getAttribute('data-cart-payload');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SubscriptionPlanCartPayloadJson;
  } catch {
    return null;
  }
}

/** 登录态下查找该 article 最近一条 active 订阅订单 */
export async function findActiveSubscriptionForArticle(
  articleId: string
): Promise<ActiveArticleSubscription | null> {
  const token = getSessionToken();
  const tenantId = getAuthTenantId();
  if (!token || !tenantId || !articleId.trim()) return null;

  let page = 1;
  let totalPages = 1;
  let best: ActiveArticleSubscription | null = null;
  const pageSize = 50;

  while (page <= totalPages) {
    const data = await listMyGt6SubscriptionOrders(page, pageSize);
    totalPages = Math.max(1, data.pagination.total_pages);

    const rows = await Promise.all(
      data.items.map(async (item) => {
        try {
          const j = await fetchGt6SubscriptionOrderStaticJson(tenantId, item.id);
          const row = mapOrderJson(j);
          if (row.articleId !== articleId) return null;
          if (!ACTIVE_STATUSES.has(row.status.toLowerCase())) return null;
          return row;
        } catch {
          return null;
        }
      })
    );

    for (const row of rows) {
      if (!row) continue;
      if (!best || Date.parse(row.createdAt) > Date.parse(best.createdAt)) {
        best = row;
      }
    }

    page += 1;
  }

  return best;
}
