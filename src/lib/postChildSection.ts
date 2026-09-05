/**
 * PostChild 区块 — 当前文章主 JSON 的下级列表
 *
 * 候选集来自 has_children / child_article_ids（不分类型）。
 * 再拉每条子级的简易 JSON + 主 JSON，按 metadata 条件过滤。
 */

import {
  fetchArticlesSimpleContent,
  type ArticleSimpleContent,
} from './articleSearch';
import { fetchArticleMain, type ArticleMainData } from './product';
import { getTranslationByLocale as getI18nText, type TranslationKey } from './translations';
import {
  buildPostSectionItemHref,
  collectPostCategoryIds,
  normalizeArticleType,
  normalizeTemplateFields,
  type LoadPostSectionItemsOptions,
  type PostSectionGroup,
  type PostSectionItem,
} from './postSection';

const PLACEHOLDER_IMAGE = '/images/opai-img-313.png';

const PUBLISH_STATUS_I18N_KEYS: Record<string, TranslationKey> = {
  recommended: 'publish_status_recommended',
  pinned: 'publish_status_pinned',
  'special offer': 'publish_status_special_offer',
  featured: 'publish_status_featured',
};

export interface PostChildLoadedChild {
  id: string;
  simple: ArticleSimpleContent;
  main: ArticleMainData;
}

