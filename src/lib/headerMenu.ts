import { APP_CONFIG } from '../config/app.js';
import type { MenuItem, MenuItemTranslation } from './menu.js';
import { fetchMenu, getTranslationByLocale } from './menu.js';
import { sortMenuItems, sortMenuTree } from './primaryNavRender.js';

export const HEADER_MENU_CODE = 'header';

export function getMenuItemTranslation(
  item: MenuItem,
  locale: string
): MenuItemTranslation & { html_content?: string | null; mobile_label?: string | null } {
  const fallback = {
    language_code: item.primary_language,
    label: item.label || '',
    description: item.description,
    html_content: item.html_content,
    mobile_label: item.mobile_label,
    is_primary: true,
  };
  return getTranslationByLocale(item.translations, locale, fallback) || fallback;
}

export function getMenuItemLabel(item: MenuItem, locale: string): string {
  const t = getMenuItemTranslation(item, locale);
  return t.label || item.label || '';
}

export function getMenuItemDescription(item: MenuItem, locale: string): string {
  const t = getMenuItemTranslation(item, locale);
  return t.description || item.description || '';
}

export function getMenuItemMobileLabel(item: MenuItem, locale: string): string {
  const t = getMenuItemTranslation(item, locale);
  return t.mobile_label || item.mobile_label || getMenuItemLabel(item, locale);
}

export function getMenuItemHtmlContent(item: MenuItem, locale: string): string {
  const t = getMenuItemTranslation(item, locale);
  return t.html_content || item.html_content || '';
}

export function getMenuItemUrl(item: MenuItem): string {
  if (item.url) return item.url;
  if (item.article_id) return `/article-${item.article_id}`;
  if (item.category_id) return `/category-${item.category_id}`;
  return '#';
}

export function menuPanelId(item: MenuItem): string {
  return `header-menu-${item.id}`;
}

export function activeMenuChildren(item: MenuItem): MenuItem[] {
  return sortMenuItems(
    (item.children || []).filter((c) => c.is_active && c.status === 'active')
  );
}

/** 按 mega_menu_width（如 "4,4,2"）将子项分列 */
export function splitMegaMenuChildren(
  children: MenuItem[],
  columnCount: number,
  widthSpec: string | null
): MenuItem[][] {
  const cols = Math.max(1, columnCount || 1);
  const widths = parseMegaMenuWidths(widthSpec, cols, children.length);
  const columns: MenuItem[][] = [];
  let offset = 0;
  for (const w of widths) {
    columns.push(children.slice(offset, offset + w));
    offset += w;
  }
  return columns;
}

export function parseMegaMenuWidths(
  widthSpec: string | null,
  columnCount: number,
  totalItems: number
): number[] {
  if (widthSpec) {
    const parsed = widthSpec
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (parsed.length === columnCount) {
      const sum = parsed.reduce((a, b) => a + b, 0);
      if (sum === totalItems || totalItems === 0) return parsed;
    }
  }
  const base = Math.floor(totalItems / columnCount);
  const remainder = totalItems % columnCount;
  return Array.from({ length: columnCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

export async function fetchHeaderMenuItems(
  locale: string,
  tenantId?: string
): Promise<MenuItem[]> {
  const tid = tenantId || APP_CONFIG.tenantId;
  const data = await fetchMenu(HEADER_MENU_CODE, locale, { tenantId: tid });
  const topLevel = (data.menu_items || []).filter(
    (item) => item.is_active && item.status === 'active' && (item.level === 1 || !item.parent_id)
  );
  return sortMenuTree(topLevel);
}
