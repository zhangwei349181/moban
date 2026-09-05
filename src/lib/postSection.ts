/**
 * 首页 Blog Section — 服务端拉取最新文章
 */

import {
  fetchArticlesSimpleContent,
  searchArticleIds,
  type SearchArticlesParams,
} from './articleSearch';
import { getTranslationByLocale as getI18nText, type TranslationKey } from './translations';

const DEFAULT_ARTICLE_TYPES = 'article,novel,tutorial,news,blog';
const DEFAULT_LIMIT = 8;
const PLACEHOLDER_IMAGE = '/images/opai-img-313.png';

/** 详情页走 /productsingle-{id} 的文章类型 */
export const PRODUCT_DETAIL_ARTICLE_TYPES = new Set([
  'product',
  'subscription_product',
  'crowdfunding_product',
  'wholesale_product',
  'group_product',
  'finance_product',
]);

export function buildArticleDetailHref(id: string, articleType: string | undefined): string {
  const type = normalizeArticleType(articleType).toLowerCase();
  if (PRODUCT_DETAIL_ARTICLE_TYPES.has(type)) return `/productsingle-${id}`;
  return `/article-${id}`;
}

/**
 * 按 metadata path_url 生成文章详情链接（优先级高于 article_type 默认规则）。
 * 支持占位符 `{id}`、`{article_id}`；或以 `/`、`-` 结尾的前缀路径（自动拼接 id）。
 */
export function buildArticleHrefFromPathUrl(id: string, pathUrl: string): string {
  const template = pathUrl.trim();
  if (!template || !id) return buildArticleDetailHref(id, undefined);

  if (/\{article_id\}|\{id\}/i.test(template)) {
    return template.replace(/\{article_id\}/gi, id).replace(/\{id\}/gi, id);
  }

  if (template.endsWith('/') || template.endsWith('-')) {
    return `${template}${id}`;
  }

  return `${template.replace(/\/$/, '')}/${id}`;
}

export function buildPostSectionItemHref(
  id: string,
  articleType: string | undefined,
  pathUrl?: string
): string {
  const custom = pathUrl?.trim();
  if (custom) return buildArticleHrefFromPathUrl(id, custom);
  return buildArticleDetailHref(id, articleType);
}

/** API article_type 可能为 string / number，避免非字符串 .trim() 抛错 */
export function normalizeArticleType(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw).trim();
  return '';
}

/** 模板展示用：subscription_product → subscription product */
export function formatArticleTypeLabel(articleType: string): string {
  return articleType.replace(/_/g, ' ');
}

const PUBLISH_STATUS_I18N_KEYS: Record<string, TranslationKey> = {
  recommended: 'publish_status_recommended',
  pinned: 'publish_status_pinned',
  'special offer': 'publish_status_special_offer',
  featured: 'publish_status_featured',
};

export interface PostSectionItem {
  id: string;
  title: string;
  summary: string;
  price: string;
  articleType: string;
  /** template_fields 键名 slug → 展示用字符串（供 {{POST_FIELD_*}} 使用） */
  templateFields: Record<string, string>;
  href: string;
  image: string;
  imageAlt: string;
  date: string;
  datetime: string;
  tags: string[];
  /** 商品所属分类 ID，供全局折扣分类乘数使用 */
  categoryIds: string[];
  /** 列表页：作者展示名 */
  authorName?: string;
  /** 列表页：发布状态角标 */
  badge?: string | null;
}

export interface LoadPostSectionItemsOptions {
  limit?: number;
  articleTypes?: string;
  categoryIds?: string[];
  tagIds?: string[];
  publishStatus?: string;
  contentTitle?: string;
  attributeCodes?: string[];
  attributeValueIds?: string[];
  metadataTemplateFieldKey?: string;
  metadataTemplateFieldValueMin?: string;
  metadataTemplateFieldValueMax?: string;
  sortByTemplateFieldKey?: string;
  sortOrder?: 'asc' | 'desc';
  /** 内容模板 ID，逗号分隔；未配置则不按模板筛 */
  templateId?: string;
  /** 文章详情路径模板；未配置时按 article_type 走 /article-{id} 或 /productsingle-{id} */
  pathUrl?: string;
}

