/** 邮箱验证区块：优先看组件 type=verifyemail；code 正则仅兼容旧租户 */

export function isVerifyEmailComponentType(type?: string | null): boolean {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'verifyemail' || t === 'emailverify' || t === 'verifymail';
}

const VERIFYEMAIL_SECTION_CODE_RE = /^verifyemail(\d{1,2})?$/;
const LEGACY_VERIFYEMAIL_SECTION_CODE_RE = /^(emailverify|verifymail)(\d{1,2})?$/;

function matchesVerifyEmailCode(normalized: string): boolean {
  for (const re of [VERIFYEMAIL_SECTION_CODE_RE, LEGACY_VERIFYEMAIL_SECTION_CODE_RE]) {
    const match = re.exec(normalized);
    if (!match) continue;
    if (!match[1]) return true;
    const n = parseInt(match[1], 10);
    return n >= 1 && n <= 99;
  }
  return false;
}

export function isVerifyEmailSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesVerifyEmailCode(normalized);
}

export function isVerifyEmailSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return (
    isVerifyEmailComponentType(slot.componentType) ||
    isVerifyEmailSectionCode(slot.normalizedCode)
  );
}
