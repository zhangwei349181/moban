/**
 * 客户端：读取 Layout 注入的全局折扣 + localStorage 登录态，计算列表展示价。
 */

import { getSessionToken, getCurrentMembership } from './auth';
import {
  normalizeGlobalDiscountSettings,
  normalizeProductCategoryIds,
  resolveDisplayPrice,
  type GlobalDiscountSettingsNormalized,
} from './tenant';

export { normalizeProductCategoryIds };

/** 从列表项上取分类 ID：优先顶层 `categories`（主 JSON 合并后），其次 `data.categories` */
export function categoryIdsFromProductLike(product: unknown): string[] {
  if (!product || typeof product !== 'object') return [];
  const p = product as Record<string, unknown>;
  if (Array.isArray(p.categories)) return normalizeProductCategoryIds(p.categories);
  const data = p.data;
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).categories)) {
    return normalizeProductCategoryIds((data as Record<string, unknown>).categories);
  }
  return [];
}

export function readGlobalDiscountFromWindow(): GlobalDiscountSettingsNormalized {
  if (typeof window === 'undefined') {
    return normalizeGlobalDiscountSettings(null);
  }
  const raw = (window as any).__ASTRO_GLOBAL_DISCOUNT__;
  if (
    raw &&
    typeof raw === 'object' &&
    typeof raw.enabled === 'boolean' &&
    typeof raw.show_price_for_unregistered === 'boolean' &&
    typeof raw.fallback_multiplier === 'number' &&
    Array.isArray(raw.level_multipliers)
  ) {
    return raw as GlobalDiscountSettingsNormalized;
  }
  return normalizeGlobalDiscountSettings(null);
}

/**
 * 当前站点租户下的 membership.level；跨租户登录则返回 level null（走 fallback）。
 */
export function getMembershipLevelForSite(siteTenantId: string): {
  isLoggedIn: boolean;
  membershipLevel: string | null;
} {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, membershipLevel: null };
  }
  const token = getSessionToken();
  const mem = getCurrentMembership();
  if (!token || !mem) return { isLoggedIn: false, membershipLevel: null };
  const tid = mem.tenant?.id;
  if (siteTenantId && tid && tid !== siteTenantId) {
    return { isLoggedIn: true, membershipLevel: null };
  }
  const level = mem.level != null && String(mem.level).trim() !== '' ? String(mem.level).trim() : null;
  return { isLoggedIn: true, membershipLevel: level };
}

export function formatProductPriceDisplay(
  priceInCurrentCurrency: number,
  siteTenantId: string,
  formatPrice: (amount: number) => string,
  loginToViewLabel: string,
  categoryIds?: string[] | null
): string {
  const g = readGlobalDiscountFromWindow();
  const { isLoggedIn, membershipLevel } = getMembershipLevelForSite(siteTenantId);
  const { showPrice, displayAmount } = resolveDisplayPrice({
    basePriceInCurrentCurrency: priceInCurrentCurrency,
    globalDiscount: g,
    isLoggedIn,
    membershipLevel,
    categoryIds,
  });
  if (!showPrice) {
    return hiddenPricePlaceholderHtml(isLoggedIn, loginToViewLabel);
  }
  return formatPrice(displayAmount);
}

/** 价格隐藏时的占位：访客提示登录；已登录（如档位乘数为 0）则留空 */
export function hiddenPricePlaceholderHtml(isLoggedIn: boolean, loginToViewLabel: string): string {
  if (isLoggedIn) return '';
  return `<span class="text-content">${loginToViewLabel}</span>`;
}

/** 未登录且关闭访客显价，或全局折扣启用且当前档位乘数为 0 时，主价格区不展示金额。 */
export function isUnregisteredPriceUiHidden(
  siteTenantId: string,
  categoryIds?: string[] | null
): boolean {
  const g = readGlobalDiscountFromWindow();
  const { isLoggedIn, membershipLevel } = getMembershipLevelForSite(siteTenantId);
  const { showPrice } = resolveDisplayPrice({
    basePriceInCurrentCurrency: 1,
    globalDiscount: g,
    isLoggedIn,
    membershipLevel,
    categoryIds,
  });
  return !showPrice;
}

/** 当前站点是否应隐藏价格，以及是否已登录（便于选择占位文案） */
export function getPriceUiVisibility(
  siteTenantId: string,
  categoryIds?: string[] | null
): {
  hidePrice: boolean;
  isLoggedIn: boolean;
} {
  const g = readGlobalDiscountFromWindow();
  const { isLoggedIn, membershipLevel } = getMembershipLevelForSite(siteTenantId);
  const { showPrice } = resolveDisplayPrice({
    basePriceInCurrentCurrency: 1,
    globalDiscount: g,
    isLoggedIn,
    membershipLevel,
    categoryIds,
  });
  return { hidePrice: !showPrice, isLoggedIn };
}

export type ShopDetailPriceMode = 'plain' | 'group_buy' | 'crowdfunding';

/**
 * 商品详情主价格：
 * - 团购 / 众筹：不套全局档位乘数，仅用业务侧价格。
 * - 普通商品且存在折扣规则效果：不套全局乘数。
 * - 仅普通商品且无折扣规则效果：对原价与规则价分别套 resolveDisplayPrice（与列表一致）。
 */
export function adjustPlainProductPricesForGlobalTier(
  convertedOriginal: number,
  ruleFinalPrice: number,
  discountAmountFromRules: number,
  mode: ShopDetailPriceMode,
  siteTenantId: string,
  categoryIds?: string[] | null
): { displayOriginal: number; displayDiscounted: number; showStrikeDiscount: boolean } {
  const EPS = 1e-6;
  const g = readGlobalDiscountFromWindow();
  const { isLoggedIn, membershipLevel } = getMembershipLevelForSite(siteTenantId);

  const hasRuleDiscount =
    discountAmountFromRules > 0 || convertedOriginal - ruleFinalPrice > EPS;

  if (mode !== 'plain' || hasRuleDiscount) {
    const showStrikeDiscount = ruleFinalPrice < convertedOriginal - EPS;
    return {
      displayOriginal: convertedOriginal,
      displayDiscounted: ruleFinalPrice,
      showStrikeDiscount,
    };
  }

  const rO = resolveDisplayPrice({
    basePriceInCurrentCurrency: convertedOriginal,
    globalDiscount: g,
    isLoggedIn,
    membershipLevel,
    categoryIds,
  });
  const rD = resolveDisplayPrice({
    basePriceInCurrentCurrency: ruleFinalPrice,
    globalDiscount: g,
    isLoggedIn,
    membershipLevel,
    categoryIds,
  });
  const dO = rO.displayAmount;
  const dD = rD.displayAmount;
  const showStrikeDiscount = dD < dO - EPS;
  return { displayOriginal: dO, displayDiscounted: dD, showStrikeDiscount };
}
