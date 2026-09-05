/**
 * 结账：创建 Checkout Session（Sales API，服务端对接 Stripe 等）
 * 与 cart-api 相同鉴权：Bearer connect token + X-Tenant-ID
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getAuthTenantId } from './auth';

/**
 * 暂定路径：POST {salesApiV1Base}/checkout/sessions
 * 实现后端就绪后保持路径一致即可。
 */
export const CHECKOUT_CREATE_SESSION_PATH = '/checkout/sessions';

export interface CreateCheckoutSessionPayload {
  payment_method_id: string;
  /** 账单地址；无账单地址时可不传 */
  billing_address_id?: string;
  success_url: string;
  cancel_url: string;
  /** 与 Stripe mode 对齐，默认由服务端处理为 payment */
  session_mode?: 'payment' | 'setup' | 'subscription';
  /**
   * 结账扣款币种（与页面所选货币一致，ISO 4217）。
   * 不传则与购物车行的基准币种相同。
   */
  checkout_currency_code?: string;
  /**
   * 自购物车基准币种到 checkout_currency_code 的乘数，与 Layout 注入的 __ASTRO_EXCHANGE_RATE__ 一致。
   * 当结账币种与基准币种相同时可传 1 或省略。
   */
  exchange_rate?: number;
}

export interface CreateCheckoutSessionData {
  /** Stripe Checkout 托管页 URL（字段名以服务端实现为准，见下方解析） */
  checkout_url?: string;
  url?: string;
  stripe_checkout_url?: string;
  id?: string;
}

interface WrappedResponse {
  code?: number;
  message?: string;
  data?: CreateCheckoutSessionData;
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

/**
 * 从响应 data 中取出可跳转的 Stripe Checkout URL
 */
export function pickCheckoutRedirectUrl(data: CreateCheckoutSessionData | undefined): string | null {
  if (!data) return null;
  const u = data.checkout_url ?? data.url ?? data.stripe_checkout_url;
  return typeof u === 'string' && u.length > 0 ? u : null;
}

/**
 * POST 创建 Checkout Session，成功后返回 data（含跳转 URL）
 */
export async function postCreateCheckoutSession(
  payload: CreateCheckoutSessionPayload
): Promise<CreateCheckoutSessionData> {
  const url = `${baseUrl().replace(/\/$/, '')}${CHECKOUT_CREATE_SESSION_PATH}`;
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
  const msg = typeof (json as { message?: string }).message === 'string' ? (json as { message: string }).message : '';

  if (!res.ok) {
    throw new Error(msg || `请求失败 (${res.status})`);
  }
  if (wrapped.code !== undefined && wrapped.code !== 0) {
    throw new Error(wrapped.message || msg || '创建结账会话失败');
  }
  if (!wrapped.data) {
    throw new Error('响应格式错误：缺少 data');
  }
  return wrapped.data;
}
