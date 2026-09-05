/**
 * headerhtml / footerhtml：壳模板 + {{tag}} 嵌套静态子组件（直接 fetchWebComponent）
 */

import { APP_CONFIG } from '../config/app';
import { getTranslationByLocale } from './translations';
import { normalizeCmsComponentHtml } from './cmsComponentHtml';
import {
  applyChromePlaceholderReplacements,
  extractChromePlaceholderCodes,
  isChromeShellCode,
  isChromeTemplateNestableCode,
  type ChromeShellKind,
} from './chromeComponentCode';
import { fetchWebComponent } from './webComponent';
import {
  loadComponentsHtmlContent,
  resolveComponentsCss,
  resolveComponentsInitScript,
  resolveComponentsHtmlDisplay,
  splitInlineScriptsFromHtml,
  type ExtractedHtmlScript,
} from '../components/sections/resolvers/componentsHtml';
import { normalizeAssetUrl } from '../components/sections/resolvers/_shared';

export interface ChromeScriptRef {
  src?: string;
  inline?: string;
  type?: string;
  code?: string;
}

export interface ChromePartRender {
  code: string;
  html: string;
  cssUrl: string | null;
  initScriptUrl: string | null;
  initScriptInline: string | null;
  inlineHtmlScripts: ExtractedHtmlScript[];
}

export interface RenderChromeTemplateResult {
  kind: ChromeShellKind;
  html: string | null;
  cssUrls: string[];
  scriptRefs: ChromeScriptRef[];
  parts: ChromePartRender[];
  useBareLayout: boolean;
  shellInitScriptUrl: string | null;
  shellInitScriptInline: string | null;
  shellInlineHtmlScripts: ExtractedHtmlScript[];
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

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

const CHROME_PART_CLASS_PREFIX = 'chrome-part';

function mergeChromePartClass(existing: string, code: string): string {
  const partClass = `${CHROME_PART_CLASS_PREFIX} ${CHROME_PART_CLASS_PREFIX}--${code}`;
  const trimmed = existing.trim();
  if (!trimmed) return partClass;
  if (trimmed.split(/\s+/).includes(`${CHROME_PART_CLASS_PREFIX}--${code}`)) return trimmed;
  return `${trimmed} ${partClass}`;
}

export interface ChromePartEditMeta {
  componentId: string;
  kind: ChromeShellKind;
  editLabel: string;
}

/**
 * 单根元素：把 data-* / chrome-part class 合并到根节点，避免额外 wrapper 破坏 grid/flex。
 * 多根片段：外包一层 display:contents 的 wrapper（不参与布局）。
 * 编辑底栏由客户端在编辑态注入（见 gt6-edit-mode.js），不在此处包裹 DOM。
 */
export function prepareChromePartHtml(
  code: string,
  innerHtml: string,
  editMeta?: ChromePartEditMeta
): string {
  const trimmed = innerHtml.trim();
  if (!trimmed) return '';

  const gt6Attrs = editMeta
    ? ` data-gt6-component-name="${escapeHtmlAttr(code)}" data-gt6-component-id="${escapeHtmlAttr(editMeta.componentId)}" data-gt6-normalized-code="${escapeHtmlAttr(code)}" data-gt6-chrome-kind="${escapeHtmlAttr(editMeta.kind)}" data-gt6-chrome-edit-label="${escapeHtmlAttr(editMeta.editLabel)}"`
    : '';

  const singleRoot = /^<([a-zA-Z][\w-]*)([^>]*?)>([\s\S]*)<\/\1>\s*$/.exec(trimmed);
  if (singleRoot) {
    const [, tag, rawAttrs, inner] = singleRoot;
    const dataAttrs = ` data-chrome-part="${escapeHtmlAttr(code)}" data-components-html-slot data-chrome-nested="1"${gt6Attrs}`;
    let attrs = rawAttrs || '';

    const classRe = /\sclass\s*=\s*("([^"]*)"|'([^']*)')/;
    const classMatch = classRe.exec(attrs);
    if (classMatch) {
      const quote = classMatch[1][0];
      const existing = classMatch[2] ?? classMatch[3] ?? '';
      const merged = mergeChromePartClass(existing, code);
      attrs = attrs.replace(classRe, ` class=${quote}${merged}${quote}`);
    } else {
      attrs = `${attrs} class="${mergeChromePartClass('', code)}"`;
    }

    if (!/\bdata-chrome-part\s*=/.test(attrs)) {
      attrs = `${attrs}${dataAttrs}`;
    }

    return `<${tag}${attrs}>${inner}</${tag}>`;
  }

  return `<div class="${CHROME_PART_CLASS_PREFIX} ${CHROME_PART_CLASS_PREFIX}--${code}" style="display:contents" data-chrome-part="${escapeHtmlAttr(code)}" data-components-html-slot data-chrome-nested="1"${gt6Attrs}>${trimmed}</div>`;
}

