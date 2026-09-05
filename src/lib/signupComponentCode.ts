/** 注册区块：优先看组件 type=signup；code 正则仅兼容旧租户 */

export function isSignupComponentType(type?: string | null): boolean {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'signup' || t === 'signupform' || t === 'authsignup';
}

const SIGNUP_SECTION_CODE_RE = /^signup(\d{1,2})?$/;
const LEGACY_SIGNUP_SECTION_CODE_RE = /^(signupform|authsignup)(\d{1,2})?$/;

function matchesSignupCode(normalized: string): boolean {
  const signupMatch = SIGNUP_SECTION_CODE_RE.exec(normalized);
  if (signupMatch) {
    if (!signupMatch[1]) return true;
    const n = parseInt(signupMatch[1], 10);
    return n >= 1 && n <= 99;
  }
  const legacy = LEGACY_SIGNUP_SECTION_CODE_RE.exec(normalized);
  if (!legacy) return false;
  if (!legacy[2]) return true;
  const n = parseInt(legacy[2], 10);
  return n >= 1 && n <= 99;
}

export function isSignupSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesSignupCode(normalized);
}

export function isSignupSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isSignupComponentType(slot.componentType) || isSignupSectionCode(slot.normalizedCode);
}
