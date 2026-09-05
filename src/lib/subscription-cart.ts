/**
 * 本地「订阅购物车」：与商品购物车 cart_items 分离，键独立。
 */

export const SUBSCRIPTION_CART_STORAGE_KEY = 'subscription_cart_items';

export interface SubscriptionCartBillingOption {
  code: string;
  multiplier: number;
  amount_display: number;
}

/** 服务端注入卡片 data-cart-payload 的结构 */
export interface SubscriptionPlanCartPayloadJson {
  tenant_id: string;
  article_id: string;
  product_name: string;
  attribute_id: string;
  attribute_value_id: string;
  attribute_value_name: string;
  variant_id: string;
  sku: string;
  variant_name: string;
  /** 变体定价币种下的基础价（接口原始值） */
  base_price: number;
  variant_currency: string;
  /** 当前展示/结算货币代码 */
  display_currency_code: string;
  /** 中间件提供的汇率：展示金额 = 基准金额 × exchange_rate（与 convertCurrency 一致） */
  exchange_rate: number;
  default_billing_code: string;
  billing_options: SubscriptionCartBillingOption[];
}

/** 写入 localStorage 的一条记录 */
export interface SubscriptionCartStoredRecord extends SubscriptionPlanCartPayloadJson {
  line_id: string;
  membership_id: string | null;
  /** 与 display_currency_code 一致，便于按字段名「当前货币」读取 */
  currency_code: string;
  payment_period: string;
  price_multiplier: number;
  paid_price: number;
  created_at: string;
  expires_at: string;
}

function generateLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 按付款周期推算到期时间（当前周期结束日，ISO 字符串）
 */
export function computeSubscriptionExpiryIso(start: Date, billingCode: string): string {
  const d = new Date(start.getTime());
  const c = String(billingCode).toLowerCase();
  if (c === 'monthly' || c === 'month') {
    d.setMonth(d.getMonth() + 1);
  } else if (c === 'yearly' || c === 'year' || c === 'annual') {
    d.setFullYear(d.getFullYear() + 1);
  } else if (c === 'quarterly') {
    d.setMonth(d.getMonth() + 3);
  } else if (c === 'default') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

export function getSubscriptionCartItems(): SubscriptionCartStoredRecord[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SubscriptionCartStoredRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSubscriptionCartItems(items: SubscriptionCartStoredRecord[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(SUBSCRIPTION_CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save subscription cart', e);
  }
}

export function addSubscriptionCartRecord(
  payload: SubscriptionPlanCartPayloadJson,
  opts: {
    membership_id: string | null;
    payment_period: string;
    price_multiplier: number;
    paid_price: number;
    created_at: string;
    expires_at: string;
  }
): SubscriptionCartStoredRecord {
  const line_id = generateLineId();
  const record: SubscriptionCartStoredRecord = {
    ...payload,
    line_id,
    membership_id: opts.membership_id,
    currency_code: payload.display_currency_code,
    payment_period: opts.payment_period,
    price_multiplier: opts.price_multiplier,
    paid_price: opts.paid_price,
    created_at: opts.created_at,
    expires_at: opts.expires_at,
  };
  const items = getSubscriptionCartItems();
  items.push(record);
  saveSubscriptionCartItems(items);
  try {
    window.dispatchEvent(new CustomEvent('subscription_cart_changed', { detail: { record } }));
  } catch {
    /* ignore */
  }
  return record;
}

/** 清空本地订阅购物车（结账提交成功跳转前调用） */
export function clearSubscriptionCart(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(SUBSCRIPTION_CART_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('subscription_cart_changed', { detail: { cleared: true } }));
  } catch (e) {
    console.error('Failed to clear subscription cart', e);
  }
}

/**
 * 取最近一次加入的订阅行（订阅页点击「订阅」后会跳转结账，对应该条）
 */
export function getLatestSubscriptionCartRecord(): SubscriptionCartStoredRecord | null {
  const items = getSubscriptionCartItems();
  if (items.length === 0) return null;
  return items[items.length - 1] ?? null;
}
