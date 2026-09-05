/**
 * 网站可视化编辑：URL ?editmode=1|0 与 session 持久化（见 public/assets/gt6-edit-mode.js）
 */

export const GT6_EDITOR_MESSAGE_SOURCE = 'gt6-website-editor';

export const GT6_EDIT_MODE_STORAGE_KEY = 'gt6_edit_mode';

/** postMessage type：点击「编辑组件」 */
export const GT6_MSG_EDIT_COMPONENT = 'editComponent';

/** postMessage type：点击「编辑页面」（metadata.content HTML 区块） */
export const GT6_MSG_EDIT_PAGE = 'editPage';

/** postMessage type：页面底部「新增页面」 */
export const GT6_MSG_ADD_PAGE = 'addPage';

/** postMessage type：页面底部「新增组件」 */
export const GT6_MSG_ADD_COMPONENT = 'addComponent';

/** postMessage type：点击 headerhtml / footerhtml 壳「编辑头部底部内置组件」（不传 pageCode） */
export const GT6_MSG_EDIT_CHROME_SHELL = 'editChromeShell';

/** postMessage type：页面底部「编辑全局组件」（layout） */
export const GT6_MSG_EDIT_LAYOUT = 'editLayout';

/** postMessage type：编辑态下页面加载/导航 */
export const GT6_MSG_NAVIGATION = 'navigation';

export type EditModeUrlState = boolean | null;

/**
 * 从当前请求 URL 解析 editmode：
 * - `1` / `true` → 开启
 * - `0` / `false` → 关闭
 * - 未传 → null（由客户端读 sessionStorage）
 */
export function parseEditModeSearchParam(
  value: string | null | undefined
): EditModeUrlState {
  if (value == null || value === '') return null;
  const v = value.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return null;
}

export function resolveEditModeForRequest(url: URL): EditModeUrlState {
  return parseEditModeSearchParam(url.searchParams.get('editmode'));
}
