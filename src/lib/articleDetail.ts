/**
 * 文章详情页 — 服务端数据聚合
 */

import {
  fetchArticleContent,
  fetchArticleMain,
  fetchCategory,
  fetchTag,
  fetchUserProfile,
  type ArticleContentSeo,
  type CategoryData,
  type TagData,
  type Translation,
} from './product';
import { resolveEntityLocalizedName } from './entityLocalized';
import { renderMarkdownToHtml } from './markdown';
import { normalizeArticleType, normalizeTemplateFields, buildTemplateFieldEntries, type TemplateFieldEntry } from './postSection';

export interface ArticleDetailTag {
  id: string;
  name: string;
  href: string;
}

export interface ArticleDetailCategory {
  id: string;
  name: string;
  href: string;
}

export interface ArticleDetailAuthor {
  displayName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  initial: string;
}

export interface ArticleDetailMetadataBlock {
  key: string;
  html: string;
}

export interface ArticleDetailViewModel {
  /** 页面展示标题（正文 title，用于 h1 / 面包屑） */
  title: string;
  /** Layout <title>：优先 seo.meta_title，否则同 title */
  metaTitle: string;
  /** meta description：优先 seo.meta_description → summary → title */
  description: string;
  /** meta keywords：优先 seo.meta_keywords → template_fields */
  keywords?: string;
  dateLine: string;
  publishedIso: string;
  images: string[];
  mainContentHtml: string;
  metadataBlocks: ArticleDetailMetadataBlock[];
  tags: ArticleDetailTag[];
  categories: ArticleDetailCategory[];
  author: ArticleDetailAuthor | null;
  /** 主表 metadata.template_fields 归一化（slug → 展示字符串） */
  templateFields: Record<string, string>;
  templateFieldEntries: TemplateFieldEntry[];
  summary: string;
  price: string;
  articleType: string;
}

function resolveTagDisplay(tag: TagData, locale: string): ArticleDetailTag | null {
  const id = tag.data?.tag?.id;
  if (!id) return null;
  const entity = tag.data.tag;
  const name = resolveEntityLocalizedName(
    entity?.name || '',
    (entity as { primary_language?: string }).primary_language,
    tag.data.translations,
    locale,
    'name'
  );
  return { id, name, href: `/bloglist?tag_ids=${id}` };
}

function resolveCategoryDisplay(category: CategoryData, locale: string): ArticleDetailCategory | null {
  const id = category.data?.category?.id;
  if (!id) return null;
  const entity = category.data.category;
  const name = resolveEntityLocalizedName(
    entity?.name || '',
    (entity as { primary_language?: string }).primary_language,
    category.data.translations,
    locale,
    'name'
  );
  return { id, name, href: `/bloglist?category_ids=${id}` };
}

const TEMPLATE_FIELD_KEYWORD_KEYS = ['Keywords', 'Keyword', 'keywords', 'keyword'] as const;

/** content.metadata 里的迁移旧 ID，不是给读者看的正文 */
const HIDDEN_METADATA_KEYS = new Set(['oldid', 'old_id', 'old-id']);
const UUID_VALUE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDisplayableMetadataEntry(key: string, value: unknown): boolean {
  if (value == null) return false;
  const text = String(value).trim();
  if (!text) return false;
  if (HIDDEN_METADATA_KEYS.has(key.trim().toLowerCase())) return false;
  if (UUID_VALUE_RE.test(text)) return false;
  return true;
}

