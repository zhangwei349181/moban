/**
 * 价格计算函数库
 * 用于处理产品价格计算、折扣计算、货币转换等
 */

import type { Discount, TierPrice } from './product';
import type { Currency } from './currencies';
import type { DiscountViewerContext } from './discountEligibility';
import { matchesDiscountUserRestrictions } from './discountEligibility';

export type { DiscountViewerContext, UserRestrictionFields } from './discountEligibility';
export {
  GUEST_DISCOUNT_VIEWER,
  matchesCrowdfundingUserRestrictions,
  matchesDiscountUserRestrictions,
  matchesGroupBuyingUserRestrictions,
  matchesUserRestrictionsFields,
} from './discountEligibility';

/**
 * 检查时间限制是否有效
 * @param timeRestrictions 时间限制
 * @returns 是否在有效时间内
 */
function isTimeValid(timeRestrictions?: { valid_from?: string | null; valid_until?: string | null }): boolean {
  if (!timeRestrictions) {
    return true; // 没有时间限制，视为有效
  }

  const now = new Date();
  
  if (timeRestrictions.valid_from) {
    const validFrom = new Date(timeRestrictions.valid_from);
    if (now < validFrom) {
      return false; // 还未生效
    }
  }
  
  if (timeRestrictions.valid_until) {
    const validUntil = new Date(timeRestrictions.valid_until);
    if (now > validUntil) {
      return false; // 已过期
    }
  }
  
  return true;
}

/**
 * 根据阶梯价格计算价格
 * @param basePrice 基础价格
 * @param quantity 数量
 * @param tierPrice 阶梯价格对象
 * @returns 计算后的价格
 */
function calculateTierPrice(
  basePrice: number,
  quantity: number,
  tierPrice: TierPrice
): number {
  if (tierPrice.price_type === 'percentage') {
    // 百分比折扣：basePrice * (1 - price_value)
    return basePrice * (1 - tierPrice.price_value);
  } else if (tierPrice.price_type === 'fixed_amount') {
    // 固定金额折扣：basePrice - price_value
    return Math.max(0, basePrice - tierPrice.price_value);
  } else if (tierPrice.price_type === 'absolute_price') {
    // 绝对价格：直接使用 price_value 作为单价
    return tierPrice.price_value;
  }
  
  // 未知类型，返回原价
  return basePrice;
}

/**
 * 检查折扣规则是否匹配条件
 * @param discount 折扣规则
 * @param currentPrice 当前价格（用于计算金额限制）
 * @param quantity 数量
 * @returns 是否匹配
 */
function isDiscountMatched(
  discount: Discount,
  currentPrice: number,
  quantity: number,
  viewer?: DiscountViewerContext | null
): boolean {
  console.log(`[折扣匹配检查] 折扣规则: ${discount.rule_name || discount.rule_code}, 当前价格: ${currentPrice}, 数量: ${quantity}`);

  if (!matchesDiscountUserRestrictions(discount, viewer)) {
    console.log(
      `[折扣匹配检查] 折扣 ${discount.rule_name || discount.rule_code} 不满足用户等级/用户限制`
    );
    return false;
  }

  // 检查时间限制
  if (!isTimeValid(discount.time_restrictions)) {
    console.log(`[折扣匹配检查] 折扣 ${discount.rule_name || discount.rule_code} 不在有效时间内`);
    return false; // 不在有效时间内
  }

  // 检查数量限制
  if (discount.quantity_restrictions) {
    const { min_quantity, max_quantity } = discount.quantity_restrictions;
    const minQty = min_quantity ?? 0;
    const maxQty = max_quantity ?? Infinity;
    
    console.log(`[折扣匹配检查] 数量限制: ${minQty} - ${maxQty}, 当前数量: ${quantity}`);
    
    if (quantity < minQty || quantity > maxQty) {
      console.log(`[折扣匹配检查] 折扣 ${discount.rule_name || discount.rule_code} 不满足数量限制`);
      return false; // 不满足数量限制
    }
  }

  // 检查金额限制（使用当前价格计算）
  if (discount.amount_restrictions) {
    const totalAmount = currentPrice * quantity;
    const { min_amount, max_amount } = discount.amount_restrictions;
    const minAmt = min_amount ?? 0;
    const maxAmt = max_amount ?? Infinity;
    
    console.log(`[折扣匹配检查] 金额限制: ${minAmt} - ${maxAmt}, 当前总金额: ${totalAmount}`);
    
    if (totalAmount < minAmt || totalAmount > maxAmt) {
      console.log(`[折扣匹配检查] 折扣 ${discount.rule_name || discount.rule_code} 不满足金额限制`);
      return false; // 不满足金额限制
    }
  }

  console.log(`[折扣匹配检查] 折扣 ${discount.rule_name || discount.rule_code} 匹配成功`);
  return true;
}

