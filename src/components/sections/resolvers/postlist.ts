import {
  loadComponentsHtmlShell,
} from './componentsHtml';
import { parsePostQueryFromMeta } from './post';

/** PostList 区块 metadata：查询条件 + 列表路径（无 tabs/groups） */
export interface PostListSectionMeta {
  listBasePath: string;
  pageSize: number;
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
  pathUrl: string;
  templateId: string;
}

export function resolvePostListSectionMeta(
  metadata: Record<string, unknown> | undefined
): PostListSectionMeta {
  const meta = metadata || {};
  const query = parsePostQueryFromMeta(meta);
  const rawPath =
    meta.list_path ?? meta.listPath ?? meta.base_path ?? meta.basePath ?? '/bloglist';
  const listBasePath = String(rawPath).trim().startsWith('/')
    ? String(rawPath).trim()
    : `/${String(rawPath).trim()}`;

  const pageSizeRaw = meta.article_limit ?? meta.limit ?? meta.page_size ?? 9;
  const pageSize =
    typeof pageSizeRaw === 'number'
      ? pageSizeRaw
      : parseInt(String(pageSizeRaw), 10) || 9;

  return {
    listBasePath: listBasePath || '/bloglist',
    pageSize: Math.min(Math.max(pageSize, 1), 24),
    articleTypes: query.articleTypes ?? 'article,novel,tutorial,news,blog',
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
    pathUrl: query.pathUrl ?? '',
    templateId: query.templateId ?? '',
  };
}

export { resolvePostListClientInit } from '../../../lib/postListInit';
export type { PostListClientInitConfig } from '../../../lib/postListInit';

/** 从 metadata.translations[].html_url（或内联 html）加载 PostList 展示模板壳；没有则返回 null。 */
export async function loadPostListSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
