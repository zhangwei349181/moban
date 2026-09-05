/**
 * Wishlist 客户端引导
 */

import { initWishlistUi } from './wishlistUi.client';

export interface WishlistReadyDetail {
  root: HTMLElement;
}

export function getWishlistSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-wishlist-section]');
}

export function dispatchWishlistReady(): WishlistReadyDetail | null {
  const root = getWishlistSectionRoot();
  if (!root) return null;

  const detail: WishlistReadyDetail = { root };
  document.dispatchEvent(new CustomEvent<WishlistReadyDetail>('gt6:wishlist:ready', { detail }));
  return detail;
}

export interface BootWishlistOptions {
  usePlatformUi: boolean;
}

export function bootWishlist(options: BootWishlistOptions): void {
  const run = () => {
    dispatchWishlistReady();
    if (options.usePlatformUi) {
      void initWishlistUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
