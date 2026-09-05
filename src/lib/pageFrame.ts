/**
 * 页面框架资源：全局 layout 组件 + 页面 metadata 的 CSS/JS 注入、main class
 */

import { fetchWebComponent } from './webComponent';
import { fetchWebPage } from './webPage';
import { loadPageComponents } from './pageComponents';
import {
  resolveComponentsCss,
  resolveComponentsInitScript,
} from '../components/sections/resolvers/componentsHtml';
import { normalizeAssetUrl } from '../components/sections/resolvers/_shared';
import {
  isLayoutComponentType,
  isLayoutSectionCode,
  LAYOUT_COMPONENT_CODE,
} from './layoutComponentCode';

export { LAYOUT_COMPONENT_CODE };

export interface PageFrameScript {
  src?: string;
  inline?: string;
  type?: string;
}

export interface PageFrameConfig {
  cssUrls: string[];
  scripts: PageFrameScript[];
  /** 已解析的 <main> class；调用方可用作最终 class */
  mainClass: string;
}

function optionalStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function dedupeStrings(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const url = normalizeAssetUrl(raw);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function collectStringList(meta: Record<string, unknown>, keys: string[]): string[] {
  const out: string[] = [];
  for (const key of keys) {
    const val = meta[key];
    if (typeof val === 'string' && val.trim()) {
      out.push(val.trim());
      continue;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string' && item.trim()) out.push(item.trim());
      }
    }
  }
  return out;
}

function collectCssUrls(meta: Record<string, unknown>, locale: string): string[] {
  const urls: string[] = [];
  const resolved = resolveComponentsCss(meta, locale);
  if (resolved.cssUrl) urls.push(resolved.cssUrl);
  urls.push(
    ...collectStringList(meta, [
      'css_urls',
      'cssUrls',
      'stylesheet_urls',
      'stylesheetUrls',
      'style_urls',
      'styleUrls',
    ])
  );
  return dedupeStrings(urls);
}

function collectScripts(meta: Record<string, unknown>, locale: string): PageFrameScript[] {
  const scripts: PageFrameScript[] = [];
  const init = resolveComponentsInitScript(meta, locale);

  if (init.initScriptUrl) {
    scripts.push({ src: normalizeAssetUrl(init.initScriptUrl), type: 'module' });
  }
  if (init.initScriptInline) {
    scripts.push({ inline: init.initScriptInline, type: 'module' });
  }

  for (const url of collectStringList(meta, [
    'script_url',
    'scriptUrl',
    'js_url',
    'jsUrl',
    'init_script_urls',
    'initScriptUrls',
    'script_urls',
    'scriptUrls',
    'js_urls',
    'jsUrls',
  ])) {
    scripts.push({ src: normalizeAssetUrl(url) });
  }

  const inline =
    optionalStr(meta.script) ??
    optionalStr(meta.js) ??
    optionalStr(meta.client_script) ??
    optionalStr(meta.clientScript);
  if (inline) {
    scripts.push({ inline, type: optionalStr(meta.script_type ?? meta.scriptType) ?? undefined });
  }

  return scripts;
}

function collectFrameAssets(
  meta: Record<string, unknown>,
  locale: string
): Pick<PageFrameConfig, 'cssUrls' | 'scripts'> {
  return {
    cssUrls: collectCssUrls(meta, locale),
    scripts: collectScripts(meta, locale),
  };
}

/** 从页面 metadata 解析 <main> 的 class */
export function resolvePageMainClass(
  pageMeta: Record<string, unknown> = {},
  fallback = ''
): string {
  const raw =
    pageMeta.main_class ??
    pageMeta.mainClass ??
    pageMeta.main_bg_class ??
    pageMeta.mainBgClass ??
    pageMeta.body_class ??
    pageMeta.bodyClass;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return fallback;
}

/**
 * 本页 layout 资源：关联的组件记录 type=layout 优先；否则 components_code=layout；都没有则不加载。
 * 不注入内核 /assets/theme.css 作为第三档回退。
 */
export async function loadLayoutComponentFrameAssets(
  locale: string,
  tenantId: string,
  pageCode?: string
): Promise<Pick<PageFrameConfig, 'cssUrls' | 'scripts'>> {
  if (pageCode?.trim()) {
    const slots = await loadPageComponents(pageCode.trim(), locale, tenantId);
    const associated = slots.filter((slot) => isLayoutComponentType(slot.componentType));
    if (associated.length > 0) {
      return collectFrameAssets(associated[0].effectiveMetadata, locale);
    }
  }

  const record = await fetchWebComponent(LAYOUT_COMPONENT_CODE, tenantId, { optional: true });
  if (!record?.metadata || typeof record.metadata !== 'object') {
    return { cssUrls: [], scripts: [] };
  }
  return collectFrameAssets(record.metadata as Record<string, unknown>, locale);
}

/** 仅解析页面 metadata 的框架资源（不含全局 layout 组件） */
export function resolvePageFrameConfig(
  pageMeta: Record<string, unknown>,
  locale: string,
  options: { mainClassFallback?: string } = {}
): PageFrameConfig {
  const assets = collectFrameAssets(pageMeta, locale);
  return {
    ...assets,
    mainClass: resolvePageMainClass(pageMeta, options.mainClassFallback ?? ''),
  };
}

export async function loadPageFrameConfig(
  pageCode: string,
  locale: string,
  tenantId: string,
  options: { mainClassFallback?: string } = {}
): Promise<PageFrameConfig> {
  const pageData = await fetchWebPage(pageCode, tenantId);
  const pageMeta = (pageData?.page?.metadata || {}) as Record<string, unknown>;
  return resolvePageFrameConfig(pageMeta, locale, options);
}

/** 合并全局 layout 组件与页面级 frame（layout 在前，页面在后；CSS 去重） */
export function mergeLayoutAndPageFrame(
  layoutAssets: Pick<PageFrameConfig, 'cssUrls' | 'scripts'>,
  pageFrame: PageFrameConfig | null | undefined,
  mainClassFallback = ''
): PageFrameConfig {
  return {
    cssUrls: dedupeStrings([...layoutAssets.cssUrls, ...(pageFrame?.cssUrls ?? [])]),
    scripts: [...layoutAssets.scripts, ...(pageFrame?.scripts ?? [])],
    mainClass: pageFrame?.mainClass ?? mainClassFallback,
  };
}

/** layout 组件不应作为正文槽位渲染（若误关联到页面则过滤） */
export function isPageBodySectionCode(code: string): boolean {
  return !isLayoutSectionCode(code);
}
