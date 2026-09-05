/** 动态 PostSingle 区块：优先看组件 type=postsingle；code 正则仅兼容旧租户 */

export function isPostSingleComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'postsingle';
}

/** 动态 PostSingle 区块 components_code：postsingle、postsingle01–postsingle99（兼容旧 blogsingle） */
const POST_SINGLE_SECTION_CODE_RE = /^postsingle(\d{1,2})?$/;
const LEGACY_BLOGSINGLE_SECTION_CODE_RE = /^blogsingle(\d{1,2})?$/;

function matchesPostSingleCode(normalized: string): boolean {
  for (const re of [POST_SINGLE_SECTION_CODE_RE, LEGACY_BLOGSINGLE_SECTION_CODE_RE]) {
    const match = re.exec(normalized);
    if (!match) continue;
    if (!match[1]) return true;
    const n = parseInt(match[1], 10);
    return n >= 1 && n <= 99;
  }
  return false;
}

export function isPostSingleSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesPostSingleCode(normalized);
}

export function isPostSingleSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isPostSingleComponentType(slot.componentType) || isPostSingleSectionCode(slot.normalizedCode);
}
