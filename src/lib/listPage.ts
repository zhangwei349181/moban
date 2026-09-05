/**
 * 列表页（bloglist / product / 任意 page_code）共用逻辑
 */

import type { PageComponentSlot } from './pageComponents';
import { loadCmsPageViewModel, type CmsPageViewModel } from './cmsPage';
import { loadPageHeaderSection, type PageHeaderSectionData } from './pageHeaderSection';
import { getSystemPageSeoDefaults } from './pageMetadata';
import { isPostListComponentType, isPostListSectionCode } from './postListComponentCode';
import { isPageHeaderSlot } from './pageHeaderComponentCode';
import { isListFilterComponentType, isListFilterSectionCode } from './listFilterComponentCode';
import { isLayoutSectionCode } from './layoutComponentCode';
import { filterPageBodySlots } from './pageBodySlots';
import { isPageFooterChromeSlot, isPageHeaderChromeSlot } from './pageChromeSlots';
import { resolvePageMainClass } from './pageFrame';

export const PRODUCT_ARTICLE_TYPES =
  'product,subscription_product,crowdfunding_product,wholesale_product,group_product,finance_product';

export type ListPageSeoKey = 'bloglist' | 'product';

export interface ListPageDefaults {
  listPath: string;
  pageHeaderMeta: Record<string, unknown>;
  listFilterMeta: Record<string, unknown>;
  postListMeta: Record<string, unknown>;
  seoKey: ListPageSeoKey | null;
  mainClass: string;
}

export interface ListPageSlots {
  headerSlots: PageComponentSlot[];
  pageheaderSlots: PageComponentSlot[];
  listfilterSlots: PageComponentSlot[];
  postlistSlots: PageComponentSlot[];
  bodySlots: PageComponentSlot[];
  footerSlots: PageComponentSlot[];
}

export interface ListPageModel {
  pageCode: string;
  locale: string;
  cms: CmsPageViewModel;
  defaults: ListPageDefaults;
  headerSlots: PageComponentSlot[];
  pageheaderSlots: PageComponentSlot[];
  listfilterSlots: PageComponentSlot[];
  postlistSlots: PageComponentSlot[];
  bodySlots: PageComponentSlot[];
  footerSlots: PageComponentSlot[];
  pageHeaderSeoFallback: { title: string; description: string; keywords: string };
  pageHeaderData: PageHeaderSectionData;
}

const LIST_PAGE_MAIN_CLASS = '';

const KNOWN_LIST_PAGE_CODES = new Set(['bloglist', 'product']);

const BLOG_LIST_PAGEHEADER: Record<string, unknown> = {
  bare: true,
  context: 'bloglist',
  breadcrumb: {
    items: [
      { label_key: 'breadcrumb_home', href: '/' },
      { label_key: 'new_blog_section_title', current: true },
    ],
  },
};

const BLOG_LIST_LISTFILTER: Record<string, unknown> = {
  bare: true,
  show_categories: true,
  show_tags: true,
  show_attributes: false,
  show_price_filter: false,
  category_type: 'article',
  tag_type: 'article',
};

const BLOG_LIST_POSTLIST: Record<string, unknown> = {
  bare: true,
  article_limit: 9,
  show_filter_chips: false,
};

const PRODUCT_LIST_PAGEHEADER: Record<string, unknown> = {
  bare: true,
  context: 'product',
  breadcrumb: {
    items: [
      { label_key: 'breadcrumb_home', href: '/' },
      { label_key: 'our_products_section_title', current: true },
    ],
  },
};

const PRODUCT_LIST_LISTFILTER: Record<string, unknown> = {
  bare: true,
  show_categories: true,
  show_tags: true,
  show_attributes: true,
  show_price_filter: true,
  category_type: 'product',
  tag_type: 'product',
  price_field_key: 'price',
};

const PRODUCT_LIST_POSTLIST: Record<string, unknown> = {
  bare: true,
  article_limit: 12,
  show_filter_chips: false,
  article_type: PRODUCT_ARTICLE_TYPES,
  path_url: '/productsingle-{id}',
};

function withListPath(meta: Record<string, unknown>, listPath: string): Record<string, unknown> {
  return { ...meta, list_path: listPath };
}

function resolveListPath(
  pageCode: string,
  metadata: Record<string, unknown> = {},
  urlPath?: string
): string {
  const fromMeta = metadata.list_path ?? metadata.listPath;
  if (typeof fromMeta === 'string' && fromMeta.trim()) {
    const path = fromMeta.trim();
    return path.startsWith('/') ? path : `/${path}`;
  }
  if (urlPath) {
    const path = urlPath.split('?')[0].replace(/\/$/, '') || `/${pageCode}`;
    return path || `/${pageCode}`;
  }
  return `/${pageCode}`;
}

function isListFilterSlot(slot: PageComponentSlot): boolean {
  return isListFilterComponentType(slot.componentType) || isListFilterSectionCode(slot.normalizedCode);
}

function isPostListSlot(slot: PageComponentSlot): boolean {
  return isPostListComponentType(slot.componentType) || isPostListSectionCode(slot.normalizedCode);
}

/** @deprecated 路由请用页面 type=list；仅 SEO 默认文案仍认 bloglist / product */
export function isKnownListPageCode(pageCode: string): boolean {
  return KNOWN_LIST_PAGE_CODES.has(pageCode);
}