async function loadNestedPartHtml(
  code: string,
  locale: string,
  tenantId: string,
  baseUrl: URL,
  kind: ChromeShellKind
): Promise<ChromePartRender | null> {
  const record = await fetchWebComponent(code, tenantId);
  const metadata = (record?.metadata || {}) as Record<string, unknown>;
  if (!record || !Object.keys(metadata).length) {
    if (import.meta.env.DEV) {
      console.warn(`[chromeTemplate] nested component not found or empty metadata: ${code}`);
    }
    return null;
  }

  const nestedType = String(record.type ?? '').trim().toLowerCase();
  if (nestedType === 'header' || nestedType === 'footer' || nestedType === 'layout' || isChromeShellCode(code)) {
    if (import.meta.env.DEV) {
      console.warn(`[chromeTemplate] cannot nest shell/layout {{${code}}}`);
    }
    return null;
  }
  if (
    nestedType &&
    nestedType !== 'chrome' &&
    nestedType !== 'static' &&
    !isChromeTemplateNestableCode(code)
  ) {
    if (import.meta.env.DEV) {
      console.warn(`[chromeTemplate] {{${code}}} type=${nestedType} is not nestable in ${kind} shell`);
    }
    return null;
  }

  const display = resolveComponentsHtmlDisplay(metadata, locale);
  const htmlRaw = await loadComponentsHtmlContent(display, baseUrl);
  if (!htmlRaw?.trim()) {
    if (import.meta.env.DEV) {
      console.warn(`[chromeTemplate] nested component has no html: ${code}`);
    }
    return null;
  }

  const parsed = splitInlineScriptsFromHtml(normalizeCmsComponentHtml(htmlRaw));
  const css = resolveComponentsCss(metadata, locale);
  const init = resolveComponentsInitScript(metadata, locale);
  const editLabel = getTranslationByLocale(locale, 'gt6_edit_chrome_shell');
  const componentId = record.id || '';

  return {
    code,
    html: prepareChromePartHtml(code, parsed.html, {
      componentId,
      kind,
      editLabel,
    }),
    cssUrl: css.cssUrl,
    initScriptUrl: init.initScriptUrl,
    initScriptInline: init.initScriptInline,
    inlineHtmlScripts: parsed.scripts,
  };
}

export async function renderChromeTemplate(
  metadata: Record<string, unknown>,
  locale: string,
  baseUrl: URL,
  kind: ChromeShellKind,
  tenantId: string = APP_CONFIG.tenantId
): Promise<RenderChromeTemplateResult | null> {
  const shellDisplay = resolveComponentsHtmlDisplay(metadata, locale);
  const shellHtmlRaw = await loadComponentsHtmlContent(shellDisplay, baseUrl);
  if (!shellHtmlRaw?.trim()) return null;

  const shellParsed = splitInlineScriptsFromHtml(normalizeCmsComponentHtml(shellHtmlRaw));
  let templateHtml = shellParsed.html;

  const placeholderCodes = extractChromePlaceholderCodes(templateHtml);
  const replacements = new Map<string, string>();
  const parts: ChromePartRender[] = [];
  const cssUrls: string[] = [];
  const scriptRefs: ChromeScriptRef[] = [];

  for (const code of placeholderCodes) {
    if (isChromeShellCode(code)) {
      if (import.meta.env.DEV) {
        console.warn(`[chromeTemplate] invalid placeholder {{${code}}} in ${kind} shell`);
      }
      replacements.set(code, '');
      continue;
    }

    const part = await loadNestedPartHtml(code, locale, tenantId, baseUrl, kind);
    if (!part) {
      replacements.set(code, '');
      continue;
    }

    parts.push(part);
    replacements.set(code, part.html);

    if (part.cssUrl) cssUrls.push(part.cssUrl);
    if (part.initScriptUrl) {
      scriptRefs.push({ src: part.initScriptUrl, type: 'module', code });
    }
    if (part.initScriptInline) {
      scriptRefs.push({ inline: part.initScriptInline, type: 'module', code });
    }
    for (const item of part.inlineHtmlScripts) {
      scriptRefs.push({ ...item, code });
    }
  }

  templateHtml = applyChromePlaceholderReplacements(templateHtml, replacements);

  const shellCss = resolveComponentsCss(metadata, locale);
  const shellInit = resolveComponentsInitScript(metadata, locale);
  if (shellCss.cssUrl) cssUrls.unshift(shellCss.cssUrl);

  const allCssUrls = dedupeCssUrls(cssUrls);

  return {
    kind,
    html: templateHtml,
    cssUrls: allCssUrls,
    scriptRefs,
    parts,
    useBareLayout: shellDisplay.bare || /^<(header|footer|div|nav)\b/i.test(templateHtml.trim()),
    shellInitScriptUrl: shellInit.initScriptUrl,
    shellInitScriptInline: shellInit.initScriptInline,
    shellInlineHtmlScripts: shellParsed.scripts,
  };
}