/**
 * 应用单个折扣规则计算价格
 * @param currentPrice 当前价格（上一个折扣计算后的价格）
 * @param quantity 数量
 * @param discount 折扣规则
 * @returns 应用折扣后的价格
 */
function applySingleDiscount(
  currentPrice: number,
  quantity: number,
  discount: Discount
): number {
  console.log(`[单个折扣应用] 当前价格: ${currentPrice}, 数量: ${quantity}, 折扣类型: ${discount.discount_type}`);

  // 仅当 discount_type 为 tier_price 时才使用 tier_prices；百分比/固定金额等按顶层 discount_type 计算
  const tierList = discount.discount_type === 'tier_price' ? discount.tier_prices : undefined;
  if (tierList && tierList.length > 0) {
    const activeTierPrices = tierList.filter(
      (tp) => !tp.status || tp.status === 'active'
    );
    console.log(`[单个折扣应用] 阶梯条目(可用): ${activeTierPrices.length}`);

    const tierPrice = activeTierPrices.find((tier) => {
      const minQty = tier.min_quantity ?? 0;
      const maxQty = tier.max_quantity ?? Infinity;
      const matches = quantity >= minQty && quantity <= maxQty;
      console.log(
        `[单个折扣应用] 阶梯 ${tier.tier_name ?? '(未命名)'}: 数量 ${minQty}-${maxQty}, 当前: ${quantity}, 匹配: ${matches}`
      );
      return matches;
    });

    if (tierPrice) {
      console.log(
        `[单个折扣应用] 使用阶梯 price_value: ${tierPrice.price_type} = ${tierPrice.price_value}`
      );
      const result = calculateTierPrice(currentPrice, quantity, tierPrice);
      console.log(`[单个折扣应用] 阶梯计算结果: ${result}`);
      return result;
    }
    console.log(
      `[单个折扣应用] 有 tier_prices 但当前数量未落入任一档，回退到规则顶层 discount_type / discount_value`
    );
  }

  if (discount.discount_type === 'tier_price') {
    if (discount.discount_value > 0) {
      const result = currentPrice * (1 - discount.discount_value);
      console.log(
        `[单个折扣应用] tier_price 回退 discount_value: ${(discount.discount_value * 100).toFixed(0)}%, 结果: ${result}`
      );
      return result;
    }
  } else if (discount.discount_type === 'percentage') {
    const result = currentPrice * (1 - discount.discount_value);
    console.log(`[单个折扣应用] 百分比折扣(discount_value): ${(discount.discount_value * 100).toFixed(0)}%, 结果: ${result}`);
    return result;
  } else if (discount.discount_type === 'fixed_amount') {
    const result = Math.max(0, currentPrice - discount.discount_value);
    console.log(`[单个折扣应用] 固定金额折扣: ${discount.discount_value}, 结果: ${result}`);
    return result;
  }

  console.log(`[单个折扣应用] 无法应用折扣，返回原价格: ${currentPrice}`);
  return currentPrice;
}

/**
 * 应用折扣规则计算最终价格（支持折上折：按优先级顺序叠加折扣）
 * @param basePrice 基础价格
 * @param quantity 数量
 * @param discounts 折扣规则数组
 * @returns 最终价格
 */
