/**
 * 订阅商品：从产品变体 + 单一「变体维度」属性构建定价卡片数据。
 * 不依赖折扣、运费、税费等接口。
 */

import type { Currency } from './currencies';
import { normalizeLocale as normalizeLocaleCode } from './languages';
import { convertCurrency } from './pricing';
import type { ArticleVariantsData, Attribute, AttributeValue, Variant } from './product';

export interface SubscriptionPhysicalOption {
  code: string;
  label?: string;
  multiplier: number;
}

export interface SubscriptionPhysicalConfig {
  base_period: string;
  options: SubscriptionPhysicalOption[];
}

export interface SubscriptionBillingOptionView {
  code: string;
  buttonLabel: string;
  priceDisplay: string;
  periodSuffix: string;
  equivHint: string;
}

export interface SubscriptionPlanCardView {
  valueId: string;
  variantId: string;
  title: string;
  subtitle: string;
  featureLines: string[];
  currencyCode: string;
  currencySymbol: string;
  billingOptions: SubscriptionBillingOptionView[];
  defaultBillingCode: string;
  /** 交给前端 data 属性，驱动切换 */
  pricingJson: string;
  /** 立即订阅写入本地购物车用（tenant、变体、各周期金额倍数等） */
  cartPayloadJson: string;
  featured: boolean;
}

/** physical.dimensions.is_recommended === true 时展示「推荐」角标 */
function readDimensionsIsRecommended(variant: Variant): boolean {
  const physical = (variant as Record<string, unknown>).physical as
    | { dimensions?: { is_recommended?: boolean } }
    | undefined;
  return physical?.dimensions?.is_recommended === true;
}

