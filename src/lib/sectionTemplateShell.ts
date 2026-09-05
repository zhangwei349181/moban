/**
 * 识别「区块模板壳」（含 {{PRODUCT_SINGLE_*}} 等占位符），避免被当作静态 HTML 二次输出
 */

import { resolveComponentsHtmlDisplay } from '../components/sections/resolvers/componentsHtml';
import { isProductSingleSectionCode } from './productSingleComponentCode';
import { isPostSingleSectionCode } from './postSingleComponentCode';

const PRODUCT_SINGLE_TEMPLATE_RE =
  /\{\{#PRODUCT_SINGLE_|\{\{PRODUCT_SINGLE_|\{\{PRODUCT_FIELD_/i;
const POST_SINGLE_TEMPLATE_RE =
  /\{\{#POST_SINGLE_|\{\{POST_SINGLE_|\{\{POST_FIELD_/i;

export function looksLikeSectionTemplateShell(
  html: string | null | undefined,
  kind: 'productsingle' | 'postsingle' = 'productsingle'
): boolean {
  if (!html?.trim()) return false;
  const re = kind === 'productsingle' ? PRODUCT_SINGLE_TEMPLATE_RE : POST_SINGLE_TEMPLATE_RE;
  return re.test(html);
}

/**
 * 产品详情页应走 ProductSingle 的槽位：
 * - components_code 为 productsingle / shopsingle
 * - 或误配为 postsingle 但 html_url / 内联 html 指向 productsingle 模板壳
 */
export function isProductSingleDetailSlot(
  normalizedCode: string,
  metadata: Record<string, unknown> | undefined,
  locale: string
): boolean {
  if (isProductSingleSectionCode(normalizedCode)) return true;
  return (
    isPostSingleSectionCode(normalizedCode) &&
    metadataUsesSectionTemplateShell(metadata, locale, 'productsingle')
  );
}

export function metadataUsesSectionTemplateShell(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  kind: 'productsingle' | 'postsingle' = 'productsingle'
): boolean {
  const display = resolveComponentsHtmlDisplay(metadata, locale);
  if (looksLikeSectionTemplateShell(display.html, kind)) return true;

  const url = String(display.htmlUrl || '').toLowerCase();
  if (!url) return false;

  if (kind === 'productsingle') {
    return /productsingle|shopsingle/.test(url);
  }
  return /postsingle|blogsingle/.test(url);
}
