/** 动态 Pricing 区块：type=pricing；旧 code pricing / pricing01–99 / subscriptionpricing */

const PRICING_SECTION_CODE_RE = /^pricing(\d{1,2})?$/;
const SUBSCRIPTION_PRICING_CODE_RE = /^subscriptionpricing(\d{1,2})?$/;

export function isPricingComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'pricing';
}

function matchesPricingCode(normalized: string): boolean {
  for (const re of [PRICING_SECTION_CODE_RE, SUBSCRIPTION_PRICING_CODE_RE]) {
    const match = re.exec(normalized);
    if (!match) continue;
    if (!match[1]) return true;
    const n = parseInt(match[1], 10);
    return n >= 1 && n <= 99;
  }
  return false;
}

export function isPricingSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesPricingCode(normalized);
}
