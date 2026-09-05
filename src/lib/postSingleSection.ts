/**
 * PostSingle 文章详情区块 — 服务端拉取单篇文章并映射为模板数据
 */

import {
  loadArticleDetailViewModel,
  type ArticleDetailAuthor,
  type ArticleDetailViewModel,
} from './articleDetail';
import { formatArticleTypeLabel, type TemplateFieldEntry } from './postSection';

export type PostSingleTemplateFieldItem = TemplateFieldEntry;

export interface PostSingleImageItem {
  src: string;
  alt: string;
  index: number;
}

export interface PostSingleTaxonomyItem {
  id: string;
  name: string;
  href: string;
}

export interface PostSingleMetadataBlock {
  key: string;
  html: string;
}

export interface PostSingleSectionData {
  title: string;
  dateLine: string;
  publishedIso: string;
  images: PostSingleImageItem[];
  mainContentHtml: string;
  metadataBlocks: PostSingleMetadataBlock[];
  tags: PostSingleTaxonomyItem[];
  categories: PostSingleTaxonomyItem[];
  author: ArticleDetailAuthor | null;
  showDate: boolean;
  showImages: boolean;
  showTags: boolean;
  showCategories: boolean;
  showAuthor: boolean;
  templateFields: Record<string, string>;
  templateFieldItems: PostSingleTemplateFieldItem[];
  summary: string;
  price: string;
  articleType: string;
  articleTypeLabel: string;
  error: boolean;
}

function boolMeta(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function resolveListPath(metadata: Record<string, unknown> | undefined): string {
  const raw =
    metadata?.list_path ??
    metadata?.listPath ??
    metadata?.base_path ??
    metadata?.basePath ??
    '/bloglist';
  const path = String(raw).trim() || '/bloglist';
  return path.startsWith('/') ? path : `/${path}`;
}

function parseExcludeFieldSlugs(metadata: Record<string, unknown>): Set<string> {
  const raw = metadata.exclude_template_fields ?? metadata.excludeTemplateFields;
  if (Array.isArray(raw)) {
    return new Set(raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean));
  }
  if (typeof raw === 'string' && raw.trim()) {
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
  }
  return new Set();
}

function filterTemplateFieldItems(
  entries: TemplateFieldEntry[],
  excludeSlugs: Set<string>
): TemplateFieldEntry[] {
  return entries.filter((item) => Boolean(item.value) && !excludeSlugs.has(item.slug));
}

function remapTaxonomyHref(
  view: ArticleDetailViewModel,
  listPath: string
): Pick<ArticleDetailViewModel, 'tags' | 'categories'> {
  return {
    tags: view.tags.map((tag) => ({
      ...tag,
      href: `${listPath}?tag_ids=${tag.id}`,
    })),
    categories: view.categories.map((cat) => ({
      ...cat,
      href: `${listPath}?category_ids=${cat.id}`,
    })),
  };
}

function mapViewToSectionData(
  view: ArticleDetailViewModel,
  metadata: Record<string, unknown>
): PostSingleSectionData {
  const listPath = resolveListPath(metadata);
  const taxonomy = remapTaxonomyHref(view, listPath);

  const showDate = boolMeta(metadata.show_date ?? metadata.showDate, true);
  const showImages = boolMeta(metadata.show_images ?? metadata.showImages, true);
  const showTags = boolMeta(metadata.show_tags ?? metadata.showTags, true);
  const showCategories = boolMeta(metadata.show_categories ?? metadata.showCategories, true);
  const showAuthor = boolMeta(metadata.show_author ?? metadata.showAuthor, false);
  const excludeSlugs = parseExcludeFieldSlugs(metadata);
  const templateFieldItems = filterTemplateFieldItems(view.templateFieldEntries, excludeSlugs);

  return {
    title: view.title,
    dateLine: view.dateLine,
    publishedIso: view.publishedIso,
    images: view.images.map((src, index) => ({
      src,
      alt: index === 0 ? view.title : `${view.title} ${index + 1}`,
      index: index + 1,
    })),
    mainContentHtml: view.mainContentHtml,
    metadataBlocks: view.metadataBlocks,
    tags: taxonomy.tags,
    categories: taxonomy.categories,
    author: view.author,
    showDate,
    showImages,
    showTags,
    showCategories,
    showAuthor,
    templateFields: view.templateFields,
    templateFieldItems,
    summary: view.summary,
    price: view.price,
    articleType: view.articleType,
    articleTypeLabel: formatArticleTypeLabel(view.articleType),
    error: false,
  };
}

const EMPTY: PostSingleSectionData = {
  title: '',
  dateLine: '',
  publishedIso: '',
  images: [],
  mainContentHtml: '',
  metadataBlocks: [],
  tags: [],
  categories: [],
  author: null,
  showDate: true,
  showImages: true,
  showTags: true,
  showCategories: true,
  showAuthor: false,
  templateFields: {},
  templateFieldItems: [],
  summary: '',
  price: '',
  articleType: '',
  articleTypeLabel: '',
  error: true,
};

export async function loadPostSingleSection(
  articleId: string,
  locale: string,
  tenantId: string,
  metadata: Record<string, unknown> | undefined
): Promise<PostSingleSectionData> {
  const meta = metadata || {};
  const id = String(
    articleId || meta.article_id || meta.articleId || ''
  ).trim();

  if (!id || !tenantId?.trim()) {
    return EMPTY;
  }

  const view = await loadArticleDetailViewModel(id, locale, tenantId);
  if (!view) {
    return EMPTY;
  }

  return mapViewToSectionData(view, meta);
}
