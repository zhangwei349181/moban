/**
 * Post 展示层 init 配置（init_script_url / css_url，与 html_url 对称）
 */

import {
  hasCustomInitScript,
  resolveComponentsCss,
  resolveComponentsInitScript,
  type ComponentsCssDisplay,
  type ComponentsInitScriptDisplay,
} from '../components/sections/resolvers/componentsHtml';

export interface PostClientInitConfig extends ComponentsInitScriptDisplay, ComponentsCssDisplay {
  /** 是否运行平台内置展示层 init（postUi.client.ts） */
  usePlatformUi: boolean;
}

function boolMeta(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

export function resolvePostClientInit(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PostClientInitConfig {
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
