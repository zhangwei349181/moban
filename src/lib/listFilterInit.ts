/**
 * ListFilter 展示层 init 配置（init_script_url / css_url，与 html_url 对称）
 */

import {
  hasCustomInitScript,
  resolveComponentsCss,
  resolveComponentsInitScript,
  type ComponentsCssDisplay,
  type ComponentsInitScriptDisplay,
} from '../components/sections/resolvers/componentsHtml';

export interface ListFilterClientInitConfig extends ComponentsInitScriptDisplay, ComponentsCssDisplay {
  /** 是否运行平台内置展示层 init（listFilterUi.client.ts） */
  usePlatformUi: boolean;
}

function boolMeta(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

/**
 * 解析 listfilter metadata 中的客户端 init / css 配置。
 *
 * - 未配置 init_script_url / init_script：默认 usePlatformUi=true
 * - 已配置用户 init：默认 usePlatformUi=false；可用 use_platform_ui:true 强制同时启用平台 init
 */
export function resolveListFilterClientInit(
  metadata: Record<string, unknown> | undefined,
  locale: string
): ListFilterClientInitConfig {
  const meta = metadata || {};
  const init = resolveComponentsInitScript(meta, locale);
  const css = resolveComponentsCss(meta, locale);
  const hasCustom = hasCustomInitScript(init);

  const usePlatformUi = hasCustom
    ? boolMeta(meta.use_platform_ui ?? meta.usePlatformUi, false)
    : boolMeta(meta.use_platform_ui ?? meta.usePlatformUi, true);

  return {
    ...init,
    ...css,
    usePlatformUi,
  };
}
