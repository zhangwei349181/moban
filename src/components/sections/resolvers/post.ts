import {
  normalizeAssetUrl,
  pickLocalized,
  resolveCta,
  resolveHeader,
  strMeta,
  type TranslationRow,
} from './_shared';
import {
  loadComponentsHtmlShell,
} from './componentsHtml';
import type { LoadPostSectionItemsOptions } from '../../../lib/postSection';

const DEFAULT_ARTICLE_TYPES = 'article,novel,tutorial,news,blog';

/** 区块 metadata：标题、CTA（文章查询见 groups / 根级查询字段） */
export interface PostSectionMeta {
  title: string;
  cta: { label: string; href: string };
  articleLimit: number;
  articleTypes: string;
  categoryIds: string[];
  tagIds: string[];
  publishStatus: string;
  contentTitle: string;
  attributeCodes: string[];
  attributeValueIds: string[];
  metadataTemplateFieldKey: string;
  metadataTemplateFieldValueMin: string;
  metadataTemplateFieldValueMax: string;
  sortByTemplateFieldKey: string;
  sortOrder: 'asc' | 'desc' | '';
  templateId: string;
}

/** 单组文章查询（tab / 数据组） */
export interface PostSectionGroupMeta {
  id: string;
  label: string;
  query: LoadPostSectionItemsOptions;
}

const FALLBACK_CTA_EN = { label: 'Read more articles', href: '/bloglist' };
const FALLBACK_CTA_ZH = { label: '阅读更多文章', href: '/bloglist' };

const FALLBACK_TITLE_EN = 'Stay informed, stay ahead';
const FALLBACK_TITLE_ZH = '保持资讯领先';

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 24);
}

