import { pickLocalePair, resolveHeader, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface CartSectionMeta {
  title: string;
  productLabel: string;
  priceLabel: string;
  quantityLabel: string;
  subtotalLabel: string;
  shippingLabel: string;
  taxLabel: string;
  summaryTitle: string;
  subtotalSummaryLabel: string;
  shippingSummaryLabel: string;
  taxSummaryLabel: string;
  totalLabel: string;
  emptyMessage: string;
  continueShoppingLabel: string;
  checkoutLabel: string;
  checkoutUrl: string;
  continueShoppingUrl: string;
  productPageCode: string;
}

const FALLBACK = {
  title: { en: 'Shopping Cart', zh: '购物车' },
  product: { en: 'Product', zh: '产品' },
  price: { en: 'Price', zh: '价格' },
  quantity: { en: 'Quantity', zh: '数量' },
  subtotal: { en: 'Subtotal', zh: '小计' },
  shipping: { en: 'Shipping', zh: '运费' },
  tax: { en: 'Tax', zh: '税费' },
  summaryTitle: { en: 'Cart Totals', zh: '购物车汇总' },
  subtotalSummary: { en: 'Subtotal', zh: '商品小计' },
  total: { en: 'Total', zh: '总计' },
  empty: { en: 'Your cart is empty', zh: '购物车为空' },
  continueShopping: { en: 'Continue Shopping', zh: '继续购物' },
  checkout: { en: 'Proceed to Checkout', zh: '结算' },
};

export function resolveCartSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): CartSectionMeta {
  const meta = metadata || {};
  const header = resolveHeader(meta, locale, {
    title: pickLocalePair(locale, FALLBACK.title.en, FALLBACK.title.zh),
  });

  return {
    title: header.title,
    productLabel: strMeta(
      meta.product_label ?? meta.productLabel,
      pickLocalePair(locale, FALLBACK.product.en, FALLBACK.product.zh)
    ),
    priceLabel: strMeta(
      meta.price_label ?? meta.priceLabel,
      pickLocalePair(locale, FALLBACK.price.en, FALLBACK.price.zh)
    ),
    quantityLabel: strMeta(
      meta.quantity_label ?? meta.quantityLabel,
      pickLocalePair(locale, FALLBACK.quantity.en, FALLBACK.quantity.zh)
    ),
    subtotalLabel: strMeta(
      meta.subtotal_label ?? meta.subtotalLabel,
      pickLocalePair(locale, FALLBACK.subtotal.en, FALLBACK.subtotal.zh)
    ),
    shippingLabel: strMeta(
      meta.shipping_label ?? meta.shippingLabel,
      pickLocalePair(locale, FALLBACK.shipping.en, FALLBACK.shipping.zh)
    ),
    taxLabel: strMeta(
      meta.tax_label ?? meta.taxLabel,
      pickLocalePair(locale, FALLBACK.tax.en, FALLBACK.tax.zh)
    ),
    summaryTitle: strMeta(
      meta.summary_title ?? meta.summaryTitle,
      pickLocalePair(locale, FALLBACK.summaryTitle.en, FALLBACK.summaryTitle.zh)
    ),
    subtotalSummaryLabel: strMeta(
      meta.subtotal_summary_label ?? meta.subtotalSummaryLabel,
      pickLocalePair(locale, FALLBACK.subtotalSummary.en, FALLBACK.subtotalSummary.zh)
    ),
    shippingSummaryLabel: strMeta(
      meta.shipping_summary_label ?? meta.shippingSummaryLabel,
      pickLocalePair(locale, FALLBACK.shipping.en, FALLBACK.shipping.zh)
    ),
    taxSummaryLabel: strMeta(
      meta.tax_summary_label ?? meta.taxSummaryLabel,
      pickLocalePair(locale, FALLBACK.tax.en, FALLBACK.tax.zh)
    ),
    totalLabel: strMeta(
      meta.total_label ?? meta.totalLabel,
      pickLocalePair(locale, FALLBACK.total.en, FALLBACK.total.zh)
    ),
    emptyMessage: strMeta(
      meta.empty_message ?? meta.emptyMessage,
      pickLocalePair(locale, FALLBACK.empty.en, FALLBACK.empty.zh)
    ),
    continueShoppingLabel: strMeta(
      meta.continue_shopping_label ?? meta.continueShoppingLabel,
      pickLocalePair(locale, FALLBACK.continueShopping.en, FALLBACK.continueShopping.zh)
    ),
    checkoutLabel: strMeta(
      meta.checkout_label ?? meta.checkoutLabel,
      pickLocalePair(locale, FALLBACK.checkout.en, FALLBACK.checkout.zh)
    ),
    checkoutUrl: strMeta(meta.checkout_url ?? meta.checkoutUrl, '/checkout'),
    continueShoppingUrl: strMeta(
      meta.continue_shopping_url ?? meta.continueShoppingUrl ?? meta.home_url,
      '/'
    ),
    productPageCode: strMeta(meta.product_page_code ?? meta.productPageCode, 'productsingle'),
  };
}

export async function loadCartSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
