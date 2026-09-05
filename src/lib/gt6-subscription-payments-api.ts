/**
 * Sales gt6 订阅支付：列表（/me/gt6/subscription-payments）+ 静态单条 JSON（gt6json）
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getAuthTenantId } from './auth';

export interface Gt6SubscriptionPaymentsListData {
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
  data?: Gt6SubscriptionPaymentsListData;
}

/** GET /api/v1/me/gt6/subscription-payments — Bearer + X-Tenant-ID */
export async function listMyGt6SubscriptionPayments(page: number, pageSize: number): Promise<Gt6SubscriptionPaymentsListData> {
  const token = getSessionToken();
  const tenantId = getAuthTenantId();
  if (!token || !tenantId) {
    throw new Error('User not authenticated');
  }
  const base = APP_CONFIG.salesApiV1Base.replace(/\/$/, '');
  const url = `${base}/me/gt6/subscription-payments?page=${encodeURIComponent(String(page))}&page_size=${encodeURIComponent(String(pageSize))}`;
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

/** 静态单条：tenant_{tenantId}/gt6/subscriptions/payments/gt6-subscription-payment-{id}.json */
export function gt6SubscriptionPaymentStaticUrl(tenantId: string, paymentId: string): string {
  const root = APP_CONFIG.apiBaseUrl.replace(/\/$/, '');
  return `${root}/tenant_${tenantId}/gt6/subscriptions/payments/gt6-subscription-payment-${paymentId}.json`;
}

export async function fetchGt6SubscriptionPaymentStaticJson(tenantId: string, paymentId: string): Promise<Record<string, unknown>> {
  const url = gt6SubscriptionPaymentStaticUrl(tenantId, paymentId);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load subscription payment JSON: ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

