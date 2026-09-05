/**
 * dashboard 壳：{{DASHBOARD_CONFIG_JSON}} + {{子组件code}} 嵌套 dashboardpanel
 */

import { APP_CONFIG } from '../config/app';
import { normalizeCmsComponentHtml } from './cmsComponentHtml';
import { fetchWebComponent } from './webComponent';
import {
  applyChromePlaceholderReplacements,
  extractChromePlaceholderCodes,
} from './chromeComponentCode';
import {
  isDashboardComponentType,
  isDashboardNestableCode,
  isDashboardPanelComponentType,
  isDashboardScalarPlaceholder,
  isDashboardSectionCode,
} from './dashboardComponentCode';
import {
  loadComponentsHtmlContent,
  resolveComponentsCss,
  resolveComponentsInitScript,
  resolveComponentsHtmlDisplay,
  splitInlineScriptsFromHtml,
  type ExtractedHtmlScript,
} from '../components/sections/resolvers/componentsHtml';
import { normalizeAssetUrl } from '../components/sections/resolvers/_shared';
import type { DashboardSectionMeta } from '../components/sections/resolvers/dashboard';

export interface DashboardClientConfig {
  loginUrl: string;
  homeUrl: string;
  defaultPanel: string;
}

export interface DashboardScriptRef {
  src?: string;
  inline?: string;
  code?: string;
}

export interface DashboardPartRender {
  code: string;
  html: string;
  cssUrl: string | null;
  initScriptUrl: string | null;
  initScriptInline: string | null;
  inlineHtmlScripts: ExtractedHtmlScript[];
}

export interface RenderDashboardTemplateResult {
  html: string;
  cssUrls: string[];
  scriptRefs: DashboardScriptRef[];
  parts: DashboardPartRender[];
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function dedupeCssUrls(urls: string[]): string[] {
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

function applyTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.split(`{{${key}}}`).join(value),
    template
  );
}

function mergePartClass(existing: string, code: string): string {
  const partClass = `dashboard-part dashboard-part--${code}`;
  const trimmed = existing.trim();
  if (!trimmed) return partClass;
  if (trimmed.split(/\s+/).includes(`dashboard-part--${code}`)) return trimmed;
  return `${trimmed} ${partClass}`;
}

function prepareDashboardPartHtml(code: string, innerHtml: string, componentId: string): string {
  const trimmed = innerHtml.trim();
  if (!trimmed) return '';

  const gt6Attrs = componentId
    ? ` data-gt6-component-name="${escapeHtmlAttr(code)}" data-gt6-component-id="${escapeHtmlAttr(componentId)}" data-gt6-normalized-code="${escapeHtmlAttr(code)}"`
    : '';
  const dataAttrs = ` data-dashboard-part="${escapeHtmlAttr(code)}" data-components-html-slot data-dashboard-nested="1"${gt6Attrs}`;

  const singleRoot = /^<([a-zA-Z][\w-]*)([^>]*?)>([\s\S]*)<\/\1>\s*$/.exec(trimmed);
  if (singleRoot) {
    const [, tag, rawAttrs, inner] = singleRoot;
    let attrs = rawAttrs || '';
    const classRe = /\sclass\s*=\s*("([^"]*)"|'([^']*)')/;
    const classMatch = classRe.exec(attrs);
    if (classMatch) {
      const quote = classMatch[1][0];
      const existing = classMatch[2] ?? classMatch[3] ?? '';
      const merged = mergePartClass(existing, code);
      attrs = attrs.replace(classRe, ` class=${quote}${merged}${quote}`);
    } else {
      attrs = `${attrs} class="${mergePartClass('', code)}"`;
    }
    if (!/\bdata-dashboard-part\s*=/.test(attrs)) {
      attrs = `${attrs}${dataAttrs}`;
    }
    return `<${tag}${attrs}>${inner}</${tag}>`;
  }

  return `<div class="dashboard-part dashboard-part--${code}" style="display:contents" data-dashboard-part="${escapeHtmlAttr(code)}" data-components-html-slot data-dashboard-nested="1"${gt6Attrs}>${trimmed}</div>`;
}

