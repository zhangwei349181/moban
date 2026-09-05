/**
 * 订阅结账客户端引导
 */

import { initSubscriptionCheckoutUi } from './subscriptionCheckoutUi.client';

export interface BootSubscriptionCheckoutOptions {
  usePlatformUi: boolean;
}

export function bootSubscriptionCheckout(options: BootSubscriptionCheckoutOptions): void {
  const run = () => {
    if (options.usePlatformUi) {
      void initSubscriptionCheckoutUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
