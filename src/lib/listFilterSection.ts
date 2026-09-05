/**
 * ListFilter 筛选区块 — 分类、标签、属性、价格范围（服务端渲染 + GET 表单）
 */

import {
  fetchAttributes,
  fetchCategories,
  fetchTags,
  type Attribute,
  type Category,
} from './articleSearch';
import { resolveTreeEntityLocalizedName } from './entityLocalized';
import {
  clearListFilterQuery,
  hasActiveListFilters,
  resolveListPageQuery,
  type ListFilterQuery,
} from './listFilterQuery';

function resolveListBasePath(metadata: Record<string, unknown> | undefined): string {
  const raw =
    metadata?.list_path ??
    metadata?.listPath ??
    metadata?.base_path ??
    metadata?.basePath ??
    '/bloglist';
  const path = String(raw).trim() || '/bloglist';
  return path.startsWith('/') ? path : `/${path}`;
}

export interface ListFilterCategoryItem {
  id: string;
  name: string;
  checked: boolean;
  parentId: string;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  hidden: boolean;
}

export interface ListFilterTagItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface ListFilterAttributeValueItem {
  id: string;
  name: string;
  colorCode: string;
  checked: boolean;
  isColor: boolean;
}

export interface ListFilterAttributeGroup {
  id: string;
  code: string;
  name: string;
  isColor: boolean;
  values: ListFilterAttributeValueItem[];
}

export interface ListFilterSectionData {
  listBasePath: string;
  formAction: string;
  clearHref: string;
  categories: ListFilterCategoryItem[];
  tags: ListFilterTagItem[];
  attributes: ListFilterAttributeGroup[];
  priceMin: string;
  priceMax: string;
  priceFieldKey: string;
  showCategories: boolean;
  showTags: boolean;
  showAttributes: boolean;
  showPrice: boolean;
  hasActiveFilters: boolean;
}

function boolMeta(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
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

function parseMaxItems(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

function resolveListFilterQuery(
  url: URL,
  metadata: Record<string, unknown> | undefined
): ListFilterQuery {
  return resolveListPageQuery(url, metadata);
}

function isActiveCategory(node: Category, categoryType: string): boolean {
  return node.status === 'active' && node.category_type === categoryType;
}

function sortCategories(nodes: Category[]): Category[] {
  return [...nodes].sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100));
}

