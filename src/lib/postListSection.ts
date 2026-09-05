/**
 * PostList 列表页区块 — 分页拉取文章 + 分类/标签筛选
 */

import {
  fetchArticlesSimpleContent,
  searchArticleIds,
  type SearchArticlesParams,
} from './articleSearch';
import { fetchArticleMain } from './product';
import { fetchUserProfile } from './product';
import {
  buildBlogListHref,
  loadBlogListFilters,
  type BlogListQuery,
} from './articleList';
import { resolveListPageQuery } from './listFilterQuery';
import { parsePostQueryFromMeta } from '../components/sections/resolvers/post';
import type { BlogListFilterItem, BlogListPageLink } from './articleList';
import {
  buildPostSectionItemHref,
  collectPostCategoryIds,
  normalizeArticleType,
  normalizeTemplateFields,
  PRODUCT_DETAIL_ARTICLE_TYPES,
  type PostSectionItem,
} from './postSection';
import { getTranslationByLocale as getI18nText, type TranslationKey } from './translations';

const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 24;
const PLACEHOLDER_IMAGE = '/images/opai-img-313.png';

const PUBLISH_STATUS_I18N_KEYS: Record<string, TranslationKey> = {
  recommended: 'publish_status_recommended',
  pinned: 'publish_status_pinned',
  'special offer': 'publish_status_special_offer',
  featured: 'publish_status_featured',
};

export interface PostListSectionItem extends PostSectionItem {
  authorName: string;
  badge: string | null;
}

export interface PostListSectionData {
  posts: PostListSectionItem[];
  filters: BlogListFilterItem[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageLinks: BlogListPageLink[];
  prevHref: string | null;
  nextHref: string | null;
  empty: boolean;
  error: boolean;
  listBasePath: string;
}

function parsePageSize(value: unknown, fallback = DEFAULT_PAGE_SIZE): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, MAX_PAGE_SIZE);
}

export function resolvePostListBasePath(metadata: Record<string, unknown> | undefined): string {
  const raw =
    metadata?.list_path ??
    metadata?.listPath ??
    metadata?.base_path ??
    metadata?.basePath ??
    '/bloglist';
  const path = String(raw).trim() || '/bloglist';
  return path.startsWith('/') ? path : `/${path}`;
}

/** 合并 URL 查询与 metadata 默认查询（URL 优先） */
export function resolvePostListQuery(
  url: URL,
  metadata: Record<string, unknown> | undefined
): BlogListQuery {
  return resolveListPageQuery(url, metadata);
}

function formatPublishBadge(publishStatus: string | undefined, locale: string): string | null {
  if (!publishStatus || publishStatus === 'draft') return null;
  const key = PUBLISH_STATUS_I18N_KEYS[publishStatus.toLowerCase()];
  if (!key) return null;
  const label = getI18nText(locale, key);
  const normal = getI18nText(locale, 'publish_status_normal');
  if (!label || label === normal) return null;
  return label;
}

function formatArticleDate(dateStr: string | undefined, locale: string): { date: string; datetime: string } {
  if (!dateStr) return { date: '', datetime: '' };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { date: dateStr, datetime: '' };
  return {
    date: d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
    datetime: d.toISOString(),
  };
}

function normalizeSummary(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function looksLikeProductList(articleTypes: string): boolean {
  return articleTypes
    .split(',')
    .some((type) => PRODUCT_DETAIL_ARTICLE_TYPES.has(type.trim().toLowerCase()));
}

async function loadCategoryIdsByArticle(
  articleIds: string[],
  tenantId: string
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!articleIds.length) return map;
  const mains = await Promise.all(
    articleIds.map((id) => fetchArticleMain(id, tenantId).catch(() => null))
  );
  for (const main of mains) {
    const articleId = main?.data?.article?.id;
    if (!articleId) continue;
    const cats = Array.isArray(main.data.categories)
      ? main.data.categories.map((id) => String(id).trim()).filter(Boolean)
      : [];
    map.set(articleId, cats);
  }
  return map;
}

function getTemplateFieldPrice(templateFields: Record<string, unknown> | undefined): string {
  const raw = templateFields?.price;
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return String(raw).trim();
}