/** physical.dimensions.sort_order，缺失或非法时为 null */
function readDimensionsSortOrder(variant: Variant): number | null {
  const physical = (variant as Record<string, unknown>).physical as
    | { dimensions?: { sort_order?: unknown } }
    | undefined;
  const so = physical?.dimensions?.sort_order;
  if (typeof so === 'number' && !Number.isNaN(so)) return so;
  if (typeof so === 'string' && so.trim() !== '') {
    const n = parseFloat(so);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function variantCreatedAtMs(variant: Variant): number {
  const raw = (variant as Record<string, unknown>).created_at;
  if (typeof raw === 'string' && raw.trim()) {
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

/** 卡片顺序：优先 dimensions.sort_order 升序；无 sort_order 的排在有之后；再按 created_at 升序 */
function compareVariantsForSubscriptionCards(a: Variant, b: Variant): number {
  const oa = readDimensionsSortOrder(a);
  const ob = readDimensionsSortOrder(b);
  if (oa !== null && ob !== null && oa !== ob) return oa - ob;
  if (oa !== null && ob === null) return -1;
  if (oa === null && ob !== null) return 1;
  return variantCreatedAtMs(a) - variantCreatedAtMs(b);
}

function readSubscriptionConfig(variant: Variant): SubscriptionPhysicalConfig | null {
  const physical = (variant as Record<string, unknown>).physical as
    | {
        dimensions?: {
          is_recommended?: boolean;
          sort_order?: number;
          subscription?: {
            base_period?: string;
            options?: SubscriptionPhysicalOption[];
          };
        };
      }
    | undefined;
  const sub = physical?.dimensions?.subscription;
  if (!sub || !Array.isArray(sub.options) || sub.options.length === 0) {
    return null;
  }
  return {
    base_period: typeof sub.base_period === 'string' ? sub.base_period : 'monthly',
    options: sub.options.filter((o) => o && typeof o.code === 'string' && typeof o.multiplier === 'number'),
  };
}

function formatAmountNumber(amount: number, locale: string, maxFractionDigits = 2): string {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    }).format(amount);
  } catch {
    return String(Math.round(amount * 100) / 100);
  }
}

/**
 * 仅当 translations 里存在「当前界面语言」对应行时才返回该行。
 * 主语言文案在属性值根字段（value_name / display_name / description），不在 translations 里；
 * 故英文界面不应回退到 translations[0]（常为其它语言）。
 */
function pickTranslationMatchingLocale(
  rows: Array<Record<string, unknown>> | undefined,
  locale: string
): Record<string, unknown> | null {
  if (!rows?.length) return null;
  const target = normalizeLocaleCode(locale);

  let hit = rows.find(
    (r) => r.language_code && normalizeLocaleCode(String(r.language_code)) === target
  );
  if (hit) return hit;

  const targetPrimary = target.split('-')[0];
  hit = rows.find((r) => {
    if (!r.language_code) return false;
    const rc = normalizeLocaleCode(String(r.language_code));
    const rPrimary = rc.split('-')[0];
    return rc === targetPrimary || target.startsWith(rc) || rc.startsWith(targetPrimary);
  });
  return hit || null;
}

/** 简单货币符号，避免重复请求 */
function currencySymbolFor(code: string): string {
  const c = (code || 'CNY').toUpperCase();
  if (c === 'CNY' || c === 'RMB') return '¥';
  if (c === 'USD') return '$';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  return c + ' ';
}

function billingButtonLabel(code: string, apiLabel: string | undefined, locale: string): string {
  const zh = locale.toLowerCase().startsWith('zh');
  const c = code.toLowerCase();
  if (c === 'monthly') return zh ? '月付' : 'Monthly';
  if (c === 'yearly' || c === 'year' || c === 'annual') return zh ? '年付' : 'Yearly';
  if (c === 'quarterly') return zh ? '季付' : 'Quarterly';
  if (apiLabel && apiLabel.trim()) return apiLabel.trim();
  return code;
}

function periodSuffixForOption(code: string, apiLabel: string | undefined, locale: string): string {
  const zh = locale.toLowerCase().startsWith('zh');
  const c = code.toLowerCase();
  if (c === 'monthly') return zh ? '/月' : '/mo';
  if (c === 'yearly' || c === 'year' || c === 'annual') return zh ? '/年' : '/yr';
  if (c === 'quarterly') return zh ? '/季' : '/qtr';
  if (apiLabel && apiLabel.trim()) return '/' + apiLabel.trim();
  return '';
}

function equivMonthlyHint(
  symbol: string,
  perMonth: number,
  locale: string
): string {
  const zh = locale.toLowerCase().startsWith('zh');
  const num = formatAmountNumber(perMonth, locale);
  return zh ? `约合 ${symbol}${num}/月` : `≈ ${symbol}${num}/mo`;
}

function localizedValueName(value: AttributeValue, locale: string): string {
  const tr = pickTranslationMatchingLocale(value.translations as Array<Record<string, unknown>>, locale);
  if (tr) {
    const vn = tr.value_name;
    if (typeof vn === 'string' && vn.trim()) return vn.trim();
  }
  return (value.value_name || value.value_code || '').trim();
}

function localizedDisplayName(value: AttributeValue, locale: string): string {
  const tr = pickTranslationMatchingLocale(value.translations as Array<Record<string, unknown>>, locale);
  if (tr) {
    const dn = tr.display_name;
    if (typeof dn === 'string' && dn.trim()) return dn.trim();
  }
  return (value.display_name || '').trim();
}

function localizedDescription(value: AttributeValue, locale: string): string {
  const tr = pickTranslationMatchingLocale(value.translations as Array<Record<string, unknown>>, locale);
  if (tr) {
    const d = tr.description;
    if (typeof d === 'string') return d;
    return '';
  }
  const root = (value as Record<string, unknown>).description;
  return typeof root === 'string' ? root : '';
}

/** 将 description 拆成列表行：优先换行，其次中文分号/句号，再次英文分号 */
export function splitDescriptionToLines(description: string): string[] {
  const raw = (description || '').trim();
  if (!raw) return [];
  const byNl = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byNl.length > 1) return byNl;
  const parts = raw.split(/[；;。]+/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [raw];
}

function findVariantForSingleValue(variants: Variant[], valueId: string): Variant | null {
  for (const v of variants) {
    if (v.status !== 'active') continue;
    const ids = v.attribute_value_ids || [];
    if (ids.includes(valueId)) {
      return v;
    }
  }
  return null;
}

/**
 * 计算各计费周期价格：以 base_period 对应 option 的 multiplier 为基准，价格 = basePrice * (opt.multiplier / baseMult)
 */
export function computePricesBySubscriptionOptions(
  basePrice: number,
  config: SubscriptionPhysicalConfig
): Map<string, number> {
  const map = new Map<string, number>();
  if (!config.options.length) return map;
  const baseOpt =
    config.options.find((o) => o.code === config.base_period) || config.options[0];
  const baseMult = baseOpt.multiplier || 1;
  for (const opt of config.options) {
    map.set(opt.code, basePrice * (opt.multiplier / baseMult));
  }
  return map;
}

export interface BuildSubscriptionPlanCardsOptions {
  /** middleware：默认货币 → 当前展示货币（与 ShopProductRuntime 一致） */
  exchangeRate?: number;
  currentCurrency?: Currency | null;
  tenantId?: string;
  articleId?: string;
  productName?: string;
}

export function buildSubscriptionPlanCards(
  variantsData: ArticleVariantsData,
  locale: string,
  options: BuildSubscriptionPlanCardsOptions = {}
): SubscriptionPlanCardView[] {
  const rateRaw = options.exchangeRate ?? 1;
  const rate = typeof rateRaw === 'number' && rateRaw > 0 ? rateRaw : 1;
  const displayCurrency = options.currentCurrency ?? null;

  const attributes = variantsData.data?.attributes ?? [];
  const variants = variantsData.data?.variants ?? [];
  const creatorAttrs = attributes.filter((a) => a.is_variant_creator);

  if (!creatorAttrs.length || !variants.length) {
    return [];
  }

  /** 订阅商品约定：仅一个变体维度属性；若多个则取第一个 */
  const attr: Attribute = creatorAttrs[0];
  const pairs: { value: AttributeValue; variant: Variant }[] = [];
  for (const value of attr.values || []) {
    const variant = findVariantForSingleValue(variants, value.id);
    if (variant) pairs.push({ value, variant });
  }
  pairs.sort((x, y) => compareVariantsForSubscriptionCards(x.variant, y.variant));

  const cards: SubscriptionPlanCardView[] = [];
  for (const { value, variant } of pairs) {
    const basePrice = variant.pricing?.base_price ?? 0;
    const variantCurrencyCode = variant.pricing?.currency || 'CNY';
    const decimals = displayCurrency?.decimal_places ?? 2;
    const sym = displayCurrency?.currency_symbol ?? currencySymbolFor(variantCurrencyCode);

    const subConfig = readSubscriptionConfig(variant);
    const priceMapBase = subConfig
      ? computePricesBySubscriptionOptions(basePrice, subConfig)
      : new Map<string, number>([['default', basePrice]]);

    const toDisplayAmount = (amountInDefaultCurrency: number) =>
      convertCurrency(amountInDefaultCurrency, rate);

    let billingOptions: SubscriptionBillingOptionView[];
    let defaultBillingCode: string;

    if (subConfig && subConfig.options.length > 0) {
      defaultBillingCode = subConfig.base_period;
      if (!priceMapBase.has(defaultBillingCode)) {
        defaultBillingCode = subConfig.options[0].code;
      }

      billingOptions = subConfig.options.map((opt) => {
        const amountBase = priceMapBase.get(opt.code) ?? 0;
        const amountDisplay = toDisplayAmount(amountBase);
        const priceDisplay = formatAmountNumber(amountDisplay, locale, decimals);
        const periodSuffix = periodSuffixForOption(opt.code, opt.label, locale);
        let equivHint = '';
        const oc = opt.code.toLowerCase();
        if ((oc === 'yearly' || oc === 'year' || oc === 'annual') && amountDisplay > 0) {
          const perMonth = amountDisplay / 12;
          equivHint = equivMonthlyHint(sym, perMonth, locale);
        }
        return {
          code: opt.code,
          buttonLabel: billingButtonLabel(opt.code, opt.label, locale),
          priceDisplay,
          periodSuffix,
          equivHint,
        };
      });
    } else {
      defaultBillingCode = 'default';
      const amountDisplay = toDisplayAmount(basePrice);
      billingOptions = [
        {
          code: 'default',
          buttonLabel: locale.toLowerCase().startsWith('zh') ? '价格' : 'Price',
          priceDisplay: formatAmountNumber(amountDisplay, locale, decimals),
          periodSuffix: '',
          equivHint: '',
        },
      ];
    }

    const pricingJson = JSON.stringify({
      defaultCode: defaultBillingCode,
      currencySymbol: sym,
      options: billingOptions.map((o) => ({
        code: o.code,
        priceDisplay: o.priceDisplay,
        periodSuffix: o.periodSuffix,
        equivHint: o.equivHint,
      })),
    });

    let billingPayload: Array<{ code: string; multiplier: number; amount_display: number }>;
    if (subConfig && subConfig.options.length > 0) {
      billingPayload = subConfig.options.map((opt) => {
        const amountBase = priceMapBase.get(opt.code) ?? 0;
        return {
          code: opt.code,
          multiplier: opt.multiplier,
          amount_display: toDisplayAmount(amountBase),
        };
      });
    } else {
      billingPayload = [
        { code: 'default', multiplier: 1, amount_display: toDisplayAmount(basePrice) },
      ];
    }

    const cartPayloadJson = JSON.stringify({
      tenant_id: options.tenantId ?? '',
      article_id: options.articleId ?? variant.article_id,
      product_name: options.productName ?? '',
      attribute_id: attr.id,
      attribute_value_id: value.id,
      attribute_value_name: localizedValueName(value, locale),
      variant_id: variant.id,
      sku: (variant.sku ?? '').trim(),
      variant_name: (variant.variant_name ?? '').trim(),
      base_price: basePrice,
      variant_currency: variantCurrencyCode,
      display_currency_code: displayCurrency?.currency_code ?? variantCurrencyCode,
      exchange_rate: rate,
      default_billing_code: defaultBillingCode,
      billing_options: billingPayload,
    });

    const desc = localizedDescription(value, locale);
    const featureLines = splitDescriptionToLines(desc);

    cards.push({
      valueId: value.id,
      variantId: variant.id,
      title: localizedValueName(value, locale),
      subtitle: localizedDisplayName(value, locale),
      featureLines,
      currencyCode: displayCurrency?.currency_code ?? variantCurrencyCode,
      currencySymbol: sym,
      billingOptions,
      defaultBillingCode,
      pricingJson,
      cartPayloadJson,
      featured: readDimensionsIsRecommended(variant),
    });
  }

  return cards;
}

/** 将接口返回规范化为安全结构（与 ShopProductRuntime 一致） */
export function normalizeVariantsResponse(res: ArticleVariantsData | null): ArticleVariantsData {
  return {
    success: res?.success ?? true,
    data: {
      attributes: Array.isArray(res?.data?.attributes) ? res.data.attributes : [],
      variants: Array.isArray(res?.data?.variants) ? res.data!.variants : [],
    },
  };
}
