/** 订阅结账区块：优先看组件 type=subscriptioncheckout；code 正则仅兼容旧租户 */

export function isSubscriptionCheckoutComponentType(type?: string | null): boolean {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'subscriptioncheckout' || t === 'subscriptioncheckoutpage';
}

const SUBCHECKOUT_SECTION_CODE_RE = /^subscriptioncheckout(\d{1,2})?$/;
const LEGACY_SUBCHECKOUT_SECTION_CODE_RE = /^(subscriptioncheckoutpage)(\d{1,2})?$/;

function matchesSubscriptionCheckoutCode(normalized: string): boolean {
  const match = SUBCHECKOUT_SECTION_CODE_RE.exec(normalized);
  if (match) {
    if (!match[1]) return true;
    const n = parseInt(match[1], 10);
    return n >= 1 && n <= 99;
  }
  const legacy = LEGACY_SUBCHECKOUT_SECTION_CODE_RE.exec(normalized);
  if (!legacy) return false;
  if (!legacy[2]) return true;
  const n = parseInt(legacy[2], 10);
  return n >= 1 && n <= 99;
}

export function isSubscriptionCheckoutSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesSubscriptionCheckoutCode(normalized);
}

export function isSubscriptionCheckoutSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return (
    isSubscriptionCheckoutComponentType(slot.componentType) ||
    isSubscriptionCheckoutSectionCode(slot.normalizedCode)
  );
}