function getArticleImage(templateFields: Record<string, unknown> | undefined): string {
  const raw =
    templateFields?.thumbnails ??
    templateFields?.['Showcase Gallery'] ??
    templateFields?.['showcase gallery'];
  if (!Array.isArray(raw) || !raw.length) return PLACEHOLDER_IMAGE;
  const u = raw[0];
  if (
    typeof u === 'string' &&
    u.trim() &&
    (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
  ) {
    return u.trim();
  }
  return PLACEHOLDER_IMAGE;
}

function buildPageLinks(
  query: BlogListQuery,
  currentPage: number,
  totalPages: number,
  basePath: string
): BlogListPageLink[] {
  if (totalPages <= 1) return [];

  const links: BlogListPageLink[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    links.push({ page: 1, href: buildBlogListHref(query, 1, basePath), active: false });
    if (startPage > 2) {
      links.push({ page: 0, href: '#', active: false, ellipsis: true });
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    links.push({
      page: i,
      href: buildBlogListHref({ ...query, page: i }, i, basePath),
      active: i === currentPage,
    });
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      links.push({ page: 0, href: '#', active: false, ellipsis: true });
    }
    links.push({
      page: totalPages,
      href: buildBlogListHref(query, totalPages, basePath),
      active: false,
    });
  }

  return links;
}

async function resolveAuthorNames(
  authorIds: string[],
  tenantId: string,
  unknownLabel: string
): Promise<Map<string, string>> {
  const unique = [...new Set(authorIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => {
      try {
        const profile = await fetchUserProfile(id, tenantId);
        const name = profile.data?.user?.display_name?.trim();
        return [id, name || unknownLabel] as const;
      } catch {
        return [id, unknownLabel] as const;
      }
    })
  );
  return new Map(entries);
}

function buildSearchParams(
  metadata: Record<string, unknown>,
  query: BlogListQuery,
  pageSize: number
): SearchArticlesParams {
  const metaQuery = parsePostQueryFromMeta(metadata);
  const searchParams: SearchArticlesParams = {
    article_type: metaQuery.articleTypes?.trim() || 'article,novel,tutorial,news,blog',
    status: 'published',
    page: query.page,
    page_size: pageSize,
  };

  if (query.categoryIds.length) searchParams.category_ids = query.categoryIds;
  if (query.tagIds.length) searchParams.tag_ids = query.tagIds;

  if (query.attributeValueIds?.length) {
    searchParams.attribute_value_ids = query.attributeValueIds;
  } else if (metaQuery.attributeValueIds?.length) {
    searchParams.attribute_value_ids = metaQuery.attributeValueIds;
  }

  if (query.attributeCodes?.length) {
    searchParams.attribute_codes = query.attributeCodes;
  } else if (metaQuery.attributeCodes?.length) {
    searchParams.attribute_codes = metaQuery.attributeCodes;
  }

  const priceMin = query.priceMin?.trim();
  const priceMax = query.priceMax?.trim();
  if (priceMin || priceMax) {
    const fieldKey =
      query.priceFieldKey?.trim() || metaQuery.metadataTemplateFieldKey?.trim() || 'price';
    searchParams.metadata_template_field_key = fieldKey;
    if (priceMin) searchParams.metadata_template_field_value_min = priceMin;
    if (priceMax) searchParams.metadata_template_field_value_max = priceMax;
  } else {
    const fieldKey = metaQuery.metadataTemplateFieldKey?.trim();
    if (fieldKey) {
      searchParams.metadata_template_field_key = fieldKey;
      const min = metaQuery.metadataTemplateFieldValueMin?.trim();
      const max = metaQuery.metadataTemplateFieldValueMax?.trim();
      if (min) searchParams.metadata_template_field_value_min = min;
      if (max) searchParams.metadata_template_field_value_max = max;
    }
  }

  const publishStatus = metaQuery.publishStatus?.trim();
  if (publishStatus) searchParams.publish_status = publishStatus;

  const contentTitle = metaQuery.contentTitle?.trim();
  if (contentTitle) searchParams.content_title = contentTitle;

  const sortKey = metaQuery.sortByTemplateFieldKey?.trim();
  if (sortKey) searchParams.sort_by_template_field_key = sortKey;
  if (metaQuery.sortOrder === 'asc' || metaQuery.sortOrder === 'desc') {
    searchParams.sort_order = metaQuery.sortOrder;
  }

  const templateId = metaQuery.templateId?.trim();
  if (templateId) searchParams.template_id = templateId;

  return searchParams;
}

export async function loadPostListSection(
  locale: string,
  tenantId: string,
  metadata: Record<string, unknown> | undefined,
  pageUrl: URL
): Promise<PostListSectionData> {
  const meta = metadata || {};
  const listBasePath = resolvePostListBasePath(meta);
  const query = resolvePostListQuery(pageUrl, meta);
  const pageSize = parsePageSize(meta.article_limit ?? meta.limit ?? meta.page_size, DEFAULT_PAGE_SIZE);
  const authorUnknown = getI18nText(locale, 'author_unknown');

  const empty: PostListSectionData = {
    posts: [],
    filters: [],
    total: 0,
    currentPage: query.page,
    totalPages: 0,
    pageLinks: [],
    prevHref: null,
    nextHref: null,
    empty: true,
    error: false,
    listBasePath,
  };

  if (!tenantId?.trim()) {
    return { ...empty, error: true, empty: false };
  }

  try {
    const showFilterChips = meta.show_filter_chips !== false && meta.showFilterChips !== false;
    const filters = showFilterChips
      ? await loadBlogListFilters(query, locale, tenantId, listBasePath)
      : [];
    const searchParams = buildSearchParams(meta, query, pageSize);
    const pathUrl = parsePostQueryFromMeta(meta).pathUrl;

    const idsResponse = await searchArticleIds(searchParams, tenantId);
    if (!idsResponse.success || !idsResponse.data?.ids?.length) {
      return { ...empty, filters, empty: true };
    }

    const total = idsResponse.data.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(query.page, totalPages);

    const articles = await fetchArticlesSimpleContent(idsResponse.data.ids, locale, tenantId);
    const metaQuery = parsePostQueryFromMeta(meta);
    const categoryById = looksLikeProductList(metaQuery.articleTypes || '')
      ? await loadCategoryIdsByArticle(idsResponse.data.ids, tenantId)
      : new Map<string, string[]>();
    const authorIds = articles
      .map((a) => a.data?.metadata?.author_membership_id as string | undefined)
      .filter((id): id is string => Boolean(id));
    const authorMap = await resolveAuthorNames(authorIds, tenantId, authorUnknown);

    const posts: PostListSectionItem[] = articles.flatMap((article) => {
      const data = article?.data;
      if (!data) return [];

      const templateFields = (data.metadata?.template_fields || {}) as Record<string, unknown>;
      const title = data.title?.trim() || '';
      const id = String(data.article_id || data.id || '').trim();
      if (!id) return [];

      const articleType = normalizeArticleType(data.article_type);
      const dateSrc = data.created_at || data.updated_at || '';
      const { date, datetime } = formatArticleDate(dateSrc, locale);
      const badge = formatPublishBadge(data.publish_status, locale);
      const authorId = data.metadata?.author_membership_id as string | undefined;

      return [
        {
          id,
          title,
          summary: normalizeSummary(data.summary),
          price: getTemplateFieldPrice(templateFields),
          articleType,
          templateFields: normalizeTemplateFields(templateFields),
          href: buildPostSectionItemHref(id, articleType, pathUrl),
          image: getArticleImage(templateFields),
          imageAlt: title,
          date,
          datetime,
          tags: badge ? [badge] : [],
          categoryIds: collectPostCategoryIds(
            { categories: categoryById.get(id) || [] },
            query.categoryIds
          ),
          authorName: (authorId && authorMap.get(authorId)) || authorUnknown,
          badge,
        },
      ];
    });

    const pageLinks = buildPageLinks(query, currentPage, totalPages, listBasePath);
    const prevHref = currentPage > 1 ? buildBlogListHref(query, currentPage - 1, listBasePath) : null;
    const nextHref =
      currentPage < totalPages ? buildBlogListHref(query, currentPage + 1, listBasePath) : null;

    return {
      posts,
      filters,
      total,
      currentPage,
      totalPages,
      pageLinks,
      prevHref,
      nextHref,
      empty: posts.length === 0,
      error: false,
      listBasePath,
    };
  } catch (error) {
    console.error('[postListSection] load failed:', error);
    return { ...empty, error: true, empty: false };
  }
}