/** 从 article 主数据 template_fields 读取 SEO 关键词 */
function resolveTemplateFieldKeywords(
  templateFields: Record<string, unknown> | undefined
): string | undefined {
  if (!templateFields) return undefined;

  for (const key of TEMPLATE_FIELD_KEYWORD_KEYS) {
    const raw = templateFields[key];
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

  return undefined;
}

function plainMetaText(input: string): string {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 生成 SEO description（纯文本，过长截断） */
function resolveSeoDescription(summary: string | undefined, title: string): string {
  const raw = summary?.trim();
  if (!raw) return title;
  const plain = plainMetaText(raw);
  if (!plain) return title;
  return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain;
}

function resolveMetaKeywordsValue(metaKeywords: string | string[] | undefined): string | undefined {
  if (metaKeywords == null) return undefined;
  if (typeof metaKeywords === 'string') {
    const text = metaKeywords.trim();
    return text || undefined;
  }
  if (Array.isArray(metaKeywords)) {
    const text = metaKeywords
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .join(', ');
    return text || undefined;
  }
  return undefined;
}

/** 解析 Layout 用 SEO：content.seo 优先，否则回退 summary / template_fields */
function resolveArticlePageSeo(
  seo: ArticleContentSeo | undefined,
  summary: string | undefined,
  displayTitle: string,
  templateFields: Record<string, unknown> | undefined
): { metaTitle: string; description: string; keywords?: string } {
  const metaTitle = seo?.meta_title?.trim() || displayTitle;

  let description: string;
  if (seo?.meta_description?.trim()) {
    const plain = plainMetaText(seo.meta_description);
    description = plain.length > 160 ? `${plain.slice(0, 157)}...` : plain || displayTitle;
  } else {
    description = resolveSeoDescription(summary, displayTitle);
  }

  const keywords =
    resolveMetaKeywordsValue(seo?.meta_keywords) ??
    resolveTemplateFieldKeywords(templateFields);

  return { metaTitle, description, keywords };
}

function formatDateLine(
  dateStr: string | undefined,
  locale: string,
  authorName: string
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const formatted = date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `BY ${authorName.toUpperCase()}, ${formatted.toUpperCase()}`;
}

function normalizeSummary(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getTemplateFieldPrice(templateFields: Record<string, unknown> | undefined): string {
  const raw = templateFields?.price;
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return String(raw).trim();
}

export async function loadArticleDetailViewModel(
  articleId: string,
  locale: string,
  tenantId: string
): Promise<ArticleDetailViewModel | null> {
  if (!articleId?.trim() || !tenantId?.trim()) return null;

  try {
    const [mainData, contentData] = await Promise.all([
      fetchArticleMain(articleId, tenantId),
      fetchArticleContent(articleId, locale, tenantId),
    ]);

    const article = mainData.data.article;
    const categoryIds = mainData.data.categories ?? [];
    const tagIds = mainData.data.tags ?? [];

    const authorId =
      (article as { author?: { id?: string } }).author?.id ||
      (article.metadata as { author_membership_id?: string })?.author_membership_id;

    const [authorProfile, ...related] = await Promise.all([
      authorId
        ? fetchUserProfile(authorId, tenantId).catch(() => null)
        : Promise.resolve(null),
      ...categoryIds.map((id) => fetchCategory(id, tenantId).catch(() => null)),
      ...tagIds.map((id) => fetchTag(id, tenantId).catch(() => null)),
    ]);

    const categoryResults = related.slice(0, categoryIds.length) as (CategoryData | null)[];
    const tagResults = related.slice(categoryIds.length) as (TagData | null)[];

    const authorUser = authorProfile?.data?.user;
    const author: ArticleDetailAuthor | null = authorUser
      ? {
          displayName: authorUser.display_name || '',
          email: authorUser.email || '',
          phone: authorUser.phone || '',
          avatarUrl: authorUser.avatar_url || '',
          initial: (authorUser.display_name || 'A').charAt(0).toUpperCase(),
        }
      : null;

    const authorName = author?.displayName || 'ADMIN';
    const publishedAt =
      (article as { timestamps?: { published_at?: string; created_at?: string } }).timestamps
        ?.published_at ||
      (article as { timestamps?: { created_at?: string } }).timestamps?.created_at;

    const gallery =
      article.metadata?.template_fields?.['Showcase Gallery'] ||
      article.metadata?.template_fields?.['showcase gallery'] ||
      [];
    const images = Array.isArray(gallery) ? gallery.filter((src) => typeof src === 'string' && src.trim()) : [];

    const rawTemplateFields = (article.metadata?.template_fields || {}) as Record<
      string,
      unknown
    >;
    const templateFields = normalizeTemplateFields(rawTemplateFields);
    const templateFieldEntries = buildTemplateFieldEntries(rawTemplateFields);

    const title = contentData.data.title?.trim() || 'Article';
    const summary = normalizeSummary(contentData.data.summary);
    const price = templateFields.price || getTemplateFieldPrice(rawTemplateFields);
    const articleType = normalizeArticleType(
      (article as { article_type?: unknown }).article_type
    );
    const pageSeo = resolveArticlePageSeo(
      contentData.data.seo,
      contentData.data.summary,
      title,
      rawTemplateFields
    );
    const mainContentHtml = contentData.data.content
      ? renderMarkdownToHtml(String(contentData.data.content))
      : '';

    const metadata = contentData.data.metadata || {};
    const metadataBlocks: ArticleDetailMetadataBlock[] = Object.entries(metadata)
      .filter(([key, value]) => isDisplayableMetadataEntry(key, value))
      .map(([key, value]) => ({
        key,
        html: renderMarkdownToHtml(String(value)),
      }));

    const tags = tagResults
      .map((t) => (t ? resolveTagDisplay(t, locale) : null))
      .filter((t): t is ArticleDetailTag => Boolean(t));

    const categories = categoryResults
      .map((c) => (c ? resolveCategoryDisplay(c, locale) : null))
      .filter((c): c is ArticleDetailCategory => Boolean(c));

    return {
      title,
      metaTitle: pageSeo.metaTitle,
      description: pageSeo.description,
      keywords: pageSeo.keywords,
      dateLine: formatDateLine(publishedAt, locale, authorName),
      publishedIso: publishedAt || '',
      images,
      mainContentHtml,
      metadataBlocks,
      tags,
      categories,
      author,
      templateFields,
      templateFieldEntries,
      summary,
      price,
      articleType,
    };
  } catch (error) {
    console.error('[articleDetail] load failed:', articleId, error);
    return null;
  }
}