export function resolveListPageDefaults(
  pageCode: string,
  metadata: Record<string, unknown> = {},
  urlPath?: string
): ListPageDefaults {
  const listPath = resolveListPath(pageCode, metadata, urlPath);
  const mainClass = resolvePageMainClass(metadata, LIST_PAGE_MAIN_CLASS);

  if (pageCode === 'bloglist') {
    return {
      seoKey: 'bloglist',
      mainClass,
      listPath,
      pageHeaderMeta: withListPath(BLOG_LIST_PAGEHEADER, listPath),
      listFilterMeta: withListPath(BLOG_LIST_LISTFILTER, listPath),
      postListMeta: withListPath(BLOG_LIST_POSTLIST, listPath),
    };
  }

  if (pageCode === 'product') {
    return {
      seoKey: 'product',
      mainClass,
      listPath,
      pageHeaderMeta: withListPath(PRODUCT_LIST_PAGEHEADER, listPath),
      listFilterMeta: withListPath(PRODUCT_LIST_LISTFILTER, listPath),
      postListMeta: withListPath(PRODUCT_LIST_POSTLIST, listPath),
    };
  }

  const context = String(metadata.context ?? metadata.page_context ?? pageCode);
  const categoryType = String(metadata.category_type ?? metadata.categoryType ?? 'article');
  const tagType = String(metadata.tag_type ?? metadata.tagType ?? categoryType);
  const isProductList =
    categoryType === 'product' ||
    metadata.list_kind === 'product' ||
    metadata.listKind === 'product';

  return {
    seoKey: null,
    mainClass,
    listPath,
    pageHeaderMeta: withListPath(
      {
        bare: true,
        context,
        breadcrumb: {
          items: [
            { label_key: 'breadcrumb_home', href: '/' },
            { label: context, current: true },
          ],
        },
      },
      listPath
    ),
    listFilterMeta: withListPath(
      {
        bare: true,
        show_categories: metadata.show_categories !== false,
        show_tags: metadata.show_tags !== false,
        show_attributes: isProductList,
        show_price_filter: isProductList,
        category_type: categoryType,
        tag_type: tagType,
        ...(isProductList ? { price_field_key: 'price' } : {}),
      },
      listPath
    ),
    postListMeta: withListPath(
      {
        bare: true,
        article_limit: Number(metadata.article_limit) || 9,
        show_filter_chips: false,
        ...(isProductList ? { article_type: PRODUCT_ARTICLE_TYPES } : {}),
      },
      listPath
    ),
  };
}

export function splitListPageSlots(pageComponents: PageComponentSlot[]): ListPageSlots {
  const headerSlots = pageComponents.filter(isPageHeaderChromeSlot);
  const pageheaderSlots = pageComponents.filter(isPageHeaderSlot);
  const listfilterSlots = pageComponents.filter(isListFilterSlot);
  const postlistSlots = pageComponents.filter(isPostListSlot);
  const bodySlots = pageComponents.filter(
    (s) =>
      !isPageHeaderChromeSlot(s) &&
      !isPageFooterChromeSlot(s) &&
      !isPostListSlot(s) &&
      !isPageHeaderSlot(s) &&
      !isListFilterSlot(s) &&
      !isLayoutSectionCode(s.normalizedCode)
  );
  const footerSlots = pageComponents.filter(isPageFooterChromeSlot);

  return {
    headerSlots,
    pageheaderSlots,
    listfilterSlots,
    postlistSlots,
    bodySlots: filterPageBodySlots(bodySlots),
    footerSlots,
  };
}

function resolveListPageSeoDefaults(pageCode: string, locale: string) {
  if (pageCode === 'bloglist' || pageCode === 'product') {
    return getSystemPageSeoDefaults(locale, pageCode);
  }
  return {
    title: pageCode,
    description: '',
    keywords: pageCode,
  };
}

export async function buildListPageModel(
  cms: CmsPageViewModel,
  locale: string,
  tenantId: string,
  url: URL
): Promise<ListPageModel> {
  const pageMeta = (cms.pageData?.page?.metadata || {}) as Record<string, unknown>;
  const defaults = resolveListPageDefaults(cms.pageCode, pageMeta, url.pathname);
  const slots = splitListPageSlots(cms.pageComponents);

  const pageHeaderSeoFallback = {
    title: cms.seo.title,
    description: cms.seo.description,
    keywords: cms.seo.keywords,
  };
  const pageHeaderMeta =
    slots.pageheaderSlots.length > 0
      ? { ...defaults.pageHeaderMeta, ...slots.pageheaderSlots[0].effectiveMetadata }
      : defaults.pageHeaderMeta;
  const pageHeaderData =
    slots.pageheaderSlots.length > 0
      ? await loadPageHeaderSection(
          locale,
          tenantId,
          pageHeaderMeta,
          url,
          pageHeaderSeoFallback
        )
      : {
          title: cms.seo.title,
          description: cms.seo.description || cms.seo.title,
          keywords: cms.seo.keywords,
          breadcrumbs: [],
          showTitle: false,
          showDescription: false,
        };

  return {
    pageCode: cms.pageCode,
    locale,
    cms,
    defaults,
    ...slots,
    pageHeaderSeoFallback,
    pageHeaderData,
  };
}

export async function loadListPageModel(
  pageCode: string,
  locale: string,
  tenantId: string,
  url: URL
): Promise<ListPageModel> {
  const seoDefaults = resolveListPageSeoDefaults(pageCode, locale);
  const pageMeta = {} as Record<string, unknown>;
  const mainClassFallback = resolveListPageDefaults(pageCode, pageMeta, url.pathname).mainClass;
  const cms = await loadCmsPageViewModel(pageCode, locale, tenantId, seoDefaults, url, { mainClassFallback });
  return buildListPageModel(cms, locale, tenantId, url);
}
