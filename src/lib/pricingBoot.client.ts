/**
 * Pricing 客户端引导
 */

import { initPricingUi } from './pricingUi.client';

export interface BootPricingOptions {
  usePlatformUi: boolean;
}

export function bootPricing(options: BootPricingOptions): void {
  const run = () => {
    if (options.usePlatformUi) {
      initPricingUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
