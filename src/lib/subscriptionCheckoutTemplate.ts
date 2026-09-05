/**
 * subscription checkout 组件 HTML 模板注入
 */

import type { SubscriptionCheckoutSectionMeta } from '../components/sections/resolvers/subscriptionCheckout';

export interface SubscriptionCheckoutClientConfig {
  loginUrl: string;
  shopUrl: string;
  addressesUrl: string;
  successReturnPath: string;
  cancelReturnPath: string;
}

export interface RenderSubscriptionCheckoutSectionOptions {
  meta: SubscriptionCheckoutSectionMeta;
  templateShell: string | null;
  clientConfig: SubscriptionCheckoutClientConfig;
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

export function renderSubscriptionCheckoutSectionHtml(
  options: RenderSubscriptionCheckoutSectionOptions
): string {
  const { meta, templateShell, clientConfig } = options;
  if (!templateShell) return '';

  let html = expandConditionalBlocks(templateShell, {
    SUBCHECKOUT_HAS_TITLE: Boolean(meta.title),
  });

  return applyTemplate(html, {
    SUBCHECKOUT_TITLE: escapeHtml(meta.title),
    SUBCHECKOUT_SUMMARY_TITLE: escapeHtml(meta.summaryTitle),
    SUBCHECKOUT_PRODUCT_LABEL: escapeHtml(meta.productLabel),
    SUBCHECKOUT_PLAN_LABEL: escapeHtml(meta.planLabel),
    SUBCHECKOUT_PERIOD_LABEL: escapeHtml(meta.periodLabel),
    SUBCHECKOUT_AMOUNT_LABEL: escapeHtml(meta.amountLabel),
    SUBCHECKOUT_CONFIRM_TITLE: escapeHtml(meta.confirmTitle),
    SUBCHECKOUT_TOTAL_LABEL: escapeHtml(meta.totalLabel),
    SUBCHECKOUT_PAYMENT_TITLE: escapeHtml(meta.paymentTitle),
    SUBCHECKOUT_PAYMENT_LOADING_LABEL: escapeHtml(meta.paymentLoadingLabel),
    SUBCHECKOUT_BILLING_TITLE: escapeHtml(meta.billingTitle),
    SUBCHECKOUT_BILLING_HINT: escapeHtml(meta.billingHint),
    SUBCHECKOUT_ADD_BILLING_LABEL: escapeHtml(meta.addBillingLabel),
    SUBCHECKOUT_ADDRESS_LOADING_LABEL: escapeHtml(meta.addressLoadingLabel),
    SUBCHECKOUT_PAY_LABEL: escapeHtml(meta.payLabel),
    SUBCHECKOUT_BACK_TO_SHOP_LABEL: escapeHtml(meta.backToShopLabel),
    SUBCHECKOUT_EMPTY_MESSAGE: escapeHtml(meta.emptyMessage),
    SUBCHECKOUT_AUTH_MESSAGE: escapeHtml(meta.authMessage),
    SUBCHECKOUT_LOGIN_LABEL: escapeHtml(meta.loginLabel),
    SUBCHECKOUT_LOGIN_URL: escapeHtml(meta.loginUrl),
    SUBCHECKOUT_SHOP_URL: escapeHtml(meta.shopUrl),
    SUBCHECKOUT_ADDRESSES_URL: escapeHtml(meta.addressesUrl),
    SUBCHECKOUT_CONFIG_JSON: escapeHtmlAttr(JSON.stringify(clientConfig)),
  });
}