function parseIdList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function optionalStrMeta(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function parseSortOrder(value: unknown): 'asc' | 'desc' | '' {
  const s = String(value ?? '').trim().toLowerCase();
  if (s === 'asc' || s === 'desc') return s;
  return '';
}

/** 从 metadata 对象解析文章查询参数（根级或 tabs[] 单项均可） */
export function parsePostQueryFromMeta(
  meta: Record<string, unknown>,
  fallbacks: Partial<LoadPostSectionItemsOptions> = {}
): LoadPostSectionItemsOptions {
  const sort = parseSortOrder(meta.sort_order ?? meta.sortOrder);
  const fbSort = fallbacks.sortOrder;
  return {
    limit: parsePositiveInt(meta.article_limit ?? meta.limit, fallbacks.limit ?? 3),
    articleTypes: strMeta(
      meta.article_type ?? meta.article_types,
      fallbacks.articleTypes ?? DEFAULT_ARTICLE_TYPES
    ),
    categoryIds: parseIdList(meta.category_ids ?? meta.categoryIds),
    tagIds: parseIdList(meta.tag_ids ?? meta.tagIds),
    publishStatus: optionalStrMeta(meta.publish_status ?? meta.publishStatus),
    contentTitle: optionalStrMeta(meta.content_title ?? meta.contentTitle),
    attributeCodes: parseIdList(meta.attribute_codes ?? meta.attributeCodes),
    attributeValueIds: parseIdList(meta.attribute_value_ids ?? meta.attributeValueIds),
    metadataTemplateFieldKey: optionalStrMeta(
      meta.metadata_template_field_key ?? meta.metadataTemplateFieldKey
    ),
    metadataTemplateFieldValueMin: optionalStrMeta(
      meta.metadata_template_field_value_min ?? meta.metadataTemplateFieldValueMin
    ),
    metadataTemplateFieldValueMax: optionalStrMeta(
      meta.metadata_template_field_value_max ?? meta.metadataTemplateFieldValueMax
    ),
    sortByTemplateFieldKey: optionalStrMeta(
      meta.sort_by_template_field_key ?? meta.sortByTemplateFieldKey
    ),
    sortOrder: sort || fbSort,
    templateId:
      parseIdList(meta.template_id ?? meta.templateId ?? meta.template_ids).join(',') ||
      optionalStrMeta(meta.template_id ?? meta.templateId) ||
      fallbacks.templateId,
    pathUrl: optionalStrMeta(meta.path_url ?? meta.pathUrl) || fallbacks.pathUrl,
  };
}

/**
 * 解析文章数据组：metadata.tabs / metadata.groups 为多组查询；
 * 未配置时回退为单组（使用根级查询字段）。
 */
export function resolvePostSectionGroups(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PostSectionGroupMeta[] {
  const meta = metadata || {};
  const rootQuery = parsePostQueryFromMeta(meta);
  const rawTabs = meta.tabs ?? meta.groups;

  if (!Array.isArray(rawTabs) || rawTabs.length === 0) {
    return [{ id: 'default', label: '', query: rootQuery }];
  }

  return rawTabs.map((item, index) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const id = optionalStrMeta(row.id) || `tab-${index + 1}`;
    const t = pickLocalized(row.translations as TranslationRow[] | undefined, locale, [
      'label',
      'title',
    ]);
    const label =
      t.label || t.title || optionalStrMeta(row.label) || optionalStrMeta(row.title) || id;
    const query = parsePostQueryFromMeta(row, {
      limit: rootQuery.limit,
      articleTypes: rootQuery.articleTypes,
      pathUrl: rootQuery.pathUrl,
      templateId: rootQuery.templateId,
    });
    return { id, label, query };
  });
}

export function resolvePostSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PostSectionMeta {
  const zh = String(locale).split('-')[0].toLowerCase() === 'zh';
  const fbTitle = zh ? FALLBACK_TITLE_ZH : FALLBACK_TITLE_EN;
  const fbCta = zh ? FALLBACK_CTA_ZH : FALLBACK_CTA_EN;
  const meta = metadata || {};

  const header = resolveHeader(meta, locale, { title: fbTitle });
  const cta = resolveCta(meta, locale, { ...fbCta, ariaLabel: fbCta.label });
  const query = parsePostQueryFromMeta(meta);

  return {
    title: header.title,
    cta: { label: cta.label, href: normalizeAssetUrl(cta.href) || fbCta.href },
    articleLimit: query.limit ?? 3,
    articleTypes: query.articleTypes ?? DEFAULT_ARTICLE_TYPES,
    categoryIds: query.categoryIds ?? [],
    tagIds: query.tagIds ?? [],
    publishStatus: query.publishStatus ?? '',
    contentTitle: query.contentTitle ?? '',
    attributeCodes: query.attributeCodes ?? [],
    attributeValueIds: query.attributeValueIds ?? [],
    metadataTemplateFieldKey: query.metadataTemplateFieldKey ?? '',
    metadataTemplateFieldValueMin: query.metadataTemplateFieldValueMin ?? '',
    metadataTemplateFieldValueMax: query.metadataTemplateFieldValueMax ?? '',
    sortByTemplateFieldKey: query.sortByTemplateFieldKey ?? '',
    sortOrder: query.sortOrder ?? '',
    templateId: query.templateId ?? '',
  };
}

/** @deprecated 仅保留类型兼容；请使用 resolvePostSectionMeta + loadPostSectionItems */
export interface PostSectionItemDisplay {
  title: string;
  date: string;
  datetime: string;
  tags: string[];
  image: string;
  imageAlt: string;
  href: string;
}

export interface PostSectionDisplay {
  title: string;
  cta: { label: string; href: string };
  posts: PostSectionItemDisplay[];
}

export function resolvePostSectionDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PostSectionDisplay {
  const section = resolvePostSectionMeta(metadata, locale);
  return {
    title: section.title,
    cta: section.cta,
    posts: [],
  };
}

export { resolvePostClientInit } from '../../../lib/postInit';
export type { PostClientInitConfig } from '../../../lib/postInit';

/** 从 metadata.translations[].html_url（或内联 html）加载 Post 展示模板壳；没有则返回 null。 */
export async function loadPostSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
