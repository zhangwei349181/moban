/**
 * cart 组件 HTML 模板注入
 */

import type { CartSectionMeta } from '../components/sections/resolvers/cart';

export interface CartClientConfig {
  checkoutUrl: string;
  continueShoppingUrl: string;
  productPageCode: string;
}

export interface RenderCartSectionOptions {
  meta: CartSectionMeta;
  templateShell: string | null;
  clientConfig: CartClientConfig;
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

export function renderCartSectionHtml(options: RenderCartSectionOptions): string {
  const { meta, templateShell, clientConfig } = options;
  if (!templateShell) return '';

  let html = expandConditionalBlocks(templateShell, {
    CART_HAS_TITLE: Boolean(meta.title),
  });

  return applyTemplate(html, {
    CART_TITLE: escapeHtml(meta.title),
    CART_PRODUCT_LABEL: escapeHtml(meta.productLabel),
    CART_PRICE_LABEL: escapeHtml(meta.priceLabel),
    CART_QUANTITY_LABEL: escapeHtml(meta.quantityLabel),
    CART_SUBTOTAL_LABEL: escapeHtml(meta.subtotalLabel),
    CART_SHIPPING_LABEL: escapeHtml(meta.shippingLabel),
    CART_TAX_LABEL: escapeHtml(meta.taxLabel),
    CART_SUMMARY_TITLE: escapeHtml(meta.summaryTitle),
    CART_SUBTOTAL_SUMMARY_LABEL: escapeHtml(meta.subtotalSummaryLabel),
    CART_SHIPPING_SUMMARY_LABEL: escapeHtml(meta.shippingSummaryLabel),
    CART_TAX_SUMMARY_LABEL: escapeHtml(meta.taxSummaryLabel),
    CART_TOTAL_LABEL: escapeHtml(meta.totalLabel),
    CART_EMPTY_MESSAGE: escapeHtml(meta.emptyMessage),
    CART_CONTINUE_SHOPPING_LABEL: escapeHtml(meta.continueShoppingLabel),
    CART_CONTINUE_SHOPPING_URL: escapeHtml(meta.continueShoppingUrl),
    CART_CHECKOUT_LABEL: escapeHtml(meta.checkoutLabel),
    CART_CHECKOUT_URL: escapeHtml(meta.checkoutUrl),
    CART_CONFIG_JSON: escapeHtmlAttr(JSON.stringify(clientConfig)),
  });
}
