import { APP_CONFIG } from '../config/app.js';

/**
 * 菜单相关接口定义
 */

export interface MenuTranslation {
  language_code: string;
  menu_name: string;
  description: string | null;
  is_primary: boolean;
}

export interface MenuItemTranslation {
  language_code: string;
  label: string;
  description: string | null;
  html_content?: string | null;
  mobile_label?: string | null;
  is_primary: boolean;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  parent_id: string | null;
  path: string | null;
  level: number;
  label: string | null;
  description: string | null;
  primary_language: string;
  item_type: string;
  url: string | null;
  target: string | null;
  anchor: string | null;
  article_id: string | null;
  category_id: string | null;
  is_mega_menu: boolean;
  html_content: string | null;
  html_content_language: string | null;
  mega_menu_width: string | null;
  mega_menu_columns: number | null;
  icon_url: string | null;
  icon_class: string | null;
  badge_text: string | null;
  badge_color: string | null;
  image_url: string | null;
  css_class: string | null;
  css_style: string | null;
  visibility_rule: string;
  visibility_config: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  is_highlighted: boolean;
  show_on_mobile: boolean;
  mobile_label: string | null;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  translations: MenuItemTranslation[];
  children: MenuItem[];
}

export interface Menu {
  id: string;
  tenant_id: string;
  menu_name: string;
  menu_code: string;
  description: string | null;
  primary_language: string;
  position: string;
  is_active: boolean;
  is_default: boolean;
  max_depth: number;
  show_icons: boolean;
  show_badges: boolean;
  css_class: string | null;
  container_class: string | null;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface MenuData {
  menu: Menu;
  translations: MenuTranslation[];
  menu_items: MenuItem[];
  permissions: any[];
}

export interface MenuResponse {
  success: boolean;
  data: MenuData;
}

export type FetchMenuOptions = {
  tenantId?: string;
  apiBaseUrl?: string;
};

/**
 * 解析 fetch 菜单时的 tenant / API 根路径（SSR 无 window 时用 options 或 APP_CONFIG）
 */
function resolveMenuFetchConfig(options?: FetchMenuOptions) {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  const tenantId =
    options?.tenantId ?? win?.__ASTRO_TENANT_ID__ ?? APP_CONFIG.tenantId;
  const apiBaseUrl = options?.apiBaseUrl ?? APP_CONFIG.apiBaseUrl;
  return { tenantId, apiBaseUrl };
}

/**
 * 获取菜单数据
 * @param menuId 菜单ID
 * @param _locale 预留（翻译由 menu_items.translations 决定，不在请求 URL 中传递）
 * @param options SSR 时传入 tenantId；客户端可省略，使用 window.__ASTRO_TENANT_ID__
 */
export async function fetchMenu(
  menuId: string,
  _locale?: string,
  options?: FetchMenuOptions
): Promise<MenuData> {
  const config = resolveMenuFetchConfig(options);
  
  // 构建URL：tenant_{tenantID}/navigation-menus/menu-{菜单ID}.json
  // 静态 JSON 易被浏览器强缓存，追加 t= 时间戳使每次请求 URL 不同，避免读到旧菜单
  // 注意：多语言字段都在 translations 数组中，不需要 language_code 查询参数
  if (!config.tenantId) {
    throw new Error('fetchMenu: tenantId is required (set TENANT_ID / locals.tenantId or window.__ASTRO_TENANT_ID__)');
  }

  const base = `${config.apiBaseUrl}/tenant_${config.tenantId}/navigation-menus/menu-${menuId}.json`;
  const url = `${base}?t=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch menu: ${response.statusText}`);
  }
  
  const result: MenuResponse = await response.json();
  if (!result.success) {
    throw new Error('Failed to fetch menu: API returned unsuccessful response');
  }
  
  return result.data;
}

/**
 * 根据语言代码从translations数组中获取对应的翻译
 */
export function getTranslationByLocale(
  translations: Array<{ language_code: string; is_primary?: boolean; [key: string]: any }>,
  locale: string,
  fallback?: any
): any {
  if (!translations || translations.length === 0) return fallback || null;
  
  const normalizedLocale = String(locale).toLowerCase();

  // 精确匹配（忽略大小写）
  const exactMatch = translations.find(
    (t) => String(t.language_code).toLowerCase() === normalizedLocale
  );
  if (exactMatch) return exactMatch;

  // 匹配语言主码（如 zh-CN ↔ zh、en-US ↔ en），须在 is_primary 之前
  const langPart = normalizedLocale.split('-')[0];
  const langMatch = translations.find((t) => {
    const code = String(t.language_code).toLowerCase();
    const codePart = code.split('-')[0];
    return codePart === langPart || code.startsWith(`${langPart}-`);
  });
  if (langMatch) return langMatch;

  // 匹配主语言（is_primary = true）
  const primaryMatch = translations.find((t) => t.is_primary);
  if (primaryMatch) return primaryMatch;
  
  // 返回第一个或fallback
  return translations[0] || fallback || null;
}

/**
 * 导出客户端对象
 */
export const clientMenu = {
  fetchMenu,
  getTranslationByLocale,
};
