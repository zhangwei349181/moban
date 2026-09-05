/**
 * wishlist 组件 HTML 模板注入
 */

import type { WishlistSectionMeta } from '../components/sections/resolvers/wishlist';

export interface WishlistClientConfig {
  continueShoppingUrl: string;
  productPageCode: string;
}

export interface RenderWishlistSectionOptions {
  meta: WishlistSectionMeta;
  templateShell: string | null;
  clientConfig: WishlistClientConfig;
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

export function renderWishlistSectionHtml(options: RenderWishlistSectionOptions): string {
  const { meta, templateShell, clientConfig } = options;
  if (!templateShell) return '';

  let html = expandConditionalBlocks(templateShell, {
    WISHLIST_HAS_TITLE: Boolean(meta.title),
    WISHLIST_HAS_DESCRIPTION: Boolean(meta.description),
    WISHLIST_HAS_HEADER: Boolean(meta.title || meta.description),
  });

  return applyTemplate(html, {
    WISHLIST_TITLE: escapeHtml(meta.title),
    WISHLIST_DESCRIPTION: escapeHtml(meta.description),
    WISHLIST_PRODUCTS_LABEL: escapeHtml(meta.productsLabel),
    WISHLIST_EMPTY_TITLE: escapeHtml(meta.emptyTitle),
    WISHLIST_EMPTY_DESCRIPTION: escapeHtml(meta.emptyDescription),
    WISHLIST_CONTINUE_SHOPPING_LABEL: escapeHtml(meta.continueShoppingLabel),
    WISHLIST_CONTINUE_SHOPPING_URL: escapeHtml(meta.continueShoppingUrl),
    WISHLIST_LOADING_LABEL: escapeHtml(meta.loadingLabel),
    WISHLIST_ERROR_LABEL: escapeHtml(meta.errorLabel),
    WISHLIST_GRID_ICON_URL: escapeHtml(meta.gridIconUrl),
    WISHLIST_LIST_ICON_URL: escapeHtml(meta.listIconUrl),
    WISHLIST_CONFIG_JSON: escapeHtmlAttr(JSON.stringify(clientConfig)),
  });
}
