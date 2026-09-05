import { getTranslationByLocale } from '../../../lib/menu';
import { normalizeCmsComponentHtml } from '../../../lib/cmsComponentHtml';
import { normalizeAssetUrl, strMeta } from './_shared';

export { normalizeCmsComponentHtml } from '../../../lib/cmsComponentHtml';

export interface ComponentsHtmlDisplay {
  html: string | null;
  htmlUrl: string | null;
  bare: boolean;
  wrapperClass: string;
  containerClass: string;
  ariaLabel: string | null;
}

/** 展示层客户端初始化脚本（与 html_url 对称） */
export interface ComponentsInitScriptDisplay {
  initScriptUrl: string | null;
  initScriptInline: string | null;
}

/** 展示层样式表（与 html_url / init_script_url 对称） */
export interface ComponentsCssDisplay {
  cssUrl: string | null;
}

export interface ExtractedHtmlScript {
  inline?: string;
  src?: string;
  type?: string;
}

export interface SplitHtmlScriptsResult {
  html: string;
  scripts: ExtractedHtmlScript[];
}

const SCRIPT_TAG_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

export function splitInlineScriptsFromHtml(raw: string): SplitHtmlScriptsResult {
  if (!raw.trim()) return { html: '', scripts: [] };

  const scripts: ExtractedHtmlScript[] = [];
  const html = raw
    .replace(SCRIPT_TAG_RE, (_match, attrs: string, body: string) => {
      const srcMatch = /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(attrs);
      const typeMatch = /\btype\s*=\s*(["'])(.*?)\1/i.exec(attrs);
      const src = srcMatch?.[2]?.trim();
      const type = typeMatch?.[2]?.trim();

      if (src) {
        scripts.push({ src, type: type || undefined });
        return '';
      }

      const inline = body.trim();
      if (inline) {
        scripts.push({ inline, type: type || undefined });
      }
      return '';
    })
    .trim();

  return { html, scripts };
}

function isBareLayout(meta: Record<string, unknown>): boolean {
  const layout = (meta.layout || {}) as Record<string, unknown>;
  return (
    meta.bare === true ||
    meta.full_bleed === true ||
    meta.skip_wrapper === true ||
    layout.bare === true ||
    layout.full_bleed === true
  );
}

function optionalStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function htmlFromRow(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  const raw = row.html ?? row.content ?? row.body ?? row.markup ?? row.code;
  return typeof raw === 'string' && raw.trim() ? raw : null;
}

function urlFromRow(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  const raw =
    row.html_url ??
    row.htmlUrl ??
    row.url ??
    row.href ??
    row.link ??
    row.src ??
    row.html_src;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return normalizeAssetUrl(raw.trim());
}

function initScriptUrlFromRow(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  const raw =
    row.init_script_url ??
    row.initScriptUrl ??
    row.init_js_url ??
    row.initJsUrl ??
    row.client_script_url ??
    row.clientScriptUrl;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return normalizeAssetUrl(raw.trim());
}

function initScriptInlineFromRow(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  const raw =
    row.init_script ??
    row.initScript ??
    row.init_js ??
    row.initJs ??
    row.client_script ??
    row.clientScript;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

function cssUrlFromRow(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  const raw = row.css_url ?? row.cssUrl ?? row.style_url ?? row.styleUrl ?? row.stylesheet_url ?? row.stylesheetUrl;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return normalizeAssetUrl(raw.trim());
}

function normalizeComponentMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  return metadata;
}

function coerceTranslationsList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) as Array<Record<string, unknown>>;
}

function resolveHtmlSource(
  meta: Record<string, unknown>,
  locale: string
): { html: string | null; htmlUrl: string | null } {
  const block = (meta.html || meta.content || meta.markup || {}) as Record<string, unknown>;
  const blockIsString = typeof meta.html === 'string' || typeof meta.content === 'string';
  const topUrl = optionalStr(meta.html_url ?? meta.htmlUrl ?? meta.url ?? meta.href);

  const translations = coerceTranslationsList(meta.translations ?? (block as any).translations);
  if (translations.length > 0) {
    const row = getTranslationByLocale(translations as any, locale) as Record<string, unknown> | null;
    const inline = htmlFromRow(row);
    const rowUrl = urlFromRow(row);
    if (inline || rowUrl) {
      return { html: inline, htmlUrl: rowUrl ?? topUrl };
    }
  }

  if (blockIsString) {
    return { html: optionalStr(meta.html ?? meta.content), htmlUrl: topUrl };
  }

  if (block && typeof block === 'object' && !Array.isArray(block)) {
    const nested = coerceTranslationsList((block as any).translations);
    if (nested.length > 0) {
      const row = getTranslationByLocale(nested as any, locale) as Record<string, unknown> | null;
      const inline = htmlFromRow(row);
      const rowUrl = urlFromRow(row);
      if (inline || rowUrl) {
        return { html: inline, htmlUrl: rowUrl ?? topUrl };
      }
    }
    return {
      html: optionalStr((block as any).html ?? (block as any).content ?? (block as any).body),
      htmlUrl: optionalStr((block as any).html_url ?? (block as any).url) ?? topUrl,
    };
  }

  if (topUrl) return { html: null, htmlUrl: topUrl };
  return { html: null, htmlUrl: null };
}

