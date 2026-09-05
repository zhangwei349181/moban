/**
 * 页面表字段 `type`：决定用哪套页面壳。与组件 `type` 无关。
 */

export const PAGE_TYPES = ['general', 'list', 'postsingle', 'productsingle'] as const;

export type PageType = (typeof PAGE_TYPES)[number];

export function normalizePageType(raw: unknown): PageType | null {
  const t = String(raw ?? '').trim().toLowerCase();
  if (t === 'general' || t === 'list' || t === 'postsingle' || t === 'productsingle') {
    return t;
  }
  return null;
}

/** 表字段优先；旧数据才读 metadata.page_type。缺省 general。 */
export function resolvePageType(page: {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
} | null | undefined): PageType {
  const fromField = normalizePageType(page?.type);
  if (fromField) return fromField;

  const meta = page?.metadata;
  if (meta && typeof meta === 'object') {
    const fromMeta = normalizePageType(meta.page_type ?? meta.pageType);
    if (fromMeta) return fromMeta;
  }

  return 'general';
}

export function isListPageType(type: unknown): boolean {
  return normalizePageType(type) === 'list';
}

export function isPostSinglePageType(type: unknown): boolean {
  return normalizePageType(type) === 'postsingle';
}

export function isProductSinglePageType(type: unknown): boolean {
  return normalizePageType(type) === 'productsingle';
}
