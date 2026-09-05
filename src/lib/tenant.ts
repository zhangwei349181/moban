/**
 * 租户静态 JSON：`{apiBase}/tenant_{tenantId}/tenants/tenant-{tenantId}.json`
 * business_config.global_discount_settings 见 `租户/全局折扣设置-前端说明.md`
 */

import { APP_CONFIG } from '../config/app';

export interface TenantJsonData {
  id: string;
  code?: string;
  name?: string;
  display_name?: string;
  business_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CategoryMultiplierRow {
  category_id: string;
  multiplier: number;
}

export interface LevelMultiplierRow {
  level: string;
  multiplier: number;
  category_multipliers: CategoryMultiplierRow[];
}

/** 与文档一致，供 SSR / 客户端共用 */
export interface GlobalDiscountSettingsNormalized {
  enabled: boolean;
  show_price_for_unregistered: boolean;
  level_multipliers: LevelMultiplierRow[];
  fallback_multiplier: number;
}

/**
 * 解析乘数：允许 0（该档位不展示价格）；负数 / NaN 回退为 fallback。
 */
function sanitizeMultiplier(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function sanitizeId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

/** 商品分类 ID 列表规范化（trim、去空） */
export function normalizeProductCategoryIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((id) => sanitizeId(id)).filter((id) => id.length > 0);
}

function parseCategoryMultipliers(
  item: Record<string, unknown>,
  fallback: number
): CategoryMultiplierRow[] {
  const arr = Array.isArray(item.category_multipliers) ? item.category_multipliers : [];
  return arr
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && !Array.isArray(x))
    .map((cm) => ({
      category_id: sanitizeId(cm.category_id),
      multiplier: sanitizeMultiplier(cm.multiplier, fallback),
    }))
    .filter((row) => row.category_id.length > 0);
}

/**
 * 已登录且命中档位时：先用该档默认乘数；若商品分类命中 category_multipliers，取其中最小乘数。
 * 未登录 / 未命中档位：fallback_multiplier（分类覆盖不生效）。
 */
export function resolveGlobalDiscountMultiplier(
  cfg: GlobalDiscountSettingsNormalized,
  isLoggedIn: boolean,
  membershipLevel: string | null,
  categoryIds?: string[] | null
): number {
  if (!isLoggedIn) return cfg.fallback_multiplier;
  const lvl = membershipLevel?.trim() ?? '';
  if (!lvl) return cfg.fallback_multiplier;
  const row = cfg.level_multipliers.find((r) => r.level === lvl);
  if (!row) return cfg.fallback_multiplier;

  let mult = row.multiplier;
  const productCats = new Set(normalizeProductCategoryIds(categoryIds));
  if (productCats.size === 0) return mult;
  const matched = (row.category_multipliers ?? [])
    .filter((cm) => productCats.has(cm.category_id))
    .map((cm) => cm.multiplier);
  if (matched.length === 0) return mult;
  return Math.min(...matched);
}

export function normalizeGlobalDiscountSettings(
  businessConfig: Record<string, unknown> | undefined | null
): GlobalDiscountSettingsNormalized {
  const defaults: GlobalDiscountSettingsNormalized = {
    enabled: false,
    show_price_for_unregistered: true,
    level_multipliers: [],
    fallback_multiplier: 1,
  };
  const raw = businessConfig?.global_discount_settings;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults;
  }
  const o = raw as Record<string, unknown>;
  const enabled = o.enabled === true;
  const show_price_for_unregistered = o.show_price_for_unregistered === false ? false : true;
  const fallback_multiplier = sanitizeMultiplier(o.fallback_multiplier, 1);
  const arr = Array.isArray(o.level_multipliers) ? o.level_multipliers : [];
  const level_multipliers = arr
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && !Array.isArray(x))
    .map((item) => {
      const levelRaw = item.level ?? item.user_level_id;
      const level =
        typeof levelRaw === 'string' ? levelRaw.trim() : String(levelRaw ?? '').trim();
      const levelMultiplier = sanitizeMultiplier(item.multiplier, 1);
      return {
        level,
        multiplier: levelMultiplier,
        category_multipliers: parseCategoryMultipliers(item, levelMultiplier),
      };
    })
    .filter((row) => row.level.length > 0);

  return {
    enabled,
    show_price_for_unregistered,
    level_multipliers,
    fallback_multiplier,
  };
}

