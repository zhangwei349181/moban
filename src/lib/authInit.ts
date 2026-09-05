/**
 * login / signup 展示层 init / css 配置（与 html_url 对称）
 */

import {
  resolveComponentsCss,
  resolveComponentsInitScript,
  type ComponentsCssDisplay,
  type ComponentsInitScriptDisplay,
} from '../components/sections/resolvers/componentsHtml';

export interface AuthClientInitConfig extends ComponentsInitScriptDisplay, ComponentsCssDisplay {
  cssUrl: string;
}

export function resolveAuthClientInit(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  defaultCssUrl = ''
): AuthClientInitConfig {
  const init = resolveComponentsInitScript(metadata, locale);
  const css = resolveComponentsCss(metadata, locale);
  return {
    ...init,
    ...css,
    cssUrl: css.cssUrl || defaultCssUrl,
  };
}
