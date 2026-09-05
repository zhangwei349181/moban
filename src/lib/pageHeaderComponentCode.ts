/** 动态 PageHeader 区块：优先看组件 type=pageheader；code 正则仅兼容旧租户 */

export function isPageHeaderComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'pageheader';
}

/** 动态 PageHeader 区块 components_code：pageheader、pageheader01–pageheader99 */
const PAGE_HEADER_SECTION_CODE_RE = /^pageheader(\d{1,2})?$/;

function matchesPageHeaderCode(normalized: string): boolean {
  const match = PAGE_HEADER_SECTION_CODE_RE.exec(normalized);
  if (!match) return false;
  if (!match[1]) return true;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= 99;
}

export function isPageHeaderSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesPageHeaderCode(normalized);
}

export function isPageHeaderSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isPageHeaderComponentType(slot.componentType) || isPageHeaderSectionCode(slot.normalizedCode);
}
