import { strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface PricingSectionMeta {
  checkoutUrl: string;
}

const FALLBACK = {
  checkoutUrl: '/subscriptioncheckout',
};

export function resolvePricingSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PricingSectionMeta {
  const meta = metadata || {};
  void locale;
  return {
    checkoutUrl: strMeta(meta.checkout_url ?? meta.checkoutUrl, FALLBACK.checkoutUrl),
  };
}

/** 从 metadata.translations[].html_url 加载皮；没有则返回 null，不回退内核 HTML。 */
export async function loadPricingSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}

export { resolveCommerceClientInit as resolvePricingClientInit } from '../../../lib/commerceInit';
