/**
 * 详情页 URL：/{page_code}-{id}
 * 走哪套详情壳由页面表字段 type 决定，不用 page_code 名字猜测。
 */

import { isPostSinglePageType, isProductSinglePageType, type PageType } from './pageType';

export type DetailPageKind = 'postsingle' | 'productsingle';

export interface ResolvedDetailRoute {
  kind: DetailPageKind;
  pageCode: string;
}

export function normalizeDetailPageCode(code: string): string {
  return String(code || '').trim();
}

export function resolveDetailKindFromPageType(type: PageType | string | null | undefined): DetailPageKind | null {
  if (isPostSinglePageType(type)) return 'postsingle';
  if (isProductSinglePageType(type)) return 'productsingle';
  return null;
}

/** 生成详情路径，如 buildDetailPagePath('article', uuid) → /article-{uuid} */
export function buildDetailPagePath(pageCode: string, articleId: string): string {
  const code = normalizeDetailPageCode(pageCode);
  const id = String(articleId || '').trim();
  if (!code || !id) return '';
  return `/${code}-${id}`;
}
