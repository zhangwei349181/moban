/**
 * Sales gt6 订单行：列表（/me/gt6/orders）+ 静态单条 JSON（gt6json）
 * 每条索引/静态 JSON 对应 gt6_orders 表一行（一笔付款中的一条商品行）。
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getAuthTenantId } from './auth';

export interface Gt6OrdersListData {
  items: Gt6OrderIndexItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface Gt6OrderIndexItem {
  id: string;
  membership_id?: string | null;
  article_type?: string;
  created_at: string;
}

interface WrappedListResponse {
  code: number;
  message: string;
  data?: Gt6OrdersListData;
}

/** GET /api/v1/me/gt6/orders — Bearer + X-Tenant-ID；article_type 可选 */
export async function listMyGt6Orders(
  page: number,
  pageSize: number,
  articleType?: string,
): Promise<Gt6OrdersListData> {
  const token = getSessionToken();
  const tenantId = getAuthTenantId();
  if (!token || !tenantId) {
    throw new Error('User not authenticated');
  }
  const base = APP_CONFIG.salesApiV1Base.replace(/\/$/, '');
  const q = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const at = (articleType ?? '').trim();
  if (at) {
    q.set('article_type', at);
  }
  const url = `${base}/me/gt6/orders?${q.toString()}`;
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

/** 静态单条：tenant_{tenantId}/gt6/orders/gt6-order-{id}.json */
export function gt6OrderStaticUrl(tenantId: string, orderId: string): string {
  const root = APP_CONFIG.apiBaseUrl.replace(/\/$/, '');
  return `${root}/tenant_${tenantId}/gt6/orders/gt6-order-${orderId}.json`;
}

export async function fetchGt6OrderStaticJson(tenantId: string, orderId: string): Promise<Record<string, unknown>> {
  const url = gt6OrderStaticUrl(tenantId, orderId);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load order JSON: ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}
