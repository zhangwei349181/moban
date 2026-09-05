/** 登录区块：优先看组件 type=login；code 正则仅兼容旧租户 */

export function isLoginComponentType(type?: string | null): boolean {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'login' || t === 'loginform' || t === 'authlogin';
}

const LOGIN_SECTION_CODE_RE = /^login(\d{1,2})?$/;
const LEGACY_LOGIN_SECTION_CODE_RE = /^(loginform|authlogin)(\d{1,2})?$/;

function matchesLoginCode(normalized: string): boolean {
  const loginMatch = LOGIN_SECTION_CODE_RE.exec(normalized);
  if (loginMatch) {
    if (!loginMatch[1]) return true;
    const n = parseInt(loginMatch[1], 10);
    return n >= 1 && n <= 99;
  }
  const legacy = LEGACY_LOGIN_SECTION_CODE_RE.exec(normalized);
  if (!legacy) return false;
  if (!legacy[2]) return true;
  const n = parseInt(legacy[2], 10);
  return n >= 1 && n <= 99;
}

export function isLoginSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesLoginCode(normalized);
}

export function isLoginSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isLoginComponentType(slot.componentType) || isLoginSectionCode(slot.normalizedCode);
}
