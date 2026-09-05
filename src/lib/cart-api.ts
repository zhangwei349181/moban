/**
 * 购物车服务端 API（Sales：/api/v1/cart）
 * 需 Authorization: Bearer connect 会话 token + X-Tenant-ID（与 auth 中当前租户一致）
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getAuthTenantId } from './auth';
import { replaceCartItemsFromServer, type CartItem } from './cart';

export interface AddCartItemPayload {
  article_id: string;
  variant_id?: string;
  selected_attributes?: Record<string, string>;
  quantity: number;
  unit_price: number;
  original_unit_price: number;
  discount_amount: number;
  shipping_fee: number;
  tax_fee: number;
  shipping_address_id?: string;
  shipping_template_id?: string;
  tax_template_id?: string;
  article_type: string;
  product_name: string;
  product_sku?: string;
  product_image_url: string;
  discount_rule_ids?: string[];
  currency_code: string;
  group_buying_id?: string;
  crowdfunding_activity_id?: string;
  crowdfunding_reward_id?: string;
  product_title?: string;
  product_image?: string;
  variant_name?: string;
}

/** 服务端返回的 cart_item（与 Go model.CartItem JSON 一致） */
export interface CartItemApi {
  id: string;
  cart_id: string;
  article_id: string;
  variant_id?: string | null;
  selected_attributes?: Record<string, unknown>;
  quantity: number;
  unit_price: number;
  original_unit_price: number;
  discount_amount: number;
  shipping_fee: number;
  tax_fee: number;
  shipping_address_id?: string | null;
  shipping_template_id?: string | null;
  tax_template_id?: string | null;
  article_type: string;
  product_name: string;
  product_sku?: string | null;
  product_image_url: string;
  discount_rule_ids?: string[] | null;
  currency_code: string;
  group_buying_id?: string | null;
  crowdfunding_activity_id?: string | null;
  crowdfunding_reward_id?: string | null;
  product_title?: string | null;
  product_image?: string | null;
  variant_name?: string | null;
  added_at: string;
  updated_at: string;
}

export interface AddCartItemResponseData {
  cart: unknown;
  cart_item: CartItemApi;
}

interface SalesWrappedResponse {
  code: number;
  message: string;
  data?: AddCartItemResponseData;
}

