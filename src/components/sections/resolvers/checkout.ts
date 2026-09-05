import { pickLocalePair, resolveHeader, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface CheckoutSectionMeta {
  title: string;
  orderSummaryTitle: string;
  productLabel: string;
  priceLabel: string;
  quantityLabel: string;
  subtotalLabel: string;
  summaryTitle: string;
  subtotalSummaryLabel: string;
  shippingSummaryLabel: string;
  taxSummaryLabel: string;
  totalLabel: string;
  settleCurrencyLabel: string;
  paymentTitle: string;
  paymentLoadingLabel: string;
  billingTitle: string;
  billingHint: string;
  addBillingLabel: string;
  addressLoadingLabel: string;
  payLabel: string;
  backToCartLabel: string;
  emptyMessage: string;
  authMessage: string;
  loginLabel: string;
  loginUrl: string;
  cartUrl: string;
  addressesUrl: string;
  successReturnPath: string;
  cancelReturnPath: string;
}

const FALLBACK = {
  title: { en: 'Checkout', zh: '结算' },
  orderSummary: { en: 'Order summary', zh: '订单摘要' },
  product: { en: 'Product', zh: '产品' },
  price: { en: 'Price', zh: '价格' },
  quantity: { en: 'Quantity', zh: '数量' },
  subtotal: { en: 'Subtotal', zh: '小计' },
  summaryTitle: { en: 'Cart Totals', zh: '购物车汇总' },
  subtotalSummary: { en: 'Subtotal', zh: '商品小计' },
  shipping: { en: 'Shipping', zh: '运费' },
  tax: { en: 'Tax', zh: '税费' },
  total: { en: 'Total', zh: '总计' },
  settleCurrency: { en: 'Checkout currency:', zh: '结账货币：' },
  payment: { en: 'Payment Method', zh: '支付方式' },
  paymentLoading: { en: 'Loading...', zh: '加载中...' },
  billing: { en: 'Billing Address', zh: '账单地址' },
  billingHint: {
    en: 'Add a billing address before paying. You can add one in your account.',
    zh: '请先添加账单地址后再支付；可在账户中心新增「账单地址」。',
  },
  addBilling: { en: 'Add billing address', zh: '添加账单地址' },
  addressLoading: { en: 'Loading addresses...', zh: '正在加载地址...' },
  pay: { en: 'Pay now', zh: '去支付' },
  backToCart: { en: 'Back to cart', zh: '返回购物车' },
  empty: { en: 'Your cart is empty', zh: '购物车为空' },
  auth: { en: 'Please login first', zh: '请先登录' },
  login: { en: 'Sign in', zh: '登录' },
};

export function resolveCheckoutSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): CheckoutSectionMeta {
  const meta = metadata || {};
  const header = resolveHeader(meta, locale, {
    title: pickLocalePair(locale, FALLBACK.title.en, FALLBACK.title.zh),
  });

  return {
    title: header.title,
    orderSummaryTitle: strMeta(
      meta.order_summary_title ?? meta.orderSummaryTitle,
      pickLocalePair(locale, FALLBACK.orderSummary.en, FALLBACK.orderSummary.zh)
    ),
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
    settleCurrencyLabel: strMeta(
      meta.settle_currency_label ?? meta.settleCurrencyLabel,
      pickLocalePair(locale, FALLBACK.settleCurrency.en, FALLBACK.settleCurrency.zh)
    ),
    paymentTitle: strMeta(
      meta.payment_title ?? meta.paymentTitle,
      pickLocalePair(locale, FALLBACK.payment.en, FALLBACK.payment.zh)
    ),
    paymentLoadingLabel: strMeta(
      meta.payment_loading_label ?? meta.paymentLoadingLabel,
      pickLocalePair(locale, FALLBACK.paymentLoading.en, FALLBACK.paymentLoading.zh)
    ),
    billingTitle: strMeta(
      meta.billing_title ?? meta.billingTitle,
      pickLocalePair(locale, FALLBACK.billing.en, FALLBACK.billing.zh)
    ),
    billingHint: strMeta(
      meta.billing_hint ?? meta.billingHint,
      pickLocalePair(locale, FALLBACK.billingHint.en, FALLBACK.billingHint.zh)
    ),
    addBillingLabel: strMeta(
      meta.add_billing_label ?? meta.addBillingLabel,
      pickLocalePair(locale, FALLBACK.addBilling.en, FALLBACK.addBilling.zh)
    ),
    addressLoadingLabel: strMeta(
      meta.address_loading_label ?? meta.addressLoadingLabel,
      pickLocalePair(locale, FALLBACK.addressLoading.en, FALLBACK.addressLoading.zh)
    ),
    payLabel: strMeta(
      meta.pay_label ?? meta.payLabel,
      pickLocalePair(locale, FALLBACK.pay.en, FALLBACK.pay.zh)
    ),
    backToCartLabel: strMeta(
      meta.back_to_cart_label ?? meta.backToCartLabel,
      pickLocalePair(locale, FALLBACK.backToCart.en, FALLBACK.backToCart.zh)
    ),
    emptyMessage: strMeta(
      meta.empty_message ?? meta.emptyMessage,
      pickLocalePair(locale, FALLBACK.empty.en, FALLBACK.empty.zh)
    ),
    authMessage: strMeta(
      meta.auth_message ?? meta.authMessage,
      pickLocalePair(locale, FALLBACK.auth.en, FALLBACK.auth.zh)
    ),
    loginLabel: strMeta(
      meta.login_label ?? meta.loginLabel,
      pickLocalePair(locale, FALLBACK.login.en, FALLBACK.login.zh)
    ),
    loginUrl: strMeta(meta.login_url ?? meta.loginUrl, '/login'),
    cartUrl: strMeta(meta.cart_url ?? meta.cartUrl, '/cart'),
    addressesUrl: strMeta(meta.addresses_url ?? meta.addressesUrl, '/dashboard#addresses'),
    successReturnPath: strMeta(
      meta.success_return_path ?? meta.successReturnPath,
      '/checkout?status=success&session_id={CHECKOUT_SESSION_ID}'
    ),
    cancelReturnPath: strMeta(
      meta.cancel_return_path ?? meta.cancelReturnPath,
      '/checkout?status=cancel'
    ),
  };
}

export async function loadCheckoutSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
