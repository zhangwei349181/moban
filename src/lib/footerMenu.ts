import { APP_CONFIG } from '../config/app.js';
import type { MenuItem } from './menu.js';
import { fetchMenu } from './menu.js';
import { sortMenuItems, sortMenuTree } from './primaryNavRender.js';

export const FOOTER_MENU_CODE = 'footer';
export const FOOTER_MAX_TOP_LEVEL = 3;

/** 底部导航仅展示二级子项（忽略更深层级） */
export function getFooterLevel2Children(item: MenuItem): MenuItem[] {
  return sortMenuItems(
    (item.children || []).filter(
      (c) =>
        c.is_active &&
        c.status === 'active' &&
        (c.level === 2 || c.parent_id === item.id)
    )
  );
}

export async function fetchFooterMenuItems(
  locale: string,
  tenantId?: string
): Promise<MenuItem[]> {
  const tid = tenantId || APP_CONFIG.tenantId;
  const data = await fetchMenu(FOOTER_MENU_CODE, locale, { tenantId: tid });
  const topLevel = (data.menu_items || []).filter(
    (item) =>
      item.is_active &&
      item.status === 'active' &&
      (item.level === 1 || !item.parent_id)
  );
  return sortMenuTree(topLevel).slice(0, FOOTER_MAX_TOP_LEVEL);
}
