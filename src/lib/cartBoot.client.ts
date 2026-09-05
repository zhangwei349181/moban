/**
 * Cart 客户端引导
 */

import { initCartUi } from './cartUi.client';

export interface CartReadyDetail {
  root: HTMLElement;
}

export function getCartSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-cart-section]');
}

export function dispatchCartReady(): CartReadyDetail | null {
  const root = getCartSectionRoot();
  if (!root) return null;

  const detail: CartReadyDetail = { root };
  document.dispatchEvent(new CustomEvent<CartReadyDetail>('gt6:cart:ready', { detail }));
  return detail;
}

export interface BootCartOptions {
  usePlatformUi: boolean;
}

export function bootCart(options: BootCartOptions): void {
  const run = () => {
    dispatchCartReady();
    if (options.usePlatformUi) {
      void initCartUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
