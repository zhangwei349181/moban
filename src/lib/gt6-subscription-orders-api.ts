/**
 * Sales gt6 订阅订单：列表（/me/gt6/subscription-orders）+ 静态单条 JSON（gt6json）
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getAuthTenantId } from './auth';

export interface Gt6SubscriptionOrdersListData {
  items: Gt6SubscriptionIndexItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface Gt6SubscriptionIndexItem {
  id: string;
  membership_id?: string | null;
  created_at: string;
}

interface WrappedListResponse {
  code: number;
  message: string;
  data?: Gt6SubscriptionOrdersListData;
}

/** GET /api/v1/me/gt6/subscription-orders — Bearer + X-Tenant-ID */
export async function listMyGt6SubscriptionOrders(page: number, pageSize: number): Promise<Gt6SubscriptionOrdersListData> {
  const token = getSessionToken();
  const tenantId = getAuthTenantId();
  if (!token || !tenantId) {
    throw new Error('User not authenticated');
  }
  const base = APP_CONFIG.salesApiV1Base.replace(/\/$/, '');
  const url = `${base}/me/gt6/subscription-orders?page=${encodeURIComponent(String(page))}&page_size=${encodeURIComponent(String(pageSize))}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
    },
  });
  const body = (await res.json()) as WrappedListResponse;
  if (!res.ok) {
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  if (body.code !== 0) {
    throw new Error(body.message || 'API error');
  }
  if (!body.data) {
    throw new Error('Empty response data');
  }
  return body.data;
}

/** 静态单条：tenant_{tenantId}/gt6/subscriptions/orders/gt6-subscription-order-{id}.json */
export function gt6SubscriptionOrderStaticUrl(tenantId: string, orderId: string): string {
  const root = APP_CONFIG.apiBaseUrl.replace(/\/$/, '');
  return `${root}/tenant_${tenantId}/gt6/subscriptions/orders/gt6-subscription-order-${orderId}.json`;
}

export async function fetchGt6SubscriptionOrderStaticJson(tenantId: string, orderId: string): Promise<Record<string, unknown>> {
  const url = gt6SubscriptionOrderStaticUrl(tenantId, orderId);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load subscription order JSON: ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