function resolveInitScriptSource(
  meta: Record<string, unknown>,
  locale: string
): ComponentsInitScriptDisplay {
  const topUrl = optionalStr(
    meta.init_script_url ??
      meta.initScriptUrl ??
      meta.init_js_url ??
      meta.initJsUrl ??
      meta.client_script_url ??
      meta.clientScriptUrl
  );
  const topInline = optionalStr(
    meta.init_script ??
      meta.initScript ??
      meta.init_js ??
      meta.initJs ??
      meta.client_script ??
      meta.clientScript
  );

  const block = (meta.init || meta.client || {}) as Record<string, unknown>;
  const translations = coerceTranslationsList(meta.translations ?? (block as any).translations);
  if (translations.length > 0) {
    const row = getTranslationByLocale(translations as any, locale) as Record<string, unknown> | null;
    const rowUrl = initScriptUrlFromRow(row);
    const rowInline = initScriptInlineFromRow(row);
    if (rowUrl || rowInline) {
      return {
        initScriptUrl: rowUrl ?? topUrl,
        initScriptInline: rowInline ?? topInline,
      };
    }
  }

  if (topUrl || topInline) {
    return { initScriptUrl: topUrl, initScriptInline: topInline };
  }

  if (block && typeof block === 'object' && !Array.isArray(block)) {
    const nested = coerceTranslationsList((block as any).translations);
    if (nested.length > 0) {
      const row = getTranslationByLocale(nested as any, locale) as Record<string, unknown> | null;
      const rowUrl = initScriptUrlFromRow(row);
      const rowInline = initScriptInlineFromRow(row);
      if (rowUrl || rowInline) {
        return { initScriptUrl: rowUrl, initScriptInline: rowInline };
      }
    }
    return {
      initScriptUrl: optionalStr(
        (block as any).init_script_url ??
          (block as any).initScriptUrl ??
          (block as any).url
      ),
      initScriptInline: optionalStr(
        (block as any).init_script ?? (block as any).initScript ?? (block as any).script
      ),
    };
  }

  return { initScriptUrl: null, initScriptInline: null };
}

function resolveCssSource(meta: Record<string, unknown>, locale: string): ComponentsCssDisplay {
  const topUrl = optionalStr(
    meta.css_url ??
      meta.cssUrl ??
      meta.style_url ??
      meta.styleUrl ??
      meta.stylesheet_url ??
      meta.stylesheetUrl
  );

  const translations = coerceTranslationsList(meta.translations);
  if (translations.length > 0) {
    const row = getTranslationByLocale(translations as any, locale) as Record<string, unknown> | null;
    const rowUrl = cssUrlFromRow(row);
    if (rowUrl) return { cssUrl: rowUrl ?? topUrl };
  }

  const block = (meta.css || meta.style || meta.styles || {}) as Record<string, unknown>;
  if (block && typeof block === 'object' && !Array.isArray(block)) {
    const nested = coerceTranslationsList((block as any).translations);
    if (nested.length > 0) {
      const row = getTranslationByLocale(nested as any, locale) as Record<string, unknown> | null;
      const rowUrl = cssUrlFromRow(row);
      if (rowUrl) return { cssUrl: rowUrl ?? topUrl };
    }
    const url = optionalStr(
      (block as any).css_url ??
        (block as any).cssUrl ??
        (block as any).style_url ??
        (block as any).styleUrl ??
        (block as any).url
    );
    if (url) return { cssUrl: normalizeAssetUrl(url) };
  }

  return { cssUrl: topUrl ? normalizeAssetUrl(topUrl) : null };
}

