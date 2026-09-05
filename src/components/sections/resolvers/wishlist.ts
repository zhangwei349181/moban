import { pickLocalePair, resolveHeader, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface WishlistSectionMeta {
  title: string;
  description: string;
  productsLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  continueShoppingLabel: string;
  loadingLabel: string;
  errorLabel: string;
  continueShoppingUrl: string;
  productPageCode: string;
  gridIconUrl: string;
  listIconUrl: string;
}

const FALLBACK = {
  title: { en: 'My Wishlist', zh: '我的愿望清单' },
  description: { en: 'Your favorite products', zh: '您收藏的产品' },
  products: { en: 'PRODUCTS', zh: '产品' },
  emptyTitle: { en: 'Your wishlist is empty', zh: '您的愿望清单为空' },
  emptyDescription: {
    en: 'Add products to your wishlist to see them here',
    zh: '将产品添加到愿望清单后，您将在此处看到它们',
  },
  continueShopping: { en: 'Continue Shopping', zh: '继续购物' },
  loading: { en: 'Loading...', zh: '加载中...' },
  error: { en: 'Error loading products', zh: '加载产品时出错' },
};

export function resolveWishlistSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): WishlistSectionMeta {
  const meta = metadata || {};
  const header = resolveHeader(meta, locale, {
    title: pickLocalePair(locale, FALLBACK.title.en, FALLBACK.title.zh),
    subtitle: pickLocalePair(locale, FALLBACK.description.en, FALLBACK.description.zh),
  });

  return {
    title: header.title,
    description: header.subtitle,
    productsLabel: strMeta(
      meta.products_label ?? meta.productsLabel,
      pickLocalePair(locale, FALLBACK.products.en, FALLBACK.products.zh)
    ),
    emptyTitle: strMeta(
      meta.empty_title ?? meta.emptyTitle,
      pickLocalePair(locale, FALLBACK.emptyTitle.en, FALLBACK.emptyTitle.zh)
    ),
    emptyDescription: strMeta(
      meta.empty_description ?? meta.emptyDescription,
      pickLocalePair(locale, FALLBACK.emptyDescription.en, FALLBACK.emptyDescription.zh)
    ),
    continueShoppingLabel: strMeta(
      meta.continue_shopping_label ?? meta.continueShoppingLabel,
      pickLocalePair(locale, FALLBACK.continueShopping.en, FALLBACK.continueShopping.zh)
    ),
    loadingLabel: strMeta(
      meta.loading_label ?? meta.loadingLabel,
      pickLocalePair(locale, FALLBACK.loading.en, FALLBACK.loading.zh)
    ),
    errorLabel: strMeta(
      meta.error_label ?? meta.errorLabel,
      pickLocalePair(locale, FALLBACK.error.en, FALLBACK.error.zh)
    ),
    continueShoppingUrl: strMeta(
      meta.continue_shopping_url ?? meta.continueShoppingUrl ?? meta.shop_url,
      '/product'
    ),
    productPageCode: strMeta(meta.product_page_code ?? meta.productPageCode, 'productsingle'),
    gridIconUrl: strMeta(meta.grid_icon_url ?? meta.gridIconUrl, ''),
    listIconUrl: strMeta(meta.list_icon_url ?? meta.listIconUrl, ''),
  };
}

export async function loadWishlistSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
