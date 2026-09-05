/** 动态 Post 区块：优先看组件 type=post；code 正则仅兼容旧租户 */

export function isPostComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'post';
}

/** 动态 Post 区块 components_code：post、post01–post99（兼容旧 blog、blog01–blog99） */
const POST_SECTION_CODE_RE = /^post(\d{1,2})?$/;
const LEGACY_BLOG_SECTION_CODE_RE = /^blog(\d{1,2})?$/;

function matchesPostOrLegacyBlogCode(normalized: string): boolean {
  for (const re of [POST_SECTION_CODE_RE, LEGACY_BLOG_SECTION_CODE_RE]) {
    const match = re.exec(normalized);
    if (!match) continue;
    if (!match[1]) return true;
    const n = parseInt(match[1], 10);
    return n >= 1 && n <= 99;
  }
  return false;
}

export function isPostSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesPostOrLegacyBlogCode(normalized);
}