export function tenantStaticJsonUrl(tenantId: string): string {
  return `${APP_CONFIG.apiBaseUrl}/tenant_${tenantId}/tenants/tenant-${tenantId}.json`;
}

/**
 * 拉取租户静态 JSON（data 为租户对象）
 */
export async function fetchTenantStaticJson(tenantId: string): Promise<TenantJsonData | null> {
  if (!tenantId) return null;
  const url = tenantStaticJsonUrl(tenantId);
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: TenantJsonData };
    if (!json?.success || !json?.data?.id) return null;
    return json.data;
  } catch {
    return null;
  }
}

/** 租户是否要求登录/注册后做邮箱 OTP 验证 */
export function tenantEmailVerifyEnabled(
  tenant: TenantJsonData | null | undefined | unknown
): boolean {
  if (!tenant || typeof tenant !== 'object') return false;
  const meta = (tenant as TenantJsonData).metadata;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return false;
  return (meta as Record<string, unknown>).email_verify === true;
}

let clientEmailVerifyCache: { tenantId: string; value: boolean } | null = null;

/** 客户端读取租户 JSON 的 metadata.email_verify；失败视为不要求验证 */
export async function isTenantEmailVerifyRequired(
  tenantId?: string
): Promise<boolean> {
  const tid =
    String(tenantId || '').trim() ||
    (typeof window !== 'undefined'
      ? String((window as any).__ASTRO_TENANT_ID__ || '')
      : '') ||
    APP_CONFIG.tenantId;
  if (typeof window !== 'undefined') {
    const injected = (window as Window & { __ASTRO_EMAIL_VERIFY__?: boolean }).__ASTRO_EMAIL_VERIFY__;
    if (typeof injected === 'boolean') {
      clientEmailVerifyCache = { tenantId: tid, value: injected };
      return injected;
    }
    if (clientEmailVerifyCache?.tenantId === tid) {
      return clientEmailVerifyCache.value;
    }
  }
  const tenant = await fetchTenantStaticJson(tid);
  const value = tenantEmailVerifyEnabled(tenant);
  if (typeof window !== 'undefined') {
    clientEmailVerifyCache = { tenantId: tid, value };
  }
  return value;
}

export function globalDiscountFromTenant(tenant: TenantJsonData | null | undefined | unknown): GlobalDiscountSettingsNormalized {
  if (!tenant || typeof tenant !== 'object') {
    return normalizeGlobalDiscountSettings(null);
  }
  const bc = (tenant as TenantJsonData).business_config;
  return normalizeGlobalDiscountSettings(bc ?? null);
}

export interface ResolveDisplayPriceParams {
  /** 已按当前汇率换算后的标价 */
  basePriceInCurrentCurrency: number;
  globalDiscount: GlobalDiscountSettingsNormalized;
  isLoggedIn: boolean;
  /** 当前站点租户下 membership.level，已 trim；未登录传 null */
  membershipLevel: string | null;
  /** 商品所属分类 ID（主 JSON `data.categories`）；用于档位内的分类乘数覆盖 */
  categoryIds?: string[] | null;
}

/**
 * 展示价与是否展示：
 * - 未登录：受 show_price_for_unregistered 约束
 * - 全局折扣启用且命中乘数为 0（含 level / 分类覆盖 / fallback）：不展示价格（含已登录用户）
 */
export function resolveDisplayPrice(p: ResolveDisplayPriceParams): {
  showPrice: boolean;
  displayAmount: number;
  /** 实际采用的乘数；enabled=false 时为 1 */
  multiplier: number;
} {
  const base = p.basePriceInCurrentCurrency;
  const cfg = p.globalDiscount;

  let showPrice = p.isLoggedIn ? true : cfg.show_price_for_unregistered !== false;

  let mult = 1;
  let displayAmount = base;
  if (cfg.enabled === true) {
    mult = resolveGlobalDiscountMultiplier(cfg, p.isLoggedIn, p.membershipLevel, p.categoryIds);
    displayAmount = base * mult;
    if (mult === 0) {
      showPrice = false;
    }
  }

  return { showPrice, displayAmount, multiplier: mult };
}
