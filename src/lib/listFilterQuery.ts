/**
 * 列表页筛选 — URL 查询解析与链接构建（postlist / listfilter 共用）
 */

import { parsePostQueryFromMeta } from '../components/sections/resolvers/post';

export interface ListFilterQuery {
  categoryIds: string[];
  tagIds: string[];
  attributeValueIds: string[];
  attributeCodes: string[];
  priceMin: string;
  priceMax: string;
  priceFieldKey: string;
  page: number;
}

function parseIdListParam(url: URL, key: string): string[] {
  const ids: string[] = [];
  url.searchParams.getAll(key).forEach((param) => {
    if (param.includes(',')) {
      ids.push(...param.split(',').map((id) => id.trim()).filter(Boolean));
    } else if (param.trim()) {
      ids.push(param.trim());
    }
  });
  return ids;
}

export function parseListFilterQuery(url: URL): ListFilterQuery {
  const pageRaw = parseInt(url.searchParams.get('page') || '1', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const priceMin =
    url.searchParams.get('price_min')?.trim() ||
    url.searchParams.get('metadata_template_field_value_min')?.trim() ||
    '';
  const priceMax =
    url.searchParams.get('price_max')?.trim() ||
    url.searchParams.get('metadata_template_field_value_max')?.trim() ||
    '';
  const priceFieldKey =
    url.searchParams.get('price_field_key')?.trim() ||
    url.searchParams.get('metadata_template_field_key')?.trim() ||
    'price';

  return {
    categoryIds: parseIdListParam(url, 'category_ids'),
    tagIds: parseIdListParam(url, 'tag_ids'),
    attributeValueIds: parseIdListParam(url, 'attribute_value_ids'),
    attributeCodes: parseIdListParam(url, 'attribute_codes'),
    priceMin,
    priceMax,
    priceFieldKey,
    page,
  };
}

export function buildListFilterHref(
  query: ListFilterQuery,
  page?: number,
  basePath = '/bloglist'
): string {
  // 兼容旧调用方可能传入不完整 query（缺少 attribute* 字段）
  const safe: ListFilterQuery = {
    categoryIds: Array.isArray((query as any).categoryIds) ? (query as any).categoryIds : [],
    tagIds: Array.isArray((query as any).tagIds) ? (query as any).tagIds : [],
    attributeValueIds: Array.isArray((query as any).attributeValueIds) ? (query as any).attributeValueIds : [],
    attributeCodes: Array.isArray((query as any).attributeCodes) ? (query as any).attributeCodes : [],
    priceMin: typeof (query as any).priceMin === 'string' ? (query as any).priceMin : '',
    priceMax: typeof (query as any).priceMax === 'string' ? (query as any).priceMax : '',
    priceFieldKey: typeof (query as any).priceFieldKey === 'string' ? (query as any).priceFieldKey : 'price',
    page: typeof (query as any).page === 'number' && Number.isFinite((query as any).page) ? (query as any).page : 1,
  };

  const sp = new URLSearchParams();
  if (safe.categoryIds.length) {
    sp.set('category_ids', safe.categoryIds.join(','));
  }
  if (safe.tagIds.length) {
    sp.set('tag_ids', safe.tagIds.join(','));
  }
  if (safe.attributeValueIds.length) {
    sp.set('attribute_value_ids', safe.attributeValueIds.join(','));
  }
  if (safe.attributeCodes.length) {
    sp.set('attribute_codes', safe.attributeCodes.join(','));
  }
  if (safe.priceMin) sp.set('price_min', safe.priceMin);
  if (safe.priceMax) sp.set('price_max', safe.priceMax);
  if (safe.priceFieldKey && safe.priceFieldKey !== 'price' && (safe.priceMin || safe.priceMax)) {
    sp.set('price_field_key', safe.priceFieldKey);
  }

  const p = page ?? safe.page;
  if (p > 1) sp.set('page', String(p));

  const qs = sp.toString();
  const path = basePath.replace(/\/$/, '') || '/bloglist';
  return qs ? `${path}?${qs}` : path;
}

export function hasActiveListFilters(query: ListFilterQuery): boolean {
  const categoryIds = Array.isArray((query as any).categoryIds) ? (query as any).categoryIds : [];
  const tagIds = Array.isArray((query as any).tagIds) ? (query as any).tagIds : [];
  const attributeValueIds = Array.isArray((query as any).attributeValueIds)
    ? (query as any).attributeValueIds
    : [];
  const attributeCodes = Array.isArray((query as any).attributeCodes) ? (query as any).attributeCodes : [];
  const priceMin = typeof (query as any).priceMin === 'string' ? (query as any).priceMin : '';
  const priceMax = typeof (query as any).priceMax === 'string' ? (query as any).priceMax : '';

  return (
    categoryIds.length > 0 ||
    tagIds.length > 0 ||
    attributeValueIds.length > 0 ||
    attributeCodes.length > 0 ||
    Boolean(priceMin) ||
    Boolean(priceMax)
  );
}

export function clearListFilterQuery(basePath = '/bloglist'): string {
  return basePath.replace(/\/$/, '') || '/bloglist';
}

/** 合并 URL 查询与 metadata 默认查询（URL 优先） */
export function resolveListPageQuery(
  url: URL,
  metadata: Record<string, unknown> | undefined
): ListFilterQuery {
  const urlQuery = parseListFilterQuery(url);
  const metaQuery = parsePostQueryFromMeta(metadata || {});

  return {
    categoryIds:
      urlQuery.categoryIds.length > 0 ? urlQuery.categoryIds : metaQuery.categoryIds ?? [],
    tagIds: urlQuery.tagIds.length > 0 ? urlQuery.tagIds : metaQuery.tagIds ?? [],
    attributeValueIds:
      urlQuery.attributeValueIds.length > 0
        ? urlQuery.attributeValueIds
        : metaQuery.attributeValueIds ?? [],
    attributeCodes:
      urlQuery.attributeCodes.length > 0
        ? urlQuery.attributeCodes
        : metaQuery.attributeCodes ?? [],
    priceMin: urlQuery.priceMin || metaQuery.metadataTemplateFieldValueMin || '',
    priceMax: urlQuery.priceMax || metaQuery.metadataTemplateFieldValueMax || '',
    priceFieldKey:
      urlQuery.priceFieldKey ||
      metaQuery.metadataTemplateFieldKey?.trim() ||
      String(metadata?.price_field_key ?? metadata?.priceFieldKey ?? 'price').trim() ||
      'price',
    page: urlQuery.page,
  };
}
