/** 动态 ListFilter 区块：优先看组件 type=listfilter；code 正则仅兼容旧租户 */

export function isListFilterComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'listfilter';
}

/** 动态 ListFilter 区块 components_code：listfilter、listfilter01–listfilter99 */
const LIST_FILTER_SECTION_CODE_RE = /^listfilter(\d{1,2})?$/;

function matchesListFilterCode(normalized: string): boolean {
  const match = LIST_FILTER_SECTION_CODE_RE.exec(normalized);
  if (!match) return false;
  if (!match[1]) return true;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= 99;
}

export function isListFilterSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesListFilterCode(normalized);
}