export function applyDiscount(
  basePrice: number,
  quantity: number,
  discounts: Discount[],
  viewer?: DiscountViewerContext | null
): number {
  if (!discounts || discounts.length === 0) {
    return basePrice;
  }

  // 1. 按优先级排序（优先级数字越小优先级越高，所以升序排列）
  const sortedDiscounts = discounts
    .filter(d => d.status === 'active')
    .sort((a, b) => a.priority - b.priority);

  // 2. 按优先级顺序依次应用所有满足条件的折扣（折上折）
  let currentPrice = basePrice;
  
  for (const discount of sortedDiscounts) {
    // 检查是否匹配条件（使用当前价格计算金额限制）
    if (!isDiscountMatched(discount, currentPrice, quantity, viewer)) {
      continue; // 不匹配，跳过
    }

    // 应用折扣，更新当前价格
    currentPrice = applySingleDiscount(currentPrice, quantity, discount);
    
    // 确保价格不为负数
    currentPrice = Math.max(0, currentPrice);
  }

  return currentPrice;
}

/**
 * 折扣应用详情
 */
export interface AppliedDiscountDetail {
  discount: Discount;
  priceBefore: number;
  priceAfter: number;
  discountAmount: number;
}

/**
 * 折扣计算结果（包含所有应用的折扣详情）
 */
export interface DiscountResult {
  finalPrice: number;
  discountAmount: number;
  discountRate: number;
  appliedDiscount?: Discount; // 保留用于兼容性，返回第一个应用的折扣
  appliedDiscounts?: AppliedDiscountDetail[]; // 所有应用的折扣详情
}

/**
 * 应用折扣规则并返回详细信息（支持折上折：按优先级顺序叠加折扣）
 * @param basePrice 基础价格
 * @param quantity 数量
 * @param discounts 折扣规则数组
 * @returns 折扣计算结果
 */
export function applyDiscountWithDetails(
  basePrice: number,
  quantity: number,
  discounts: Discount[],
  viewer?: DiscountViewerContext | null
): DiscountResult {
  if (!discounts || discounts.length === 0) {
    return {
      finalPrice: basePrice,
      discountAmount: 0,
      discountRate: 0,
      appliedDiscount: undefined,
      appliedDiscounts: [],
    };
  }

  // 按优先级排序（优先级数字越小优先级越高）
  const sortedDiscounts = discounts
    .filter(d => d.status === 'active')
    .sort((a, b) => a.priority - b.priority);

  // 按优先级顺序依次应用所有满足条件的折扣（折上折）
  let currentPrice = basePrice;
  const appliedDiscounts: AppliedDiscountDetail[] = [];

  console.log(`[折扣应用] 开始应用折扣, 基础价格: ${basePrice}, 数量: ${quantity}, 折扣规则数: ${sortedDiscounts.length}`);

  for (const discount of sortedDiscounts) {
    console.log(`[折扣应用] 检查折扣: ${discount.rule_name || discount.rule_code}, 优先级: ${discount.priority}, 折扣类型: ${discount.discount_type}`);
    
    // 检查是否匹配条件（使用当前价格计算金额限制）
    if (!isDiscountMatched(discount, currentPrice, quantity, viewer)) {
      console.log(`[折扣应用] 折扣 ${discount.rule_name || discount.rule_code} 不匹配，跳过`);
      continue; // 不匹配，跳过
    }

    // 记录应用折扣前的价格
    const priceBefore = currentPrice;
    console.log(`[折扣应用] 应用折扣前价格: ${priceBefore}`);
    
    // 应用折扣，更新当前价格
    currentPrice = applySingleDiscount(currentPrice, quantity, discount);
    console.log(`[折扣应用] 应用折扣后价格: ${currentPrice}`);
    
    // 确保价格不为负数
    currentPrice = Math.max(0, currentPrice);
    
    // 记录应用的折扣详情
    const discountAmount = priceBefore - currentPrice;
    console.log(`[折扣应用] 折扣金额: ${discountAmount}`);
    
    if (discountAmount > 0) {
      appliedDiscounts.push({
        discount,
        priceBefore,
        priceAfter: currentPrice,
        discountAmount,
      });
      console.log(`[折扣应用] 折扣 ${discount.rule_name || discount.rule_code} 应用成功，折扣金额: ${discountAmount}`);
    }
  }

  console.log(`[折扣应用] 折扣应用完成, 最终价格: ${currentPrice}, 应用的折扣数: ${appliedDiscounts.length}`);

  const finalPrice = currentPrice;
  const totalDiscountAmount = basePrice - finalPrice;
  const discountRate = basePrice > 0 ? totalDiscountAmount / basePrice : 0;

  return {
    finalPrice,
    discountAmount: totalDiscountAmount,
    discountRate,
    appliedDiscount: appliedDiscounts.length > 0 ? appliedDiscounts[0].discount : undefined,
    appliedDiscounts,
  };
}

