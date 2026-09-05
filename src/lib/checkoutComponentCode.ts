/** 结账区块：优先看组件 type=checkout；code 正则仅兼容旧租户 */

export function isCheckoutComponentType(type?: string | null): boolean {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'checkout' || t === 'checkoutpage';
}

const CHECKOUT_SECTION_CODE_RE = /^checkout(\d{1,2})?$/;
const LEGACY_CHECKOUT_SECTION_CODE_RE = /^(checkoutpage)(\d{1,2})?$/;

function matchesCheckoutCode(normalized: string): boolean {
  const checkoutMatch = CHECKOUT_SECTION_CODE_RE.exec(normalized);
  if (checkoutMatch) {
    if (!checkoutMatch[1]) return true;
    const n = parseInt(checkoutMatch[1], 10);
    return n >= 1 && n <= 99;
  }
  const legacy = LEGACY_CHECKOUT_SECTION_CODE_RE.exec(normalized);
  if (!legacy) return false;
  if (!legacy[2]) return true;
  const n = parseInt(legacy[2], 10);
  return n >= 1 && n <= 99;
}

export function isCheckoutSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesCheckoutCode(normalized);
}

export function isCheckoutSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isCheckoutComponentType(slot.componentType) || isCheckoutSectionCode(slot.normalizedCode);
}
