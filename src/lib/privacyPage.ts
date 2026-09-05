/**
 * Privacy 页面静态 JSON 加载与解析
 */

import { APP_CONFIG } from '../config/app';
import { fetchWebPage } from './webPage';
import { getTranslationByLocale } from './menu';
import { resolvePolicyDocSections } from './guidePage';
import {
  getPrivacyFallback,
  type PrivacyPageDisplay,
} from './privacyPageFallback';

export type { PrivacyPageDisplay } from './privacyPageFallback';
export { buildPrivacyPageMetadataForCdn } from './privacyPageFallback';

/** 须与 CDN 文件名一致（区分大小写） */
export const PRIVACY_PAGE_CODE = 'privacy';

interface PrivacyLocalized {
  language_code: string;
  is_primary?: boolean;
  title?: string;
  label?: string;
  text?: string;
}

type PrivacyL10nKey = 'title' | 'label' | 'text';

function isPlaceholderString(val: string | undefined): boolean {
  if (!val || !String(val).trim()) return true;
  const t = String(val).trim();
  return t === '...' || t === '…' || /^\.{2,}$/.test(t);
}

function pickPrivacyL10n(
  translations: PrivacyLocalized[] | undefined,
  locale: string,
  keys: PrivacyL10nKey[],
  fallbackRow?: Partial<Pick<PrivacyLocalized, PrivacyL10nKey>>
): Partial<Pick<PrivacyLocalized, PrivacyL10nKey>> {
  const row = getTranslationByLocale(translations || [], locale) as PrivacyLocalized | null;
  const out: Partial<Pick<PrivacyLocalized, PrivacyL10nKey>> = {};
  for (const key of keys) {
    const val = row?.[key];
    if (typeof val === 'string' && !isPlaceholderString(val)) {
      out[key] = val;
    } else if (typeof fallbackRow?.[key] === 'string') {
      out[key] = fallbackRow[key];
    }
  }
  return out;
}

export function resolvePrivacyPageDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): PrivacyPageDisplay {
  const fallback = getPrivacyFallback(locale);
  const meta = metadata || {};

  const seoT = pickPrivacyL10n(
    (meta.seo as { translations?: PrivacyLocalized[] })?.translations,
    locale,
    ['title'],
    { title: fallback.seoTitle }
  );
  const breadcrumbT = pickPrivacyL10n(
    (meta.breadcrumb as { translations?: PrivacyLocalized[] })?.translations,
    locale,
    ['title', 'label'],
    { title: fallback.breadcrumb.title, label: fallback.breadcrumb.activeLabel }
  );
  const breadcrumbMeta = (meta.breadcrumb || {}) as { home_href?: string };
  const updatedT = pickPrivacyL10n(
    (meta.updated as { translations?: PrivacyLocalized[] })?.translations,
    locale,
    ['text'],
    { text: fallback.updatedHtml }
  );
  const introT = pickPrivacyL10n(
    (meta.intro as { translations?: PrivacyLocalized[] })?.translations,
    locale,
    ['text'],
    { text: fallback.introHtml }
  );

  return {
    seoTitle: seoT.title || fallback.seoTitle,
    breadcrumb: {
      title: breadcrumbT.title || fallback.breadcrumb.title,
      activeLabel: breadcrumbT.label || fallback.breadcrumb.activeLabel,
      homeHref:
        typeof breadcrumbMeta.home_href === 'string' && breadcrumbMeta.home_href
          ? breadcrumbMeta.home_href
          : fallback.breadcrumb.homeHref,
    },
    updatedHtml: updatedT.text || fallback.updatedHtml,
    introHtml: introT.text || fallback.introHtml,
    sections: resolvePolicyDocSections(
      meta.sections as Parameters<typeof resolvePolicyDocSections>[0],
      locale,
      fallback.sections
    ),
  };
}

export async function fetchPrivacyPageDisplay(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<PrivacyPageDisplay> {
  const data = await fetchWebPage(PRIVACY_PAGE_CODE, tenantId);
  return resolvePrivacyPageDisplay(data?.page?.metadata, locale);
}
