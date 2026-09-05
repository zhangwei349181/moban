/**
 * Terms 页面静态 JSON 加载与解析
 */

import { APP_CONFIG } from '../config/app';
import { fetchWebPage } from './webPage';
import { getTranslationByLocale } from './menu';
import { resolvePolicyDocSections } from './guidePage';
import { getTermsFallback, type TermsPageDisplay } from './termsPageFallback';

export type { TermsPageDisplay } from './termsPageFallback';
export { buildTermsPageMetadataForCdn } from './termsPageFallback';

/** 须与 CDN 文件名一致（区分大小写） */
export const TERMS_PAGE_CODE = 'terms';

interface TermsLocalized {
  language_code: string;
  is_primary?: boolean;
  title?: string;
  label?: string;
  text?: string;
}

type TermsL10nKey = 'title' | 'label' | 'text';

function isPlaceholderString(val: string | undefined): boolean {
  if (!val || !String(val).trim()) return true;
  const t = String(val).trim();
  return t === '...' || t === '…' || /^\.{2,}$/.test(t);
}

function pickTermsL10n(
  translations: TermsLocalized[] | undefined,
  locale: string,
  keys: TermsL10nKey[],
  fallbackRow?: Partial<Pick<TermsLocalized, TermsL10nKey>>
): Partial<Pick<TermsLocalized, TermsL10nKey>> {
  const row = getTranslationByLocale(translations || [], locale) as TermsLocalized | null;
  const out: Partial<Pick<TermsLocalized, TermsL10nKey>> = {};
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

export function resolveTermsPageDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): TermsPageDisplay {
  const fallback = getTermsFallback(locale);
  const meta = metadata || {};

  const seoT = pickTermsL10n(
    (meta.seo as { translations?: TermsLocalized[] })?.translations,
    locale,
    ['title'],
    { title: fallback.seoTitle }
  );
  const breadcrumbT = pickTermsL10n(
    (meta.breadcrumb as { translations?: TermsLocalized[] })?.translations,
    locale,
    ['title', 'label'],
    { title: fallback.breadcrumb.title, label: fallback.breadcrumb.activeLabel }
  );
  const breadcrumbMeta = (meta.breadcrumb || {}) as { home_href?: string };
  const updatedT = pickTermsL10n(
    (meta.updated as { translations?: TermsLocalized[] })?.translations,
    locale,
    ['text'],
    { text: fallback.updatedHtml }
  );
  const introT = pickTermsL10n(
    (meta.intro as { translations?: TermsLocalized[] })?.translations,
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

export async function fetchTermsPageDisplay(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<TermsPageDisplay> {
  const data = await fetchWebPage(TERMS_PAGE_CODE, tenantId);
  return resolveTermsPageDisplay(data?.page?.metadata, locale);
}
