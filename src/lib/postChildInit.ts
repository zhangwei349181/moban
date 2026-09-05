/**
 * PostChild 展示层 init 配置（与 post 相同：init_script_url / css_url）
 */

import {
  hasCustomInitScript,
  resolveComponentsCss,
  resolveComponentsInitScript,
  type ComponentsCssDisplay,
  type ComponentsInitScriptDisplay,
} from '../components/sections/resolvers/componentsHtml';

export interface PostChildClientInitConfig extends ComponentsInitScriptDisplay, ComponentsCssDisplay {
  /** 是否运行平台内置展示层 init（复用 postUi.client.ts） */
  usePlatformUi: boolean;
}

function boolMeta(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

export function resolvePostChildClientInit(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PostChildClientInitConfig {
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
