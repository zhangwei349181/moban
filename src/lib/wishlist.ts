/**
 * 愿望清单（与 shoplist list01 / wishlist01 共用 localStorage 键）
 */
export const WISHLIST_STORAGE_KEY = 'wishlist_product_ids';

export function getWishlist(): string[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const ids = JSON.parse(stored) as string[];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function saveWishlist(ids: string[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore quota / private mode
  }
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().includes(productId);
}

/** 切换后返回当前是否在清单中 */
export function toggleWishlist(productId: string): boolean {
  const wishlist = getWishlist();
  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(productId);
  }
  saveWishlist(wishlist);
  return wishlist.includes(productId);
}
