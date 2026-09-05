/**
 * Checkout 客户端引导
 */

import { initCheckoutUi } from './checkoutUi.client';

export interface CheckoutReadyDetail {
  root: HTMLElement;
}

export function getCheckoutSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-checkout-section]');
}

export function dispatchCheckoutReady(): CheckoutReadyDetail | null {
  const root = getCheckoutSectionRoot();
  if (!root) return null;

  const detail: CheckoutReadyDetail = { root };
  document.dispatchEvent(new CustomEvent<CheckoutReadyDetail>('gt6:checkout:ready', { detail }));
  return detail;
}

export interface BootCheckoutOptions {
  usePlatformUi: boolean;
}

export function bootCheckout(options: BootCheckoutOptions): void {
  const run = () => {
    dispatchCheckoutReady();
    if (options.usePlatformUi) {
      void initCheckoutUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
