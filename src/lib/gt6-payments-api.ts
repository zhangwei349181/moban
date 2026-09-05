/**
 * Sales gt6 支付：列表（/me/gt6/payments）+ 静态单条 JSON（gt6json）
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getAuthTenantId } from './auth';

/** pkg/response 成功体 */
export interface Gt6PaymentsListData {
  items: Gt6PaymentIndexItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface Gt6PaymentIndexItem {
  id: string;
  membership_id?: string | null;
  created_at: string;
}

interface WrappedListResponse {
  code: number;
  message: string;
  data?: Gt6PaymentsListData;
}

/** GET /api/v1/me/gt6/payments — Bearer + X-Tenant-ID */
export async function listMyGt6Payments(page: number, pageSize: number): Promise<Gt6PaymentsListData> {
  const token = getSessionToken();
  const tenantId = getAuthTenantId();
  if (!token || !tenantId) {
    throw new Error('User not authenticated');
  }
  const base = APP_CONFIG.salesApiV1Base.replace(/\/$/, '');
  const url = `${base}/me/gt6/payments?page=${encodeURIComponent(String(page))}&page_size=${encodeURIComponent(String(pageSize))}`;
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

/** 静态单条：tenant_{tenantId}/gt6/payments/gt6-payment-{id}.json */
export function gt6PaymentStaticUrl(tenantId: string, paymentId: string): string {
  const root = APP_CONFIG.apiBaseUrl.replace(/\/$/, '');
  return `${root}/tenant_${tenantId}/gt6/payments/gt6-payment-${paymentId}.json`;
}

/** 拉取单条 gt6 支付完整 JSON（公开 GET） */
export async function fetchGt6PaymentStaticJson(tenantId: string, paymentId: string): Promise<Record<string, unknown>> {
  const url = gt6PaymentStaticUrl(tenantId, paymentId);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load payment JSON: ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}
