/**
 * PageHeader — 面包屑 + 页标题 + 描述（列表页等系统页可联动 URL 筛选）
 */

import {
  getBlogListLabels,
  loadBlogListPageHeader,
  parseBlogListQuery,
} from './articleList';
import { resolveHeader } from '../components/sections/resolvers/_shared';
import { getTranslationByLocale as getI18nText, type TranslationKey } from './translations';

export interface PageHeaderBreadcrumbItem {
  label: string;
  href: string | null;
  current: boolean;
}

export interface PageHeaderSectionData {
  title: string;
  description: string;
  keywords: string;
  breadcrumbs: PageHeaderBreadcrumbItem[];
  showTitle: boolean;
  showDescription: boolean;
}

export interface PageHeaderSeoFallback {
  title: string;
  description: string;
  keywords: string;
}

interface BreadcrumbMetaItem {
  label?: string;
  label_key?: string;
  href?: string;
  current?: boolean;
}

function resolveBreadcrumbLabel(
  item: BreadcrumbMetaItem,
  locale: string
): string {
  if (typeof item.label === 'string' && item.label.trim()) return item.label.trim();
  const key = typeof item.label_key === 'string' ? item.label_key.trim() : '';
  if (key) {
    const text = getI18nText(locale, key as TranslationKey);
    if (text) return text;
  }
  return '';
}

function parseBreadcrumbItems(
  metadata: Record<string, unknown>,
  locale: string
): PageHeaderBreadcrumbItem[] {
  const breadcrumb = (metadata.breadcrumb || {}) as {
    items?: BreadcrumbMetaItem[];
  };
  const raw = Array.isArray(breadcrumb.items) ? breadcrumb.items : [];
  if (!raw.length) return [];

  return raw
    .map((item, index) => {
      const label = resolveBreadcrumbLabel(item, locale);
      if (!label) return null;
      const href =
        typeof item.href === 'string' && item.href.trim() ? item.href.trim() : null;
      const isLast = index === raw.length - 1;
      const current = item.current === true || (isLast && !href);
      return { label, href: current ? null : href, current };
    })
    .filter((item): item is PageHeaderBreadcrumbItem => item !== null);
}

function defaultBloglistBreadcrumbs(locale: string): PageHeaderBreadcrumbItem[] {
  const labels = getBlogListLabels(locale);
  return [
    { label: labels.home, href: '/', current: false },
    { label: labels.blog, href: null, current: true },
  ];
}

function defaultProductListBreadcrumbs(locale: string): PageHeaderBreadcrumbItem[] {
  return [
    { label: getI18nText(locale, 'breadcrumb_home'), href: '/', current: false },
    {
      label: getI18nText(locale, 'our_products_section_title'),
      href: null,
      current: true,
    },
  ];
}

async function applyListTaxonomyHeader(
  pageUrl: URL,
  locale: string,
  tenantId: string,
  title: string,
  description: string,
  keywords: string,
  breadcrumbs: PageHeaderBreadcrumbItem[]
): Promise<{
  title: string;
  description: string;
  keywords: string;
  breadcrumbs: PageHeaderBreadcrumbItem[];
}> {
  const query = parseBlogListQuery(pageUrl);
  const hasTaxonomyFilter = query.categoryIds.length > 0 || query.tagIds.length > 0;
  if (!hasTaxonomyFilter || !tenantId?.trim()) {
    return { title, description, keywords, breadcrumbs };
  }

  const labels = getBlogListLabels(locale);
  const taxonomyHeader = await loadBlogListPageHeader(query, locale, tenantId, labels);
  return {
    title: taxonomyHeader.title,
    description: taxonomyHeader.description,
    keywords: taxonomyHeader.keywords,
    breadcrumbs: withCurrentBreadcrumbLabel(breadcrumbs, taxonomyHeader.title),
  };
}

function withCurrentBreadcrumbLabel(
  items: PageHeaderBreadcrumbItem[],
  label: string
): PageHeaderBreadcrumbItem[] {
  if (!items.length) {
    return [{ label, href: null, current: true }];
  }
  return items.map((item, index) => {
    if (index !== items.length - 1) return item;
    return { label, href: null, current: true };
  });
}

