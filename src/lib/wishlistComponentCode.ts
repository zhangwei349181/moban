/** 愿望清单区块：优先看组件 type=wishlist；code 正则仅兼容旧租户 */

export function isWishlistComponentType(type?: string | null): boolean {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'wishlist' || t === 'wishlistpage';
}

const WISHLIST_SECTION_CODE_RE = /^wishlist(\d{1,2})?$/;
const LEGACY_WISHLIST_SECTION_CODE_RE = /^(wishlistpage)(\d{1,2})?$/;

function matchesWishlistCode(normalized: string): boolean {
  const wishlistMatch = WISHLIST_SECTION_CODE_RE.exec(normalized);
  if (wishlistMatch) {
    if (!wishlistMatch[1]) return true;
    const n = parseInt(wishlistMatch[1], 10);
    return n >= 1 && n <= 99;
  }
  const legacy = LEGACY_WISHLIST_SECTION_CODE_RE.exec(normalized);
  if (!legacy) return false;
  if (!legacy[2]) return true;
  const n = parseInt(legacy[2], 10);
  return n >= 1 && n <= 99;
}

export function isWishlistSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesWishlistCode(normalized);
}

export function isWishlistSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return (
    isWishlistComponentType(slot.componentType) || isWishlistSectionCode(slot.normalizedCode)
  );
}