/**
 * 计算最终价格（包括折扣和货币转换）
 * @param basePrice 基础价格（默认货币）
 * @param quantity 数量
 * @param discounts 折扣规则数组
 * @param exchangeRate 汇率（默认货币 → 当前货币）
 * @returns 最终价格（当前货币）
 */
export function calculateFinalPrice(
  basePrice: number,
  quantity: number,
  discounts: Discount[],
  exchangeRate: number = 1,
  viewer?: DiscountViewerContext | null
): number {
  // 1. 应用折扣（在默认货币下）
  const discountedPrice = applyDiscount(basePrice, quantity, discounts, viewer);
  
  // 2. 应用汇率转换
  return discountedPrice * exchangeRate;
}

/**
 * 货币转换
 * @param amount 金额（源货币）
 * @param exchangeRate 汇率
 * @returns 转换后的金额
 */
export function convertCurrency(
  amount: number,
  exchangeRate: number
): number {
  return amount * exchangeRate;
}

/**
 * 格式化价格显示
 * @param amount 金额
 * @param currency 货币对象
 * @returns 格式化后的价格字符串
 */
export function formatPrice(amount: number, currency: Currency): string {
  const decimalPlaces = currency.decimal_places || 2;
  const formatted = amount.toFixed(decimalPlaces);
  return `${currency.currency_symbol} ${formatted}`;
}

/**
 * 格式化价格显示（使用货币代码）
 * @param amount 金额
 * @param currencySymbol 货币符号
 * @param decimalPlaces 小数位数（默认2位）
 * @returns 格式化后的价格字符串
 */
export function formatPriceSimple(
  amount: number,
  currencySymbol: string,
  decimalPlaces: number = 2
): string {
  const formatted = amount.toFixed(decimalPlaces);
  return `${currencySymbol} ${formatted}`;
}

/**
 * 计算总价（单价 × 数量）
 * @param unitPrice 单价
 * @param quantity 数量
 * @returns 总价
 */
export function calculateTotalPrice(
  unitPrice: number,
  quantity: number
): number {
  return unitPrice * quantity;
}

/**
 * 从全局变量获取当前货币和汇率
 */
export function getClientCurrencyConfig(): {
  currentCurrency: Currency | null;
  defaultCurrency: Currency | null;
  exchangeRate: number;
} {
  if (typeof window === 'undefined') {
    return {
      currentCurrency: null,
      defaultCurrency: null,
      exchangeRate: 1,
    };
  }

  const win = window as any;
  return {
    currentCurrency: win.__ASTRO_CURRENT_CURRENCY__ || null,
    defaultCurrency: win.__ASTRO_DEFAULT_CURRENCY__ || null,
    exchangeRate: win.__ASTRO_EXCHANGE_RATE__ || 1,
  };
}

/**
 * 客户端专用的价格计算函数
 */
export const clientPricing = {
  applyDiscount,
  applyDiscountWithDetails,
  calculateFinalPrice,
  convertCurrency,
  formatPrice,
  formatPriceSimple,
  calculateTotalPrice,
  getClientCurrencyConfig,
};