export interface PostChildSectionResult {
  /** 父级 has_children 为真且过滤后至少有一条时才渲染 */
  visible: boolean;
  groups: PostSectionGroup[];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function parseIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function readHasChildren(main: ArticleMainData): boolean {
  const data = asRecord(main.data);
  const article = asRecord(data?.article);
  const flag = article?.has_children ?? data?.has_children;
  if (flag === true || flag === 'true' || flag === 1 || flag === '1') return true;
  if (flag === false || flag === 'false' || flag === 0 || flag === '0') return false;
  return readChildArticleIds(main).length > 0;
}

function readChildArticleIds(main: ArticleMainData): string[] {
  const data = asRecord(main.data);
  const article = asRecord(data?.article);
  const fromArticle = parseIdArray(article?.child_article_ids);
  if (fromArticle.length) return fromArticle;
  return parseIdArray(data?.child_article_ids);
}

function readTemplateId(main: ArticleMainData): string {
  const data = asRecord(main.data);
  const article = asRecord(data?.article);
  const raw = article?.template_id ?? data?.template_id;
  if (raw == null) return '';
  return String(raw).trim();
}

function readStatus(main: ArticleMainData): string {
  const article = asRecord(asRecord(main.data)?.article);
  return String(article?.status ?? '').trim().toLowerCase();
}

function readTags(main: ArticleMainData): string[] {
  const data = asRecord(main.data);
  const article = asRecord(data?.article);
  const fromData = parseIdArray(data?.tags);
  if (fromData.length) return fromData;
  return parseIdArray(article?.tags);
}

function readCategories(main: ArticleMainData): string[] {
  const data = asRecord(main.data);
  const article = asRecord(data?.article);
  const fromData = parseIdArray(data?.categories);
  if (fromData.length) return fromData;
  return parseIdArray(article?.categories);
}

function splitFilterTokens(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchesArticleType(articleType: string, filter: string | undefined): boolean {
  const tokens = splitFilterTokens(filter).map((t) => t.toLowerCase());
  if (!tokens.length) return true;
  return tokens.includes(articleType.trim().toLowerCase());
}

function matchesPublishStatus(publishStatus: string, filter: string | undefined): boolean {
  const want = filter?.trim().toLowerCase();
  if (!want) return true;
  return publishStatus.trim().toLowerCase() === want;
}

function matchesTemplateId(childTemplateId: string, filter: string | undefined): boolean {
  const tokens = splitFilterTokens(filter);
  if (!tokens.length) return true;
  const wantsNull = tokens.some((t) => t.toLowerCase() === 'null');
  const ids = tokens.filter((t) => t.toLowerCase() !== 'null');
  if (!childTemplateId) return wantsNull;
  return ids.includes(childTemplateId);
}

function matchesAnyId(haystack: string[], needles: string[] | undefined): boolean {
  if (!needles?.length) return true;
  const set = new Set(haystack.map((id) => id.trim()).filter(Boolean));
  return needles.some((id) => set.has(id.trim()));
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

function childPassesQuery(child: PostChildLoadedChild, query: LoadPostSectionItemsOptions): boolean {
  if (readStatus(child.main) !== 'published') return false;

  const simple = child.simple.data;
  const articleType = normalizeArticleType(simple?.article_type ?? asRecord(asRecord(child.main.data)?.article)?.article_type);
  if (!matchesArticleType(articleType, query.articleTypes)) return false;
  if (!matchesPublishStatus(simple?.publish_status ?? '', query.publishStatus)) return false;
  if (!matchesTemplateId(readTemplateId(child.main), query.templateId)) return false;
  if (!matchesAnyId(readCategories(child.main), query.categoryIds)) return false;
  if (!matchesAnyId(readTags(child.main), query.tagIds)) return false;
  return true;
}

function mapChildToPostItem(
  child: PostChildLoadedChild,
  locale: string,
  pathUrl?: string
): PostSectionItem | null {
  const data = child.simple.data;
  if (!data) return null;

  const templateFields = (data.metadata?.template_fields || {}) as Record<string, unknown>;
  const title = data.title?.trim() || '';
  const id = String(data.article_id || data.id || child.id || '').trim();
  if (!id) return null;

  const articleType = normalizeArticleType(
    data.article_type ?? asRecord(asRecord(child.main.data)?.article)?.article_type
  );
  const dateSrc = data.created_at || data.updated_at || '';
  const { date, datetime } = formatArticleDate(dateSrc, locale);
  const badge = formatPublishBadge(data.publish_status, locale);
  const categories = readCategories(child.main);

  return {
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
    categoryIds: collectPostCategoryIds({ categories }, []),
    badge,
  };
}

async function loadChildRecords(
  childIds: string[],
  locale: string,
  tenantId: string
): Promise<PostChildLoadedChild[]> {
  if (!childIds.length) return [];

  const [simples, mains] = await Promise.all([
    fetchArticlesSimpleContent(childIds, locale, tenantId),
    Promise.all(childIds.map((id) => fetchArticleMain(id, tenantId).catch(() => null))),
  ]);

  const simpleById = new Map<string, ArticleSimpleContent>();
  for (const simple of simples) {
    const id = String(simple?.data?.article_id || simple?.data?.id || '').trim();
    if (id) simpleById.set(id, simple);
  }

  const mainById = new Map<string, ArticleMainData>();
  for (const main of mains) {
    if (!main) continue;
    const id = String(
      asRecord(asRecord(main.data)?.article)?.id ??
        asRecord(asRecord(main.data)?.article)?.article_id ??
        ''
    ).trim();
    if (id) mainById.set(id, main);
  }

  const out: PostChildLoadedChild[] = [];
  for (const id of childIds) {
    const simple = simpleById.get(id);
    const main = mainById.get(id);
    if (!simple || !main) continue;
    out.push({ id, simple, main });
  }
  return out;
}

function applyQueryToChildren(
  children: PostChildLoadedChild[],
  query: LoadPostSectionItemsOptions,
  locale: string
): PostSectionItem[] {
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 24) : 8;
  const posts: PostSectionItem[] = [];
  for (const child of children) {
    if (!childPassesQuery(child, query)) continue;
    const item = mapChildToPostItem(child, locale, query.pathUrl);
    if (!item) continue;
    posts.push(item);
    if (posts.length >= limit) break;
  }
  return posts;
}

export async function loadPostChildSectionGroups(
  locale: string,
  tenantId: string,
  parentArticleId: string,
  groups: Array<{ id: string; label: string; query: LoadPostSectionItemsOptions }>
): Promise<PostChildSectionResult> {
  const empty: PostChildSectionResult = { visible: false, groups: [] };
  const parentId = parentArticleId.trim();
  if (!tenantId?.trim() || !parentId || !groups.length) return empty;

  try {
    const parentMain = await fetchArticleMain(parentId, tenantId);
    if (!parentMain?.success || !readHasChildren(parentMain)) return empty;

    const childIds = readChildArticleIds(parentMain);
    if (!childIds.length) return empty;

    const children = await loadChildRecords(childIds, locale, tenantId);
    if (!children.length) return empty;

    const loadedGroups: PostSectionGroup[] = groups.map((group) => ({
      id: group.id,
      label: group.label,
      posts: applyQueryToChildren(children, group.query, locale),
    }));

    if (!loadedGroups.some((g) => g.posts.length > 0)) return empty;

    return { visible: true, groups: loadedGroups };
  } catch (error) {
    console.error('[postChildSection] load children failed:', error);
    return empty;
  }
}