export function resolveComponentsInitScript(
  metadata: Record<string, unknown> | undefined,
  locale: string
): ComponentsInitScriptDisplay {
  const meta = normalizeComponentMetadata(metadata);
  return resolveInitScriptSource(meta, locale);
}

export function resolveComponentsCss(
  metadata: Record<string, unknown> | undefined,
  locale: string
): ComponentsCssDisplay {
  const meta = normalizeComponentMetadata(metadata);
  return resolveCssSource(meta, locale);
}

export function hasCustomInitScript(display: ComponentsInitScriptDisplay): boolean {
  return Boolean(display.initScriptUrl?.trim() || display.initScriptInline?.trim());
}

/** CMS 迁移：blog_* 模板路径映射到 post_* */
function remapLegacyBlogHtmlUrl(url: string): string {
  return url
    .replace(/\/html\/blog_posts\.default\.html/gi, '/html/post_items.default.html')
    .replace(/\/html\/blog_en\.html/gi, '/html/post_en.html')
    .replace(/\/html\/blog_cn\.html/gi, '/html/post_cn.html')
    .replace(/\/html\/blog_/gi, '/html/post_');
}

export async function fetchHtmlByUrl(rawUrl: string, baseUrl: URL): Promise<string | null> {
  const url = remapLegacyBlogHtmlUrl(rawUrl.trim());
  if (!url) return null;

  try {
    if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url, { headers: { Accept: 'text/html,text/plain,*/*' } });
      if (!res.ok) return null;
      const text = (await res.text()).trim();
      return text || null;
    }

    if (url.startsWith('/')) {
      const absolute = new URL(url, baseUrl);
      const res = await fetch(absolute, { headers: { Accept: 'text/html,text/plain,*/*' } });
      if (!res.ok) return null;
      const text = (await res.text()).trim();
      return text || null;
    }

    console.warn(`[componentsHtml] unsupported html_url scheme: ${url}`);
    return null;
  } catch (err) {
    console.warn(`[componentsHtml] failed to load ${url}`, err);
    return null;
  }
}

export async function loadComponentsHtmlContent(display: ComponentsHtmlDisplay, baseUrl: URL): Promise<string | null> {
  const raw = display.html
    ? display.html
    : display.htmlUrl
      ? await fetchHtmlByUrl(display.htmlUrl, baseUrl)
      : null;
  if (!raw) return null;
  return normalizeCmsComponentHtml(raw);
}

/** 从 metadata 加载展示 HTML；没有外部 html_url / 内联 html 时返回 null，不回退内核模板。 */
export async function loadComponentsHtmlShell(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  const display = resolveComponentsHtmlDisplay(metadata, locale);
  const loaded = await loadComponentsHtmlContent(display, baseUrl);
  return loaded?.trim() || null;
}

/** CMS HTML 应走 bare 全宽布局（无额外 padding / main-container 包裹） */
export function htmlContentUsesBareRoot(html: string | null | undefined): boolean {
  if (!html) return false;
  const trimmed = html.trim();
  if (/^<section[\s>]/i.test(trimmed)) return true;
  if (/^<header[\s>]/i.test(trimmed)) return true;
  if (/^<footer[\s>]/i.test(trimmed)) return true;
  // headerhtml：top-nav + header 组合
  if (/^<div[^>]*\btop-nav\b/i.test(trimmed)) return true;
  return false;
}

/** @deprecated 使用 htmlContentUsesBareRoot */
export function htmlContentUsesRootSection(html: string | null | undefined): boolean {
  return htmlContentUsesBareRoot(html);
}

export function resolveComponentsHtmlDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): ComponentsHtmlDisplay {
  const meta = normalizeComponentMetadata(metadata);
  const source = resolveHtmlSource(meta, locale);

  const layout = (meta.layout || {}) as Record<string, unknown>;
  const translations = coerceTranslationsList(meta.translations);
  const row = getTranslationByLocale(translations as any, locale) as Record<string, unknown> | null;
  const bare = isBareLayout(meta) || row?.bare === true || row?.full_bleed === true;

  return {
    html: source.html,
    htmlUrl: source.htmlUrl,
    bare,
    wrapperClass: strMeta((meta as any).wrapper_class ?? (layout as any).wrapper_class, ''),
    containerClass: bare ? '' : strMeta((meta as any).container_class ?? (layout as any).container_class, 'main-container'),
    ariaLabel: optionalStr((meta as any).aria_label) || (row && optionalStr(row.aria_label)) || null,
  };
}