export interface PostSectionGroup {
  id: string;
  label: string;
  posts: PostSectionItem[];
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

function fieldKeyToSlug(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function templateFieldToDisplayValue(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (Array.isArray(raw)) {
    return raw
      .filter((v) => v != null && String(v).trim())
      .map((v) => String(v).trim())
      .join(', ');
  }
  return '';
}

export function normalizeTemplateFields(
  fields: Record<string, unknown> | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fields) return out;
  for (const [key, value] of Object.entries(fields)) {
    const slug = fieldKeyToSlug(key);
    if (!slug) continue;
    out[slug] = templateFieldToDisplayValue(value);
  }
  return out;
}

export interface TemplateFieldEntry {
  /** 原始 template_fields key */
  key: string;
  /** slug（占位符 `{{POST_SINGLE_FIELD_<slug>}}`） */
  slug: string;
  value: string;
}

/** 主表 metadata.template_fields → 带原始 key 的条目列表 */
export function buildTemplateFieldEntries(
  fields: Record<string, unknown> | undefined
): TemplateFieldEntry[] {
  if (!fields) return [];
  const entries: TemplateFieldEntry[] = [];
  for (const [key, value] of Object.entries(fields)) {
    const slug = fieldKeyToSlug(key);
    const display = templateFieldToDisplayValue(value);
    if (!slug || !display) continue;
    entries.push({ key, slug, value: display });
  }
  return entries;
}

function uniqueCategoryIds(raw: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const id = typeof item === 'string' ? item.trim() : String(item ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function collectPostCategoryIds(data: Record<string, unknown>, queryIds?: string[]): string[] {
  const fromArticle = Array.isArray(data.categories) ? data.categories : [];
  return uniqueCategoryIds([...fromArticle, ...(queryIds || [])]);
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

function buildBlogSearchParams(options: LoadPostSectionItemsOptions): SearchArticlesParams {
  const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 24) : DEFAULT_LIMIT;
  const searchParams: SearchArticlesParams = {
    article_type: options.articleTypes?.trim() || DEFAULT_ARTICLE_TYPES,
    status: 'published',
    page: 1,
    page_size: limit,
  };

  if (options.categoryIds?.length) searchParams.category_ids = options.categoryIds;
  if (options.tagIds?.length) searchParams.tag_ids = options.tagIds;

  const publishStatus = options.publishStatus?.trim();
  if (publishStatus) searchParams.publish_status = publishStatus;

  const contentTitle = options.contentTitle?.trim();
  if (contentTitle) searchParams.content_title = contentTitle;

  if (options.attributeCodes?.length) searchParams.attribute_codes = options.attributeCodes;
  if (options.attributeValueIds?.length) searchParams.attribute_value_ids = options.attributeValueIds;

  const fieldKey = options.metadataTemplateFieldKey?.trim();
  if (fieldKey) {
    searchParams.metadata_template_field_key = fieldKey;
    const min = options.metadataTemplateFieldValueMin?.trim();
    const max = options.metadataTemplateFieldValueMax?.trim();
    if (min) searchParams.metadata_template_field_value_min = min;
    if (max) searchParams.metadata_template_field_value_max = max;
  }

  const sortKey = options.sortByTemplateFieldKey?.trim();
  if (sortKey) searchParams.sort_by_template_field_key = sortKey;
  if (options.sortOrder === 'asc' || options.sortOrder === 'desc') {
    searchParams.sort_order = options.sortOrder;
  }

  const templateId = options.templateId?.trim();
  if (templateId) searchParams.template_id = templateId;

  return searchParams;
}

export async function loadPostSectionItems(
  locale: string,
  tenantId: string,
  options: LoadPostSectionItemsOptions = {}
): Promise<PostSectionItem[]> {
  if (!tenantId?.trim()) return [];

  try {
    const searchParams = buildBlogSearchParams(options);

    const idsResponse = await searchArticleIds(searchParams, tenantId);
    if (!idsResponse.success || !idsResponse.data?.ids?.length) return [];

    const articles = await fetchArticlesSimpleContent(idsResponse.data.ids, locale, tenantId);

    return articles.flatMap((article) => {
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

      const normalizedFields = normalizeTemplateFields(templateFields);

      return [
        {
          id,
          title,
          summary: normalizeSummary(data.summary),
          price: getTemplateFieldPrice(templateFields),
          articleType,
          templateFields: normalizedFields,
          href: buildPostSectionItemHref(id, articleType, options.pathUrl),
          image: getArticleImage(templateFields),
          imageAlt: title,
          date,
          datetime,
          tags: badge ? [badge] : [],
          categoryIds: collectPostCategoryIds(data as Record<string, unknown>, options.categoryIds),
        },
      ];
    });
  } catch (error) {
    console.error('[postSection] load posts failed:', error);
    return [];
  }
}

export async function loadPostSectionGroups(
  locale: string,
  tenantId: string,
  groups: Array<{ id: string; label: string; query: LoadPostSectionItemsOptions }>
): Promise<PostSectionGroup[]> {
  if (!tenantId?.trim() || !groups.length) return [];

  const results = await Promise.all(
    groups.map(async (group) => ({
      id: group.id,
      label: group.label,
      posts: await loadPostSectionItems(locale, tenantId, group.query),
    }))
  );
  return results;
}
