/** 动态 PostChild 区块：优先看组件 type=postchild；code 正则仅兼容 postchild / postchild01–99 */

export function isPostChildComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'postchild';
}

const POST_CHILD_SECTION_CODE_RE = /^postchild(\d{1,2})?$/;

function matchesPostChildCode(normalized: string): boolean {
  const match = POST_CHILD_SECTION_CODE_RE.exec(normalized);
  if (!match) return false;
  if (!match[1]) return true;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= 99;
}

export function isPostChildSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesPostChildCode(normalized);
}

export function isPostChildSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isPostChildComponentType(slot.componentType) || isPostChildSectionCode(slot.normalizedCode);
}
