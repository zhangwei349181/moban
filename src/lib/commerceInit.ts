/**
 * cart / wishlist / checkout / subscriptioncheckout 展示层 init / css 配置（与 html_url 对称）
 */

import {
  hasCustomInitScript,
  resolveComponentsCss,
  resolveComponentsInitScript,
  type ComponentsCssDisplay,
  type ComponentsInitScriptDisplay,
} from '../components/sections/resolvers/componentsHtml';

export interface CommerceClientInitConfig extends ComponentsInitScriptDisplay, ComponentsCssDisplay {
  cssUrl: string;
  usePlatformUi: boolean;
}

function boolMeta(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

export function resolveCommerceClientInit(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  defaultCssUrl = ''
): CommerceClientInitConfig {
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
    cssUrl: css.cssUrl || defaultCssUrl,
    usePlatformUi,
  };
}
