import { APP_CONFIG } from '../config/app.js';
import { getTranslationByLocale } from './menu.js';

/**
 * 租户下全部分类树（articles/categories/categories-{tenantId}.json）
 * 非扁平：children 嵌套；category_type 区分 article / product 等。
 */

export interface CategoryTranslation {
  language_code: string;
  name?: string;
  description?: string | null;
  is_primary?: boolean;
}

export interface CategoryNode {
  id: string;
  tenant_id?: string;
  parent_id: string | null;
  path: string;
  level: number;
  name: string;
  description?: string | null;
  category_type: string;
  icon_url?: string | null;
  sort_order?: number;
  status: string;
  primary_language?: string;
  translations?: CategoryTranslation[];
  children?: CategoryNode[] | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriesDataPayload {
  categories: CategoryNode[];
  total_count?: number;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: CategoriesDataPayload;
}

function getClientConfig() {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  return {
    tenantId: win?.__ASTRO_TENANT_ID__ || APP_CONFIG.tenantId || '',
    locale: win?.__ASTRO_LOCALE__ || APP_CONFIG.defaultLocale || 'en-US',
    apiBaseUrl: APP_CONFIG.apiBaseUrl,
  };
}

/**
 * 拉取租户完整分类树（含 article / product 等，需自行按 category_type 筛选）
 */
export async function fetchCategories(): Promise<CategoriesDataPayload> {
  const config = getClientConfig();
  const tenantId = config.tenantId || APP_CONFIG.tenantId;
  const base = `${config.apiBaseUrl}/tenant_${tenantId}/articles/categories/categories-${tenantId}.json`;
  const url = `${base}?t=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  const result: CategoriesResponse = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch categories: invalid response');
  }

  return result.data;
}

export function isCategoryActive(node: CategoryNode): boolean {
  if (!node || !node.status) return false;
  return String(node.status).toLowerCase() === 'active';
}

/** 递归只保留指定 category_type 且 status=active 的节点，并保留子树结构 */
export function filterCategoryTreeByType(
  nodes: CategoryNode[] | null | undefined,
  categoryType: string
): CategoryNode[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  const out: CategoryNode[] = [];
  for (const n of nodes) {
    if (!isCategoryActive(n) || n.category_type !== categoryType) continue;
    const children = n.children
      ? filterCategoryTreeByType(n.children, categoryType)
      : [];
    out.push({
      ...n,
      children: children.length > 0 ? children : null,
    });
  }
  out.sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  return out;
}

/** 取产品分类根列表（已过滤类型，且子级均为 product） */
export function getProductCategoryRoots(data: CategoriesDataPayload): CategoryNode[] {
  return filterCategoryTreeByType(data.categories, 'product');
}

/**
 * 接口约定：主语言的文案在 `name` / `description` 字段，`translations` 里不会出现主语言（如主语言为英语时不会有 en-US）。
 * 仅当用户所选语言与 `primary_language` 一致时，应直接使用节点上的 `name`、`description`。
 */
export function localeMatchesPrimary(locale: string, primaryLanguage: string | undefined | null): boolean {
  if (!locale || !primaryLanguage) return false;
  const L = locale.trim().toLowerCase().replace(/_/g, '-');
  const P = String(primaryLanguage).trim().toLowerCase().replace(/_/g, '-');
  if (L === P) return true;
  const l0 = L.split('-')[0];
  const p0 = P.split('-')[0];
  return l0.length >= 2 && l0 === p0;
}

export function getCategoryDisplayName(node: CategoryNode, locale: string): string {
  if (localeMatchesPrimary(locale, node.primary_language)) {
    return node.name || '';
  }
  const t = getTranslationByLocale(node.translations || [], locale);
  if (t?.name) return t.name;
  return node.name || '';
}

/** 与 `name` 相同规则：主语言用 `description`，否则从 `translations` 取对应语言的 `description`。 */
export function getCategoryDisplayDescription(node: CategoryNode, locale: string): string {
  if (localeMatchesPrimary(locale, node.primary_language)) {
    return node.description ?? '';
  }
  const t = getTranslationByLocale(node.translations || [], locale);
  if (t?.description) return t.description;
  return node.description ?? '';
}

/** 商品列表页并带上分类筛选（与 list.astro 解析的 `category_ids` 一致） */
export function getCategoryHref(categoryId: string): string {
  const id = encodeURIComponent(String(categoryId).trim());
  return `/shoplist?category_ids=${id}`;
}

export const clientCategories = {
  fetchCategories,
  filterCategoryTreeByType,
  getProductCategoryRoots,
  getCategoryDisplayName,
  getCategoryDisplayDescription,
  getCategoryHref,
  getTranslationByLocale,
  isCategoryActive,
  localeMatchesPrimary,
};
