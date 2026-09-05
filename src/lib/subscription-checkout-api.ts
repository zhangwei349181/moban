/**
 * 订阅结账：创建 Stripe Checkout Session（mode=subscription）
 * 鉴权与 {@link ./checkout-api.ts} 相同：Bearer connect token + X-Tenant-ID
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getAuthTenantId } from './auth';
import type { SubscriptionCartStoredRecord } from './subscription-cart';

/**
 * 暂定路径：POST {salesApiV1Base}/subscription/checkout/sessions
 */
export const SUBSCRIPTION_CHECKOUT_CREATE_SESSION_PATH = '/subscription/checkout/sessions';

export interface CreateSubscriptionCheckoutSessionPayload {
  payment_method_id: string;
  billing_address_id?: string;
  success_url: string;
  cancel_url: string;
  /** 固定为 subscription */
  session_mode: 'subscription';
  checkout_currency_code?: string;
  exchange_rate?: number;
  /** 与本地 SubscriptionCartStoredRecord 一致的单条订阅行 */
  subscription_line: SubscriptionCartStoredRecord;
}

export interface CreateSubscriptionCheckoutSessionData {
  checkout_url?: string;
  url?: string;
  stripe_checkout_url?: string;
  id?: string;
}

interface WrappedResponse {
  code?: number;
  message?: string;
  data?: CreateSubscriptionCheckoutSessionData;
}

function baseUrl(): string {
  return APP_CONFIG.salesApiV1Base || APP_CONFIG.apiBaseUrl01;
}

function authHeaders(): { Authorization: string; 'X-Tenant-ID': string } {
  const token = getSessionToken();
  const tenantId = getAuthTenantId();
  if (!token) {
    throw new Error('请先登录');
  }
  if (!tenantId) {
    throw new Error('缺少租户上下文，请重新登录');
  }
  return {
    Authorization: `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
  };
}

export function pickSubscriptionCheckoutRedirectUrl(
  data: CreateSubscriptionCheckoutSessionData | undefined
): string | null {
  if (!data) return null;
  const u = data.checkout_url ?? data.url ?? data.stripe_checkout_url;
  return typeof u === 'string' && u.length > 0 ? u : null;
}

export async function postCreateSubscriptionCheckoutSession(
  payload: CreateSubscriptionCheckoutSessionPayload
): Promise<CreateSubscriptionCheckoutSessionData> {
  const url = `${baseUrl().replace(/\/$/, '')}${SUBSCRIPTION_CHECKOUT_CREATE_SESSION_PATH}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  let json: WrappedResponse | Record<string, unknown> = {};
  try {
    json = (await res.json()) as WrappedResponse;
  } catch {
    throw new Error('服务器响应无效');
  }

  const wrapped = json as WrappedResponse;
  const msg =
    typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : '';

  if (!res.ok) {
    throw new Error(msg || `请求失败 (${res.status})`);
  }
  if (wrapped.code !== undefined && wrapped.code !== 0) {
    throw new Error(wrapped.message || msg || '创建订阅结账会话失败');
  }
  if (!wrapped.data) {
    throw new Error('响应格式错误：缺少 data');
  }
  return wrapped.data;
}
