/** 购物车区块：优先看组件 type=cart；code 正则仅兼容旧租户 */

export function isCartComponentType(type?: string | null): boolean {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'cart' || t === 'shopcart' || t === 'shoppingcart';
}

const CART_SECTION_CODE_RE = /^cart(\d{1,2})?$/;
const LEGACY_CART_SECTION_CODE_RE = /^(shopcart|shoppingcart)(\d{1,2})?$/;

function matchesCartCode(normalized: string): boolean {
  const cartMatch = CART_SECTION_CODE_RE.exec(normalized);
  if (cartMatch) {
    if (!cartMatch[1]) return true;
    const n = parseInt(cartMatch[1], 10);
    return n >= 1 && n <= 99;
  }
  const legacy = LEGACY_CART_SECTION_CODE_RE.exec(normalized);
  if (!legacy) return false;
  if (!legacy[2]) return true;
  const n = parseInt(legacy[2], 10);
  return n >= 1 && n <= 99;
}

export function isCartSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesCartCode(normalized);
}

export function isCartSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isCartComponentType(slot.componentType) || isCartSectionCode(slot.normalizedCode);
}
