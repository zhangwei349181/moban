/**
 * header / footer 壳 + {{子组件}} 嵌套 chrome 子块
 *
 * 新组件靠记录字段 type：header | footer | chrome。
 * 旧名 headerhtml / footerhtml / header* / footer* 仅作兼容。
 */

import { isCmsHtmlStaticSlotCode } from './cmsComponentHtml';

const CHROME_PLACEHOLDER_RE = /\{\{([a-zA-Z0-9_-]+)\}\}/g;

export type ChromeShellKind = 'header' | 'footer';

export function isHeaderComponentType(type: unknown): boolean {
  return String(type ?? '').trim().toLowerCase() === 'header';
}

export function isFooterComponentType(type: unknown): boolean {
  return String(type ?? '').trim().toLowerCase() === 'footer';
}

export function isChromeComponentType(type: unknown): boolean {
  return String(type ?? '').trim().toLowerCase() === 'chrome';
}

/** 壳编码：旧 headerhtml/footerhtml，或 header01 / footer01 这种「类型名+数字」 */
export function isChromeShellCode(code: string): boolean {
  const c = String(code || '').trim().toLowerCase();
  if (c === 'headerhtml' || c === 'footerhtml') return true;
  if (/^header\d+$/.test(c) || /^footer\d+$/.test(c)) return true;
  return false;
}

export function resolveChromeShellKind(
  code: string,
  type?: string | null
): ChromeShellKind | null {
  if (isHeaderComponentType(type)) return 'header';
  if (isFooterComponentType(type)) return 'footer';
  const c = String(code || '').trim().toLowerCase();
  if (c === 'headerhtml' || /^header\d+$/.test(c)) return 'header';
  if (c === 'footerhtml' || /^footer\d+$/.test(c)) return 'footer';
  return null;
}

/**
 * 壳里嵌套的子块编码（headerlogo01、headernav01…）。
 * 不含壳本身（header01 / headerhtml）。
 */
export function isChromeNestedCode(code: string): boolean {
  const c = String(code || '').trim().toLowerCase();
  if (!c || isChromeShellCode(c)) return false;
  if (/^header[a-z0-9_-]+$/.test(c)) return true;
  if (/^footer[a-z0-9_-]+$/.test(c)) return true;
  return false;
}

/** 是否允许作为壳模板 {{tag}} 嵌入（code 层；type=chrome/static 见 chromeTemplate 再确认） */
export function isChromeTemplateNestableCode(code: string): boolean {
  return isChromeNestedCode(code) || isCmsHtmlStaticSlotCode(code);
}

export function isExcludedFromPageBodyCode(code: string): boolean {
  return isChromeShellCode(code) || isChromeNestedCode(code);
}

export function extractChromePlaceholderCodes(templateHtml: string): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  const re = new RegExp(CHROME_PLACEHOLDER_RE.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(templateHtml)) !== null) {
    const code = String(match[1] || '').trim().toLowerCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
}

export function applyChromePlaceholderReplacements(
  templateHtml: string,
  replacements: Map<string, string>
): string {
  return templateHtml.replace(CHROME_PLACEHOLDER_RE, (_full, rawCode: string) => {
    const code = String(rawCode || '').trim().toLowerCase();
    return replacements.get(code) ?? '';
  });
}
