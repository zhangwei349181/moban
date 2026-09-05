/** 动态 PostList 区块：优先看组件 type=postlist；code 正则仅兼容旧租户 */

export function isPostListComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'postlist';
}

/** 动态 PostList 区块 components_code：postlist、postlist01–postlist99（兼容旧 bloglist） */
const POST_LIST_SECTION_CODE_RE = /^postlist(\d{1,2})?$/;
const LEGACY_BLOGLIST_SECTION_CODE_RE = /^bloglist(\d{1,2})?$/;

function matchesPostListCode(normalized: string): boolean {
  for (const re of [POST_LIST_SECTION_CODE_RE, LEGACY_BLOGLIST_SECTION_CODE_RE]) {
    const match = re.exec(normalized);
    if (!match) continue;
    if (!match[1]) return true;
    const n = parseInt(match[1], 10);
    return n >= 1 && n <= 99;
  }
  return false;
}

export function isPostListSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesPostListCode(normalized);
}
