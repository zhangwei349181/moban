import { pickLocalePair, resolveHeader, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface SubscriptionCheckoutSectionMeta {
  title: string;
  summaryTitle: string;
  productLabel: string;
  planLabel: string;
  periodLabel: string;
  amountLabel: string;
  confirmTitle: string;
  totalLabel: string;
  paymentTitle: string;
  paymentLoadingLabel: string;
  billingTitle: string;
  billingHint: string;
  addBillingLabel: string;
  addressLoadingLabel: string;
  payLabel: string;
  backToShopLabel: string;
  emptyMessage: string;
  authMessage: string;
  loginLabel: string;
  loginUrl: string;
  shopUrl: string;
  addressesUrl: string;
  successReturnPath: string;
  cancelReturnPath: string;
}

const FALLBACK = {
  title: { en: 'Subscription Checkout', zh: '订阅结算' },
  summaryTitle: { en: 'Subscription details', zh: '订阅结算信息' },
  product: { en: 'Product', zh: '您订阅的产品' },
  plan: { en: 'Plan', zh: '套餐' },
  period: { en: 'Billing period', zh: '付款周期' },
  amount: { en: 'Amount due now', zh: '当前需付款金额' },
  confirm: { en: 'Confirm payment', zh: '确认支付' },
  total: { en: 'Total due', zh: '应付合计' },
  payment: { en: 'Payment Method', zh: '支付方式' },
  paymentLoading: { en: 'Loading...', zh: '加载中…' },
  billing: { en: 'Billing Address', zh: '账单地址' },
  billingHint: {
    en: 'Add a billing address before paying.',
    zh: '请先添加账单地址后再支付。',
  },
  addBilling: { en: 'Add billing address', zh: '添加账单地址' },
  addressLoading: { en: 'Loading addresses...', zh: '正在加载地址...' },
  pay: { en: 'Pay now', zh: '去支付' },
  backToShop: { en: 'Back to shop', zh: '返回商城' },
  empty: {
    en: 'No subscription item to checkout. Please select a plan on the product page.',
    zh: '暂无订阅结算项，请从订阅商品页选择方案后再试。',
  },
  auth: { en: 'Please login first', zh: '请先登录' },
  login: { en: 'Sign in', zh: '登录' },
};

export function resolveSubscriptionCheckoutSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): SubscriptionCheckoutSectionMeta {
  const meta = metadata || {};
  const header = resolveHeader(meta, locale, {
    title: pickLocalePair(locale, FALLBACK.title.en, FALLBACK.title.zh),
  });

  return {
    title: header.title,
    summaryTitle: strMeta(
      meta.summary_title ?? meta.summaryTitle,
      pickLocalePair(locale, FALLBACK.summaryTitle.en, FALLBACK.summaryTitle.zh)
    ),
    productLabel: strMeta(
      meta.product_label ?? meta.productLabel,
      pickLocalePair(locale, FALLBACK.product.en, FALLBACK.product.zh)
    ),
    planLabel: strMeta(
      meta.plan_label ?? meta.planLabel,
      pickLocalePair(locale, FALLBACK.plan.en, FALLBACK.plan.zh)
    ),
    periodLabel: strMeta(
      meta.period_label ?? meta.periodLabel,
      pickLocalePair(locale, FALLBACK.period.en, FALLBACK.period.zh)
    ),
    amountLabel: strMeta(
      meta.amount_label ?? meta.amountLabel,
      pickLocalePair(locale, FALLBACK.amount.en, FALLBACK.amount.zh)
    ),
    confirmTitle: strMeta(
      meta.confirm_title ?? meta.confirmTitle,
      pickLocalePair(locale, FALLBACK.confirm.en, FALLBACK.confirm.zh)
    ),
    totalLabel: strMeta(
      meta.total_label ?? meta.totalLabel,
      pickLocalePair(locale, FALLBACK.total.en, FALLBACK.total.zh)
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
    backToShopLabel: strMeta(
      meta.back_to_shop_label ?? meta.backToShopLabel,
      pickLocalePair(locale, FALLBACK.backToShop.en, FALLBACK.backToShop.zh)
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
    shopUrl: strMeta(meta.shop_url ?? meta.shopUrl, '/product'),
    addressesUrl: strMeta(meta.addresses_url ?? meta.addressesUrl, '/dashboard#addresses'),
    successReturnPath: strMeta(
      meta.success_return_path ?? meta.successReturnPath,
      '/subscriptioncheckout?status=success&session_id={CHECKOUT_SESSION_ID}'
    ),
    cancelReturnPath: strMeta(
      meta.cancel_return_path ?? meta.cancelReturnPath,
      '/subscriptioncheckout?status=cancel'
    ),
  };
}

export async function loadSubscriptionCheckoutSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