function findCategoryById(nodes: Category[], targetId: string): Category | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children?.length) {
      const found = findCategoryById(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function activeChildren(node: Category, categoryType: string): Category[] {
  return sortCategories((node.children || []).filter((child) => isActiveCategory(child, categoryType)));
}

function collectByParentId(nodes: Category[], parentId: string, categoryType: string): Category[] {
  const result: Category[] = [];
  function walk(list: Category[]): void {
    for (const node of list) {
      if (isActiveCategory(node, categoryType) && node.parent_id === parentId) {
        result.push(node);
      }
      if (node.children?.length) walk(node.children);
    }
  }
  walk(nodes);
  return sortCategories(result);
}

/** 未指定根：顶级分类；指定根：该分类的下级（不含根自身） */
function resolveCategoryRoots(
  categories: Category[],
  categoryType: string,
  rootId: string | null
): Category[] {
  if (rootId) {
    const root = findCategoryById(categories, rootId);
    if (root) return activeChildren(root, categoryType);
    return collectByParentId(categories, rootId, categoryType);
  }

  return sortCategories(
    categories.filter(
      (node) => isActiveCategory(node, categoryType) && (node.level === 1 || !node.parent_id)
    )
  );
}

function nodeHasCheckedDescendant(
  node: Category,
  categoryType: string,
  checkedIds: string[]
): boolean {
  for (const child of activeChildren(node, categoryType)) {
    if (checkedIds.includes(child.id)) return true;
    if (nodeHasCheckedDescendant(child, categoryType, checkedIds)) return true;
  }
  return false;
}

function flattenCategoryTree(
  roots: Category[],
  categoryType: string,
  locale: string,
  checkedIds: string[],
  maxItems: number
): ListFilterCategoryItem[] {
  const result: ListFilterCategoryItem[] = [];

  function walk(
    nodes: Category[],
    parentId: string,
    depth: number,
    ancestorsExpanded: boolean
  ): void {
    for (const node of nodes) {
      if (result.length >= maxItems) return;
      const kids = activeChildren(node, categoryType);
      const hasChildren = kids.length > 0;
      const checked = checkedIds.includes(node.id);
      const expanded =
        hasChildren && (checked || nodeHasCheckedDescendant(node, categoryType, checkedIds));
      const visible = depth === 0 || ancestorsExpanded;

      result.push({
        id: node.id,
        name: resolveTreeEntityLocalizedName(node, locale, 'name'),
        checked,
        parentId,
        depth,
        hasChildren,
        expanded,
        hidden: !visible,
      });

      if (hasChildren) walk(kids, node.id, depth + 1, visible && expanded);
    }
  }

  walk(roots, '', 0, true);
  return result;
}

function resolveAttributeDisplayName(attr: Attribute, locale: string): string {
  const primary = attr.attribute_name?.trim() || attr.attribute_code || '';
  return resolveTreeEntityLocalizedName(
    { name: primary, translations: attr.translations as never },
    locale,
    'name'
  );
}

function resolveAttributeValueDisplayName(
  value: { value_name?: string; display_name?: string; translations?: unknown[] },
  locale: string
): string {
  const primary = value.display_name?.trim() || value.value_name?.trim() || '';
  return resolveTreeEntityLocalizedName(
    { name: primary, translations: value.translations as never },
    locale,
    'name'
  );
}

function isColorAttribute(attr: Attribute): boolean {
  const type = String(attr.attribute_type || '').toLowerCase();
  return type === 'color' || type === 'colour';
}

export async function loadListFilterSection(
  locale: string,
  tenantId: string,
  metadata: Record<string, unknown> | undefined,
  pageUrl: URL
): Promise<ListFilterSectionData> {
  const meta = metadata || {};
  const listBasePath = resolveListBasePath(meta);
  const query = resolveListFilterQuery(pageUrl, meta);

  const categoryType = String(meta.category_type ?? meta.categoryType ?? 'article').trim();
  const tagType = String(meta.tag_type ?? meta.tagType ?? categoryType).trim();
  const rootCategoryId =
    String(
      meta.category_parent_id ??
        meta.categoryParentId ??
        meta.root_category_id ??
        meta.rootCategoryId ??
        meta.category_root_id ??
        meta.categoryRootId ??
        ''
    ).trim() || null;
  const limitCodes = parseIdList(meta.attribute_codes ?? meta.attributeCodes);

  const showCategories = boolMeta(meta.show_categories ?? meta.showCategories, true);
  const showTags = boolMeta(meta.show_tags ?? meta.showTags, true);
  const showAttributes = boolMeta(meta.show_attributes ?? meta.showAttributes, true);
  const showPrice = boolMeta(
    meta.show_price_filter ?? meta.showPriceFilter,
    categoryType === 'product'
  );

  const maxCategories = parseMaxItems(meta.max_categories ?? meta.maxCategories, 80);
  const maxTags = parseMaxItems(meta.max_tags ?? meta.maxTags, 30);

  const empty: ListFilterSectionData = {
    listBasePath,
    formAction: listBasePath,
    clearHref: clearListFilterQuery(listBasePath),
    categories: [],
    tags: [],
    attributes: [],
    priceMin: query.priceMin,
    priceMax: query.priceMax,
    priceFieldKey: query.priceFieldKey,
    showCategories,
    showTags,
    showAttributes,
    showPrice,
    hasActiveFilters: hasActiveListFilters(query),
  };

  if (!tenantId?.trim()) return empty;

  try {
    const tasks: Promise<void>[] = [];

    if (showCategories) {
      tasks.push(
        fetchCategories(tenantId).then((res) => {
          if (!res.success || !res.data?.categories) return;
          const roots = resolveCategoryRoots(res.data.categories, categoryType, rootCategoryId);
          empty.categories = flattenCategoryTree(
            roots,
            categoryType,
            locale,
            query.categoryIds,
            maxCategories
          );
        })
      );
    }

    if (showTags) {
      tasks.push(
        fetchTags(tenantId).then((res) => {
          if (!res.success || !res.data?.tags) return;
          const tags = res.data.tags
            .filter((t) => t.tag_type === tagType && t.status === 'active')
            .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100))
            .slice(0, maxTags);
          empty.tags = tags.map((tag) => ({
            id: tag.id,
            name: resolveTreeEntityLocalizedName(tag, locale, 'name'),
            checked: query.tagIds.includes(tag.id),
          }));
        })
      );
    }

    if (showAttributes) {
      tasks.push(
        fetchAttributes(tenantId).then((res) => {
          if (!res.success || !res.data?.attributes) return;
          let attrs = res.data.attributes.filter(
            (a) => a.status === 'active' && a.is_filterable !== false
          );
          if (limitCodes.length) {
            const codeSet = new Set(limitCodes.map((c) => c.toLowerCase()));
            attrs = attrs.filter((a) => codeSet.has(String(a.attribute_code).toLowerCase()));
          }

          empty.attributes = attrs
            .map((attr) => {
              const isColor = isColorAttribute(attr);
              const values = (attr.values || [])
                .filter((v) => v.status === 'active')
                .map((v) => ({
                  id: v.id,
                  name: resolveAttributeValueDisplayName(v, locale),
                  colorCode: v.color_code?.trim() || '',
                  checked: query.attributeValueIds.includes(v.id),
                  isColor,
                }));
              if (!values.length) return null;
              return {
                id: attr.id,
                code: attr.attribute_code,
                name: resolveAttributeDisplayName(attr, locale),
                isColor,
                values,
              };
            })
            .filter((g): g is ListFilterAttributeGroup => g !== null);
        })
      );
    }

    await Promise.all(tasks);
    return empty;
  } catch (error) {
    console.error('[listFilterSection] load failed:', error);
    return empty;
  }
}
