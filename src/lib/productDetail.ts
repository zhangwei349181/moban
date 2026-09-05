/**
 * 产品详情页 — 服务端数据聚合（复用 articleDetail，校验产品类型）
 */

import { loadArticleDetailViewModel, type ArticleDetailViewModel } from './articleDetail';
import { PRODUCT_DETAIL_ARTICLE_TYPES } from './postSection';

export type ProductDetailViewModel = ArticleDetailViewModel;

export async function loadProductDetailViewModel(
  articleId: string,
  locale: string,
  tenantId: string
): Promise<ProductDetailViewModel | null> {
  const view = await loadArticleDetailViewModel(articleId, locale, tenantId);
  if (!view) return null;
  if (!PRODUCT_DETAIL_ARTICLE_TYPES.has(view.articleType)) {
    return null;
  }
  return view;
}
