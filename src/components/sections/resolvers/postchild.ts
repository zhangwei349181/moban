import {
  normalizeAssetUrl,
  pickLocalized,
  resolveCta,
  resolveHeader,
  type TranslationRow,
} from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';
import { parsePostQueryFromMeta, type PostSectionGroupMeta, type PostSectionMeta } from './post';
import type { LoadPostSectionItemsOptions } from '../../../lib/postSection';

function optionalStrMeta(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

const FALLBACK_CTA_EN = { label: 'View more', href: '/bloglist' };
const FALLBACK_CTA_ZH = { label: '查看更多', href: '/bloglist' };

const FALLBACK_TITLE_EN = 'Related';
const FALLBACK_TITLE_ZH = '相关内容';

const EMPTY_QUERY_FALLBACKS: Partial<LoadPostSectionItemsOptions> = {
  articleTypes: '',
  limit: 8,
};

/** 父文章 ID：路由 / 插槽 prop 优先，其次 metadata.article_id */
export function resolvePostChildParentArticleId(
  metadata: Record<string, unknown> | undefined,
  articleIdProp?: string
): string {
  const meta = metadata || {};
  return String(
    articleIdProp || meta.article_id || meta.articleId || ''
  ).trim();
}

export function resolvePostChildSectionGroups(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PostSectionGroupMeta[] {
  const meta = metadata || {};
  const rootQuery = parsePostQueryFromMeta(meta, EMPTY_QUERY_FALLBACKS);
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
      articleTypes: rootQuery.articleTypes ?? '',
      pathUrl: rootQuery.pathUrl,
      templateId: rootQuery.templateId,
    });
    return { id, label, query };
  });
}

export function resolvePostChildSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PostSectionMeta {
  const zh = String(locale).split('-')[0].toLowerCase() === 'zh';
  const fbTitle = zh ? FALLBACK_TITLE_ZH : FALLBACK_TITLE_EN;
  const fbCta = zh ? FALLBACK_CTA_ZH : FALLBACK_CTA_EN;
  const meta = metadata || {};

  const header = resolveHeader(meta, locale, { title: fbTitle });
  const cta = resolveCta(meta, locale, { ...fbCta, ariaLabel: fbCta.label });
  const query = parsePostQueryFromMeta(meta, EMPTY_QUERY_FALLBACKS);

  return {
    title: header.title,
    cta: { label: cta.label, href: normalizeAssetUrl(cta.href) || fbCta.href },
    articleLimit: query.limit ?? 8,
    articleTypes: query.articleTypes ?? '',
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

export { resolvePostChildClientInit } from '../../../lib/postChildInit';
export type { PostChildClientInitConfig } from '../../../lib/postChildInit';

export async function loadPostChildSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
