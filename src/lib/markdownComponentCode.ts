/** 远程 Markdown 区块：优先看组件 type=markdown；code 正则仅兼容旧租户 */

export function isMarkdownComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'markdown';
}

/** 远程 Markdown 区块 components_code：markdown、markdown01–markdown99 */
const MARKDOWN_SECTION_CODE_RE = /^markdown(\d{1,2})?$/;

function matchesMarkdownCode(normalized: string): boolean {
  const match = MARKDOWN_SECTION_CODE_RE.exec(normalized);
  if (!match) return false;
  if (!match[1]) return true;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= 99;
}

export function isMarkdownSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesMarkdownCode(normalized);
}

export function isMarkdownSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isMarkdownComponentType(slot.componentType) || isMarkdownSectionCode(slot.normalizedCode);
}
