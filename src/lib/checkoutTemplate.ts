/**
 * checkout 组件 HTML 模板注入
 */

import type { CheckoutSectionMeta } from '../components/sections/resolvers/checkout';

export interface CheckoutClientConfig {
  loginUrl: string;
  cartUrl: string;
  addressesUrl: string;
  successReturnPath: string;
  cancelReturnPath: string;
}

export interface RenderCheckoutSectionOptions {
  meta: CheckoutSectionMeta;
  templateShell: string | null;
  clientConfig: CheckoutClientConfig;
}

function escapeHtml(value: string | null | undefined): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function applyTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.split(`{{${key}}}`).join(value),
    template
  );
}

const BLOCK_PATTERN = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

function expandConditionalBlocks(
  template: string,
  conditions: Record<string, boolean>
): string {
  let html = template;
  for (let pass = 0; pass < 16; pass += 1) {
    let changed = false;
    html = html.replace(BLOCK_PATTERN, (match, tag, body) => {
      if (!(tag in conditions)) return match;
      changed = true;
      return conditions[tag] ? body : '';
    });
    if (!changed) break;
  }
  return html;
}

export function renderCheckoutSectionHtml(options: RenderCheckoutSectionOptions): string {
  const { meta, templateShell, clientConfig } = options;
  if (!templateShell) return '';

  let html = expandConditionalBlocks(templateShell, {
    CHECKOUT_HAS_TITLE: Boolean(meta.title),
  });

  return applyTemplate(html, {
    CHECKOUT_TITLE: escapeHtml(meta.title),
    CHECKOUT_ORDER_SUMMARY_TITLE: escapeHtml(meta.orderSummaryTitle),
    CHECKOUT_PRODUCT_LABEL: escapeHtml(meta.productLabel),
    CHECKOUT_PRICE_LABEL: escapeHtml(meta.priceLabel),
    CHECKOUT_QUANTITY_LABEL: escapeHtml(meta.quantityLabel),
    CHECKOUT_SUBTOTAL_LABEL: escapeHtml(meta.subtotalLabel),
    CHECKOUT_SUMMARY_TITLE: escapeHtml(meta.summaryTitle),
    CHECKOUT_SUBTOTAL_SUMMARY_LABEL: escapeHtml(meta.subtotalSummaryLabel),
    CHECKOUT_SHIPPING_SUMMARY_LABEL: escapeHtml(meta.shippingSummaryLabel),
    CHECKOUT_TAX_SUMMARY_LABEL: escapeHtml(meta.taxSummaryLabel),
    CHECKOUT_TOTAL_LABEL: escapeHtml(meta.totalLabel),
    CHECKOUT_SETTLE_CURRENCY_LABEL: escapeHtml(meta.settleCurrencyLabel),
    CHECKOUT_PAYMENT_TITLE: escapeHtml(meta.paymentTitle),
    CHECKOUT_PAYMENT_LOADING_LABEL: escapeHtml(meta.paymentLoadingLabel),
    CHECKOUT_BILLING_TITLE: escapeHtml(meta.billingTitle),
    CHECKOUT_BILLING_HINT: escapeHtml(meta.billingHint),
    CHECKOUT_ADD_BILLING_LABEL: escapeHtml(meta.addBillingLabel),
    CHECKOUT_ADDRESS_LOADING_LABEL: escapeHtml(meta.addressLoadingLabel),
    CHECKOUT_PAY_LABEL: escapeHtml(meta.payLabel),
    CHECKOUT_BACK_TO_CART_LABEL: escapeHtml(meta.backToCartLabel),
    CHECKOUT_EMPTY_MESSAGE: escapeHtml(meta.emptyMessage),
    CHECKOUT_AUTH_MESSAGE: escapeHtml(meta.authMessage),
    CHECKOUT_LOGIN_LABEL: escapeHtml(meta.loginLabel),
    CHECKOUT_LOGIN_URL: escapeHtml(meta.loginUrl),
    CHECKOUT_CART_URL: escapeHtml(meta.cartUrl),
    CHECKOUT_ADDRESSES_URL: escapeHtml(meta.addressesUrl),
    CHECKOUT_CONFIG_JSON: escapeHtmlAttr(JSON.stringify(clientConfig)),
  });
}