function boolMeta(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

export async function loadPageHeaderSection(
  locale: string,
  tenantId: string,
  metadata: Record<string, unknown> | undefined,
  pageUrl: URL,
  seoFallback?: PageHeaderSeoFallback
): Promise<PageHeaderSectionData> {
  const meta = metadata || {};
  const header = resolveHeader(meta, locale, {
    title: seoFallback?.title ?? '',
    subtitle: seoFallback?.description ?? '',
  });

  let title = header.title || seoFallback?.title || '';
  let description = header.subtitle || seoFallback?.description || '';
  let keywords = seoFallback?.keywords ?? title;

  let breadcrumbs = parseBreadcrumbItems(meta, locale);
  const context = String(meta.context ?? meta.page_context ?? '').trim().toLowerCase();
  const listPath = String(meta.list_path ?? meta.listPath ?? '/bloglist').trim() || '/bloglist';
  const path = pageUrl.pathname.replace(/\/$/, '') || '/';
  const normalizedListPath = listPath.replace(/\/$/, '') || '/bloglist';

  const isArticleDetailContext =
    context === 'article' ||
    context === 'postsingle' ||
    /^\/article\d*-[^/]+/i.test(path);

  const isProductDetailContext =
    context === 'productsingle' ||
    /^\/productsingle\d*-[^/]+/i.test(path) ||
    /^\/shopsingle-/i.test(path);

  const isProductListContext =
    !isProductDetailContext &&
    (context === 'product' || normalizedListPath === '/product' || path === '/product');

  const isBloglistContext =
    !isArticleDetailContext &&
    !isProductListContext &&
    !isProductDetailContext &&
    (context === 'bloglist' || normalizedListPath === '/bloglist' || path === '/bloglist');

  const isDetailContext = isArticleDetailContext || isProductDetailContext;
  const showTitle = boolMeta(meta.show_title ?? meta.showTitle, !isDetailContext);
  const showDescription = boolMeta(
    meta.show_description ?? meta.showDescription,
    !isDetailContext
  );

  if (isBloglistContext) {
    if (!breadcrumbs.length) breadcrumbs = defaultBloglistBreadcrumbs(locale);
    const next = await applyListTaxonomyHeader(
      pageUrl,
      locale,
      tenantId,
      title,
      description,
      keywords,
      breadcrumbs
    );
    title = next.title;
    description = next.description;
    keywords = next.keywords;
    breadcrumbs = next.breadcrumbs;
  }

  if (isProductListContext) {
    if (!breadcrumbs.length) breadcrumbs = defaultProductListBreadcrumbs(locale);
    const next = await applyListTaxonomyHeader(
      pageUrl,
      locale,
      tenantId,
      title,
      description,
      keywords,
      breadcrumbs
    );
    title = next.title;
    description = next.description;
    keywords = next.keywords;
    breadcrumbs = next.breadcrumbs;
  }

  if (isProductDetailContext) {
    const productListLabel = getI18nText(locale, 'our_products_section_title');
    if (!breadcrumbs.length) {
      breadcrumbs = [
        { label: getI18nText(locale, 'breadcrumb_home'), href: '/', current: false },
        { label: productListLabel, href: listPath || '/product', current: false },
      ];
    } else {
      breadcrumbs = breadcrumbs.map((item) =>
        item.current ? { ...item, current: false } : item
      );
    }

    const productTitle = seoFallback?.title?.trim() || title;
    title = productTitle;
    description = seoFallback?.description?.trim() || description;
    keywords = seoFallback?.keywords?.trim() || keywords;
    breadcrumbs = [
      ...breadcrumbs,
      { label: productTitle, href: null, current: true },
    ];
  }

  if (isArticleDetailContext) {
    const labels = getBlogListLabels(locale);
    if (!breadcrumbs.length) {
      breadcrumbs = [
        { label: labels.home, href: '/', current: false },
        { label: labels.blog, href: listPath, current: false },
      ];
    } else {
      breadcrumbs = breadcrumbs.map((item) =>
        item.current ? { ...item, current: false } : item
      );
    }

    const articleTitle = seoFallback?.title?.trim() || title;
    title = articleTitle;
    description = seoFallback?.description?.trim() || description;
    keywords = seoFallback?.keywords?.trim() || keywords;
    breadcrumbs = [
      ...breadcrumbs,
      { label: articleTitle, href: null, current: true },
    ];
  }

  return { title, description, keywords, breadcrumbs, showTitle, showDescription };
}
