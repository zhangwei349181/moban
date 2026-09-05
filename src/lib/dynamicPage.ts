/**
 * 通用动态页面：按 page_code 校验与规范化。正文由关联组件渲染，不从页面 metadata 拉 MD。
 */

export const PAGE_CODE_RE = /^[a-zA-Z0-9]+$/;

export function normalizeDynamicPageCode(slug: string | undefined): string {
  if (!slug) return '';
  const segment = slug.split('/').filter(Boolean)[0] || '';
  return segment.trim();
}

export function isValidPageCode(pageCode: string): boolean {
  return PAGE_CODE_RE.test(pageCode);
}
