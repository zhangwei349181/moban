/**
 * 博客列表页 — 服务端数据聚合
 */

import {
  fetchCategories,
  fetchTags,
  fetchArticlesSimpleContent,
  searchArticleIds,
  type Category,
  type SearchArticlesParams,
} from './articleSearch';
import { fetchCategory, fetchTag, fetchUserProfile } from './product';
import { resolveEntityLocalizedName, resolveTreeEntityLocalizedName } from './entityLocalized';
import {
  getTranslationByLocale as getI18nText,
  type TranslationKey,
} from './translations';

const ARTICLES_PER_PAGE = 9;
const ARTICLE_TYPES = 'article,novel,tutorial,news,blog';

export interface BlogListFilterItem {
  id: string;
  name: string;
  href: string;
  active: boolean;
}

export interface BlogListPost {
  id: string;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
  date: string;
  datetime: string;
  authorName: string;
  badge: string | null;
}

export interface BlogListPageLink {
  page: number;
  href: string;
  active: boolean;
  disabled?: boolean;
  ellipsis?: boolean;
}

export interface BlogListViewModel {
  title: string;
  description: string;
  /** meta keywords：分类/标签 metadata 中的 keywords/keyword，否则为 title */
  keywords: string;
  filters: BlogListFilterItem[];
  posts: BlogListPost[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageLinks: BlogListPageLink[];
  prevHref: string | null;
  nextHref: string | null;
  empty: boolean;
  error: boolean;
  labels: {
    home: string;
    blog: string;
    readMore: string;
    empty: string;
    error: string;
    prev: string;
    next: string;
  };
}

import {
  buildListFilterHref,
  parseListFilterQuery,
  type ListFilterQuery,
} from './listFilterQuery';

/** @deprecated 使用 ListFilterQuery；保留别名以兼容现有引用 */
export type BlogListQuery = ListFilterQuery;

export function parseBlogListQuery(url: URL): BlogListQuery {
  return parseListFilterQuery(url);
}

export function buildBlogListHref(
  query: BlogListQuery,
  page?: number,
  basePath = '/bloglist'
): string {
  return buildListFilterHref(query, page, basePath);
}

const PUBLISH_STATUS_I18N_KEYS: Record<string, TranslationKey> = {
  recommended: 'publish_status_recommended',
  pinned: 'publish_status_pinned',
  'special offer': 'publish_status_special_offer',
  featured: 'publish_status_featured',
};

export function getBlogListLabels(locale: string) {
  return {
    home: getI18nText(locale, 'breadcrumb_home'),
    blog: getI18nText(locale, 'new_blog_section_title'),
    readMore: getI18nText(locale, 'read_more'),
    empty: getI18nText(locale, 'no_articles_found'),
    error: getI18nText(locale, 'error_loading_articles'),
    prev: getI18nText(locale, 'previous'),
    next: getI18nText(locale, 'next'),
    defaultTitle: getI18nText(locale, 'blog_list_title'),
    defaultDescription: getI18nText(locale, 'blog_list_subtitle'),
    authorUnknown: getI18nText(locale, 'author_unknown'),
  };
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

function findCategoryById(categories: Category[], targetId: string): Category | null {
  for (const cat of categories) {
    if (cat.id === targetId) return cat;
    if (cat.children?.length) {
      const found = findCategoryById(cat.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildPageLinks(query: BlogListQuery, currentPage: number, totalPages: number): BlogListPageLink[] {
  if (totalPages <= 1) return [];

  const links: BlogListPageLink[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    links.push({ page: 1, href: buildBlogListHref(query, 1), active: false });
    if (startPage > 2) {
      links.push({ page: 0, href: '#', active: false, ellipsis: true });
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    links.push({
      page: i,
      href: buildBlogListHref({ ...query, page: i }, i),
      active: i === currentPage,
    });
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      links.push({ page: 0, href: '#', active: false, ellipsis: true });
    }
    links.push({
      page: totalPages,
      href: buildBlogListHref(query, totalPages),
      active: false,
    });
  }

  return links;
}

const METADATA_KEYWORD_KEYS = [
  'keywords',
  'keyword',
  'keywordes',
  'keyworde',
  'Keywords',
  'Keyword',
] as const;

/** 从分类/标签 metadata 读取 SEO 关键词，无则回退 title */
function resolveMetadataKeywords(
  metadata: Record<string, unknown> | undefined,
  fallbackTitle: string
): string {
  if (!metadata || typeof metadata !== 'object') return fallbackTitle;

  for (const key of METADATA_KEYWORD_KEYS) {
    const raw = metadata[key];
    if (raw == null) continue;

    if (typeof raw === 'string') {
      const text = raw.trim();
      if (text) return text;
      continue;
    }

    if (Array.isArray(raw)) {
      const text = raw
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .join(', ');
      if (text) return text;
    }
  }

  return fallbackTitle;
}

export async function loadBlogListPageHeader(
  query: BlogListQuery,
  locale: string,
  tenantId: string,
  labels: ReturnType<typeof getBlogListLabels>
): Promise<{ title: string; description: string; keywords: string }> {
  const categoryId = query.categoryIds[0];
  const tagId = query.tagIds[0];

  if (categoryId) {
    try {
      const res = await fetchCategory(categoryId, tenantId);
      if (res.success && res.data?.category) {
        const cat = res.data.category;
        const title = resolveEntityLocalizedName(
          cat.name || '',
          (cat as { primary_language?: string }).primary_language,
          res.data.translations,
          locale,
          'name'
        );
        return {
          title,
          description: resolveEntityLocalizedName(
            cat.description || '',
            (cat as { primary_language?: string }).primary_language,
            res.data.translations,
            locale,
            'description'
          ),
          keywords: resolveMetadataKeywords(
            (cat as { metadata?: Record<string, unknown> }).metadata,
            title
          ),
        };
      }
    } catch (e) {
      console.error('[articleList] category header failed:', e);
    }
  }

  if (tagId) {
    try {
      const res = await fetchTag(tagId, tenantId);
      if (res.success && res.data?.tag) {
        const tag = res.data.tag;
        const title = resolveEntityLocalizedName(
          tag.name || '',
          (tag as { primary_language?: string }).primary_language,
          res.data.translations,
          locale,
          'name'
        );
        return {
          title,
          description: resolveEntityLocalizedName(
            tag.description || '',
            (tag as { primary_language?: string }).primary_language,
            res.data.translations,
            locale,
            'description'
          ),
          keywords: resolveMetadataKeywords(
            (tag as { metadata?: Record<string, unknown> }).metadata,
            title
          ),
        };
      }
    } catch (e) {
      console.error('[articleList] tag header failed:', e);
    }
  }

  return {
    title: labels.defaultTitle,
    description: labels.defaultDescription,
    keywords: labels.defaultTitle,
  };
}

export async function loadBlogListFilters(
  query: BlogListQuery,
  locale: string,
  tenantId: string,
  basePath = '/bloglist'
): Promise<BlogListFilterItem[]> {
  try {
    if (query.categoryIds.length > 0) {
      const categoryId = query.categoryIds[0];
      const res = await fetchCategories(tenantId);
      if (!res.success || !res.data?.categories) return [];

      const target = findCategoryById(res.data.categories, categoryId);
      const children = target?.children?.filter(
        (c) => c.category_type === 'article' && c.status === 'active'
      );

      if (!children?.length) return [];

      return children.slice(0, 7).map((child) => ({
        id: child.id,
        name: resolveTreeEntityLocalizedName(child, locale, 'name'),
        href: buildBlogListHref({ categoryIds: [child.id], tagIds: [], page: 1 }, 1, basePath),
        active: query.categoryIds.includes(child.id),
      }));
    }

    if (query.tagIds.length > 0) {
      const res = await fetchTags(tenantId);
      if (!res.success || !res.data?.tags) return [];

      const articleTags = res.data.tags.filter(
        (t) => t.tag_type === 'article' && t.status === 'active'
      );
      const picked = shuffle(articleTags).slice(0, 7);
      const activeId = query.tagIds[0];

      return picked.map((tag) => ({
        id: tag.id,
        name: resolveTreeEntityLocalizedName(tag, locale, 'name'),
        href: buildBlogListHref({ categoryIds: [], tagIds: [tag.id], page: 1 }, 1, basePath),
        active: tag.id === activeId,
      }));
    }

    const res = await fetchCategories(tenantId);
    if (!res.success || !res.data?.categories) return [];

    const roots = res.data.categories
      .filter((c) => c.category_type === 'article' && c.level === 1 && c.status === 'active')
      .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100))
      .slice(0, 7);

    return roots.map((cat) => ({
      id: cat.id,
      name: resolveTreeEntityLocalizedName(cat, locale, 'name'),
      href: buildBlogListHref({ categoryIds: [cat.id], tagIds: [], page: 1 }, 1, basePath),
      active: false,
    }));
  } catch (e) {
    console.error('[articleList] filters failed:', e);
    return [];
  }
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

export async function loadBlogListViewModel(
  query: BlogListQuery,
  locale: string,
  tenantId: string
): Promise<BlogListViewModel> {
  const labels = getBlogListLabels(locale);
  const emptyVm = (error: boolean): BlogListViewModel => ({
    title: labels.defaultTitle,
    description: labels.defaultDescription,
    keywords: labels.defaultTitle,
    filters: [],
    posts: [],
    total: 0,
    currentPage: query.page,
    totalPages: 0,
    pageLinks: [],
    prevHref: null,
    nextHref: null,
    empty: !error,
    error,
    labels,
  });

  if (!tenantId?.trim()) {
    return emptyVm(true);
  }

  try {
    const [header, filters] = await Promise.all([
      loadBlogListPageHeader(query, locale, tenantId, labels),
      loadBlogListFilters(query, locale, tenantId),
    ]);

    const searchParams: SearchArticlesParams = {
      article_type: ARTICLE_TYPES,
      status: 'published',
      page: query.page,
      page_size: ARTICLES_PER_PAGE,
    };
    if (query.categoryIds.length) searchParams.category_ids = query.categoryIds;
    if (query.tagIds.length) searchParams.tag_ids = query.tagIds;

    const idsResponse = await searchArticleIds(searchParams, tenantId);
    if (!idsResponse.success || !idsResponse.data?.ids?.length) {
      return {
        ...emptyVm(false),
        title: header.title,
        description: header.description,
        keywords: header.keywords,
        filters,
        empty: true,
      };
    }

    const total = idsResponse.data.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE));
    const currentPage = Math.min(query.page, totalPages);

    const articles = await fetchArticlesSimpleContent(idsResponse.data.ids, locale, tenantId);
    const authorIds = articles
      .map((a) => a.data?.metadata?.author_membership_id as string | undefined)
      .filter((id): id is string => Boolean(id));
    const authorMap = await resolveAuthorNames(authorIds, tenantId, labels.authorUnknown);

    const posts: BlogListPost[] = articles.map((article) => {
      const data = article.data;
      const templateFields = data.metadata?.template_fields || {};
      const thumbs =
        templateFields.thumbnails ||
        templateFields['Showcase Gallery'] ||
        (templateFields as Record<string, unknown>)['showcase gallery'];
      const image = Array.isArray(thumbs) && thumbs[0] ? String(thumbs[0]) : '';
      const dateSrc = data.created_at || data.updated_at || '';
      const { date, datetime } = formatArticleDate(dateSrc, locale);
      const authorId = data.metadata?.author_membership_id as string | undefined;

      return {
        id: data.article_id || data.id,
        title: data.title || '',
        href: `/article-${data.article_id || data.id}`,
        image,
        imageAlt: data.title || '',
        date,
        datetime,
        authorName: (authorId && authorMap.get(authorId)) || labels.authorUnknown,
        badge: formatPublishBadge(data.publish_status, locale),
      };
    });

    const pageLinks = buildPageLinks(query, currentPage, totalPages);
    const prevHref =
      currentPage > 1 ? buildBlogListHref(query, currentPage - 1) : null;
    const nextHref =
      currentPage < totalPages ? buildBlogListHref(query, currentPage + 1) : null;

    return {
      title: header.title,
      description: header.description,
      keywords: header.keywords,
      filters,
      posts,
      total,
      currentPage,
      totalPages,
      pageLinks,
      prevHref,
      nextHref,
      empty: posts.length === 0,
      error: false,
      labels,
    };
  } catch (error) {
    console.error('[articleList] load failed:', error);
    return emptyVm(true);
  }
}