async function loadNestedPart(
  code: string,
  locale: string,
  tenantId: string,
  baseUrl: URL
): Promise<DashboardPartRender | null> {
  const record = await fetchWebComponent(code, tenantId);
  const metadata = (record?.metadata || {}) as Record<string, unknown>;
  if (!record || !Object.keys(metadata).length) {
    if (import.meta.env.DEV) {
      console.warn(`[dashboardTemplate] nested component not found or empty metadata: ${code}`);
    }
    return null;
  }

  const nestedType = String(record.type ?? '').trim().toLowerCase();
  if (isDashboardComponentType(nestedType) || isDashboardSectionCode(code)) {
    if (import.meta.env.DEV) {
      console.warn(`[dashboardTemplate] cannot nest dashboard shell {{${code}}}`);
    }
    return null;
  }
  if (
    nestedType &&
    !isDashboardPanelComponentType(nestedType) &&
    nestedType !== 'static' &&
    !isDashboardNestableCode(code)
  ) {
    if (import.meta.env.DEV) {
      console.warn(`[dashboardTemplate] {{${code}}} type=${nestedType} is not nestable in dashboard shell`);
    }
    return null;
  }

  const display = resolveComponentsHtmlDisplay(metadata, locale);
  const htmlRaw = await loadComponentsHtmlContent(display, baseUrl);
  if (!htmlRaw?.trim()) {
    if (import.meta.env.DEV) {
      console.warn(`[dashboardTemplate] nested component has no html: ${code}`);
    }
    return null;
  }

  const parsed = splitInlineScriptsFromHtml(normalizeCmsComponentHtml(htmlRaw));
  const css = resolveComponentsCss(metadata, locale);
  const init = resolveComponentsInitScript(metadata, locale);

  return {
    code,
    html: prepareDashboardPartHtml(code, parsed.html, record.id || ''),
    cssUrl: css.cssUrl,
    initScriptUrl: init.initScriptUrl,
    initScriptInline: init.initScriptInline,
    inlineHtmlScripts: parsed.scripts,
  };
}

export async function renderDashboardSectionHtml(
  metadata: Record<string, unknown>,
  locale: string,
  baseUrl: URL,
  sectionMeta: DashboardSectionMeta,
  tenantId: string = APP_CONFIG.tenantId,
  preloadedShell?: string | null
): Promise<RenderDashboardTemplateResult | null> {
  const shellHtmlRaw =
    preloadedShell ??
    (await loadComponentsHtmlContent(resolveComponentsHtmlDisplay(metadata, locale), baseUrl));
  if (!shellHtmlRaw?.trim()) return null;

  const shellParsed = splitInlineScriptsFromHtml(normalizeCmsComponentHtml(shellHtmlRaw));
  const clientConfig: DashboardClientConfig = {
    loginUrl: sectionMeta.loginUrl,
    homeUrl: sectionMeta.homeUrl,
    defaultPanel: sectionMeta.defaultPanel,
  };

  let templateHtml = applyTemplate(shellParsed.html, {
    DASHBOARD_CONFIG_JSON: escapeHtmlAttr(JSON.stringify(clientConfig)),
  });

  const placeholderCodes = extractChromePlaceholderCodes(templateHtml);
  const replacements = new Map<string, string>();
  const parts: DashboardPartRender[] = [];
  const cssUrls: string[] = [];
  const scriptRefs: DashboardScriptRef[] = [];
  const fetched = new Map<string, DashboardPartRender | null>();

  for (const code of placeholderCodes) {
    if (isDashboardScalarPlaceholder(code) || isDashboardSectionCode(code)) {
      replacements.set(code, '');
      continue;
    }

    if (fetched.has(code)) {
      const cached = fetched.get(code);
      replacements.set(code, cached?.html ?? '');
      continue;
    }

    const part = await loadNestedPart(code, locale, tenantId, baseUrl);
    fetched.set(code, part);
    if (!part) {
      replacements.set(code, '');
      continue;
    }

    parts.push(part);
    replacements.set(code, part.html);
    if (part.cssUrl) cssUrls.push(part.cssUrl);
    if (part.initScriptUrl) scriptRefs.push({ src: part.initScriptUrl, code });
    if (part.initScriptInline) scriptRefs.push({ inline: part.initScriptInline, code });
    for (const item of part.inlineHtmlScripts) {
      scriptRefs.push({ ...item, code });
    }
  }

  templateHtml = applyChromePlaceholderReplacements(templateHtml, replacements);

  const shellCss = resolveComponentsCss(metadata, locale);
  const shellInit = resolveComponentsInitScript(metadata, locale);
  if (shellCss.cssUrl) cssUrls.unshift(shellCss.cssUrl);
  if (shellInit.initScriptUrl) scriptRefs.unshift({ src: shellInit.initScriptUrl, code: 'shell' });
  if (shellInit.initScriptInline) {
    scriptRefs.unshift({ inline: shellInit.initScriptInline, code: 'shell' });
  }
  for (const item of shellParsed.scripts) {
    scriptRefs.push({ ...item, code: 'shell' });
  }

  return {
    html: templateHtml,
    cssUrls: dedupeCssUrls(cssUrls),
    scriptRefs,
    parts,
  };
}

export function renderDashboardPanelHtml(panelHtml: string | null): string {
  return panelHtml?.trim() || '';
}

export { renderDashboardSectionHtml as renderDashboardTemplate };