/** 购物车头（GET /cart） */
export interface CartApi {
  id: string;
  tenant_id: string;
  membership_id?: string | null;
  guest_session_id?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GetMyCartData {
  cart: CartApi | null;
  items: CartItemApi[];
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
 * 将服务端返回行映射为本地 CartItem（用于头部 minicart 等仍读 localStorage 的场景）
 */
export function mapApiCartItemToClient(s: CartItemApi): CartItem {
  const attrs = s.selected_attributes;
  const selected =
    attrs && typeof attrs === 'object'
      ? (Object.fromEntries(
          Object.entries(attrs).map(([k, v]) => [k, String(v)])
        ) as Record<string, string>)
      : undefined;

  return {
    id: s.id,
    article_id: s.article_id,
    variant_id: s.variant_id ?? undefined,
    selected_attributes: selected,
    quantity: s.quantity,
    unit_price: s.unit_price,
    original_unit_price: s.original_unit_price,
    discount_amount: s.discount_amount,
    shipping_fee: s.shipping_fee,
    tax_fee: s.tax_fee,
    shipping_address_id: s.shipping_address_id ?? undefined,
    shipping_template_id: s.shipping_template_id ?? undefined,
    tax_template_id: s.tax_template_id ?? undefined,
    added_at: s.added_at,
    article_type: s.article_type,
    product_name: s.product_name,
    product_sku: s.product_sku ?? undefined,
    product_image_url: s.product_image_url,
    discount_rule_ids: s.discount_rule_ids ?? undefined,
    currency_code: s.currency_code,
    group_buying_id: s.group_buying_id ?? undefined,
    crowdfunding_activity_id: s.crowdfunding_activity_id ?? undefined,
    crowdfunding_reward_id: s.crowdfunding_reward_id ?? undefined,
    product_title: s.product_title ?? undefined,
    product_image: s.product_image ?? undefined,
    variant_name: s.variant_name ?? undefined,
  };
}

/**
 * 添加购物车行到服务端（服务端会重算单价、运费、税、库存等）
 */
export async function postAddCartItem(payload: AddCartItemPayload): Promise<AddCartItemResponseData> {
  const url = `${baseUrl().replace(/\/$/, '')}/cart/items`;
  let headers: ReturnType<typeof authHeaders>;
  try {
    headers = authHeaders();
  } catch {
    throw new Error('请先登录后再加入购物车');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  let json: SalesWrappedResponse | Record<string, unknown> = {};
  try {
    json = (await res.json()) as SalesWrappedResponse;
  } catch {
    throw new Error('服务器响应无效');
  }

  const wrapped = json as SalesWrappedResponse;
  const anyMsg = (json as { message?: string }).message;

  if (!res.ok) {
    throw new Error(typeof anyMsg === 'string' ? anyMsg : `请求失败 (${res.status})`);
  }

  if (wrapped.code !== undefined && wrapped.code !== 0) {
    throw new Error(wrapped.message || '添加购物车失败');
  }

  if (!wrapped.data?.cart_item) {
    throw new Error('响应格式错误：缺少 cart_item');
  }

  return wrapped.data;
}

/**
 * 查询当前用户在当前租户下的活跃购物车及行（GET /api/v1/cart）
 */
export async function getMyCart(): Promise<GetMyCartData> {
  const url = `${baseUrl().replace(/\/$/, '')}/cart`;
  // 勿加 Cache-Control/Pragma 请求头（会触发 CORS 且多数网关未放行）
  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: authHeaders(),
  });

  let json: { code?: number; message?: string; data?: GetMyCartData } = {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error('服务器响应无效');
  }

  if (!res.ok) {
    throw new Error(typeof json.message === 'string' ? json.message : `请求失败 (${res.status})`);
  }
  if (json.code !== undefined && json.code !== 0) {
    throw new Error(json.message || '获取购物车失败');
  }
  if (json.data === undefined || json.data === null) {
    throw new Error('响应格式错误');
  }
  const items = json.data.items ?? [];
  const list = Array.isArray(items) ? items : [];
  return {
    cart: json.data.cart ?? null,
    items: list,
  };
}

/**
 * 删除购物车行（DELETE /api/v1/cart/items/:itemId）
 */
export async function deleteCartItem(itemId: string): Promise<void> {
  const url = `${baseUrl().replace(/\/$/, '')}/cart/items/${encodeURIComponent(itemId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  let json: { code?: number; message?: string } = {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error('服务器响应无效');
  }

  if (!res.ok) {
    throw new Error(typeof json.message === 'string' ? json.message : `请求失败 (${res.status})`);
  }
  if (json.code !== undefined && json.code !== 0) {
    throw new Error(json.message || '删除失败');
  }
}

/** 并发去重：头部 minicart 与购物车页等同时 init 时只请求一次 GET /cart */
let syncLocalCartInFlight: Promise<CartItem[]> | null = null;

/**
 * 拉取当前租户下服务端购物车并覆盖本地缓存（与 GET /cart 一致；需已登录）
 */
export async function syncLocalCartFromServer(): Promise<CartItem[]> {
  if (syncLocalCartInFlight) {
    return syncLocalCartInFlight;
  }

  const run = async (): Promise<CartItem[]> => {
    const data = await getMyCart();
    const items = data.items.map(mapApiCartItemToClient);
    replaceCartItemsFromServer(items);
    return items;
  };

  syncLocalCartInFlight = run().finally(() => {
    syncLocalCartInFlight = null;
  });
  return syncLocalCartInFlight;
}
