/**
 * About 页面静态 JSON 加载与解析
 */

import { APP_CONFIG } from '../config/app';
import { fetchWebPage } from './webPage';
import { getTranslationByLocale } from './menu';
import {
  getAboutFallback,
  type AboutHighlightDisplay,
  type AboutStatDisplay,
  type AboutBrandDisplay,
  type AboutReviewDisplay,
  type AboutPageDisplay,
} from './aboutPageFallback';

export type {
  AboutHighlightDisplay,
  AboutStatDisplay,
  AboutBrandDisplay,
  AboutReviewDisplay,
  AboutPageDisplay,
} from './aboutPageFallback';
export { buildAboutPageMetadataForCdn } from './aboutPageFallback';

interface AboutLocalized {
  language_code: string;
  is_primary?: boolean;
  title?: string;
  label?: string;
  text?: string;
  subtitle?: string;
}

type AboutL10nKey = 'title' | 'label' | 'text' | 'subtitle';

/** 后台占位符（如 "..."）视为未填写 */
function isPlaceholderString(val: string | undefined): boolean {
  if (!val || !String(val).trim()) return true;
  const t = String(val).trim();
  return t === '...' || t === '…' || /^\.{2,}$/.test(t);
}

function pickAboutL10n(
  translations: AboutLocalized[] | undefined,
  locale: string,
  keys: AboutL10nKey[],
  fallbackRow?: Partial<Pick<AboutLocalized, AboutL10nKey>>
): Partial<Pick<AboutLocalized, AboutL10nKey>> {
  const row = getTranslationByLocale(translations || [], locale) as AboutLocalized | null;
  const out: Partial<Pick<AboutLocalized, AboutL10nKey>> = {};
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

/** CDN 条数不足时用本地 fallback 补齐，避免轮播/栅格变形 */
function mergeAboutItems<T, M>(
  items: M[] | undefined,
  fallback: T[],
  mapItem: (item: M | undefined, index: number, fb: T) => T
): T[] {
  if (!fallback.length) return [];
  const src = Array.isArray(items) ? items : [];
  const len = Math.max(src.length, fallback.length);
  return Array.from({ length: len }, (_, i) => {
    const fb = fallback[i] ?? fallback[fallback.length - 1];
    return mapItem(src[i], i, fb);
  });
}

/** 须与 CDN 文件名一致（区分大小写） */
export const ABOUT_PAGE_CODE = 'about';
function resolveHighlights(
  items: Array<{ icon?: string; translations?: AboutLocalized[] }> | undefined,
  locale: string,
  fallback: AboutHighlightDisplay[]
): AboutHighlightDisplay[] {
  return mergeAboutItems(items, fallback, (item, _i, fb) => {
    if (!item) return fb;
    const t = pickAboutL10n(item.translations, locale, ['title'], { title: fb.text });
    return {
      icon: typeof item.icon === 'string' && item.icon ? item.icon : fb.icon,
      text: t.title || fb.text,
    };
  });
}

function resolveStats(
  items: Array<{ icon?: string; value?: string; translations?: AboutLocalized[] }> | undefined,
  locale: string,
  fallback: AboutStatDisplay[]
): AboutStatDisplay[] {
  return mergeAboutItems(items, fallback, (item, _i, fb) => {
    if (!item) return fb;
    const t = pickAboutL10n(item.translations, locale, ['label', 'text'], {
      label: fb.label,
      text: fb.text,
    });
    return {
      icon: typeof item.icon === 'string' && item.icon ? item.icon : fb.icon,
      value: typeof item.value === 'string' && item.value ? item.value : fb.value,
      label: t.label || fb.label,
      text: t.text || fb.text,
    };
  });
}

function resolveBrands(
  items: Array<{ image?: string; alt?: string; name?: string; translations?: AboutLocalized[] }> | undefined,
  locale: string,
  fallback: AboutBrandDisplay[]
): AboutBrandDisplay[] {
  return mergeAboutItems(items, fallback, (item, _i, fb) => {
    if (!item) return fb;
    const t = pickAboutL10n(item.translations, locale, ['label', 'text'], {
      label: fb.subtitle,
      text: fb.description,
    });
    return {
      image: typeof item.image === 'string' && item.image ? item.image : fb.image,
      alt: typeof item.alt === 'string' ? item.alt : typeof item.name === 'string' ? item.name : fb.alt,
      name: typeof item.name === 'string' && item.name ? item.name : fb.name,
      subtitle: t.label || fb.subtitle,
      description: t.text || fb.description,
    };
  });
}

function resolveReviews(
  items: Array<{ image?: string; translations?: AboutLocalized[] }> | undefined,
  locale: string,
  fallback: AboutReviewDisplay[]
): AboutReviewDisplay[] {
  return mergeAboutItems(items, fallback, (item, _i, fb) => {
    if (!item) return fb;
    const t = pickAboutL10n(item.translations, locale, ['title', 'text', 'label', 'subtitle'], {
      title: fb.title,
      text: fb.quote,
      label: fb.profileTitle,
      subtitle: fb.profileSubtitle,
    });
    return {
      image: typeof item.image === 'string' && item.image ? item.image : fb.image,
      title: t.title || fb.title,
      quote: t.text || fb.quote,
      profileTitle: t.label || fb.profileTitle,
      profileSubtitle: t.subtitle || fb.profileSubtitle,
    };
  });
}

export function resolveAboutPageDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): AboutPageDisplay {
  const fallback = getAboutFallback(locale);
  const meta = metadata || {};

  const seoT = pickAboutL10n(
    (meta.seo as { translations?: AboutLocalized[] })?.translations,
    locale,
    ['title'],
    { title: fallback.seoTitle }
  );
  const breadcrumbT = pickAboutL10n(
    (meta.breadcrumb as { translations?: AboutLocalized[] })?.translations,
    locale,
    ['title', 'label'],
    { title: fallback.breadcrumb.title, label: fallback.breadcrumb.activeLabel }
  );
  const breadcrumbMeta = (meta.breadcrumb || {}) as { home_href?: string };
  const introMeta = (meta.intro || {}) as {
    image_1?: string;
    image_1_alt?: string;
    image_2?: string;
    image_2_alt?: string;
    highlights?: Array<{ icon?: string; translations?: AboutLocalized[] }>;
    translations?: AboutLocalized[];
  };
  const introT = pickAboutL10n(introMeta.translations, locale, ['label', 'title', 'text'], {
    label: fallback.intro.eyebrow,
    title: fallback.intro.heading,
    text: fallback.intro.body,
  });

  const statsMeta = (meta.stats_section || meta.stats || {}) as {
    translations?: AboutLocalized[];
    items?: Array<{ icon?: string; value?: string; translations?: AboutLocalized[] }>;
  };
  const statsT = pickAboutL10n(statsMeta.translations, locale, ['label', 'title'], {
    label: fallback.stats.eyebrow,
    title: fallback.stats.heading,
  });

  const brandsMeta = (meta.brands_section || meta.brands || {}) as {
    translations?: AboutLocalized[];
    items?: Array<{ image?: string; alt?: string; name?: string; translations?: AboutLocalized[] }>;
  };
  const brandsT = pickAboutL10n(brandsMeta.translations, locale, ['label', 'title', 'text'], {
    label: fallback.brands.eyebrow,
    title: fallback.brands.heading,
    text: fallback.brands.body,
  });

  const reviewsMeta = (meta.reviews_section || meta.reviews || {}) as {
    translations?: AboutLocalized[];
    items?: Array<{ image?: string; translations?: AboutLocalized[] }>;
  };
  const reviewsT = pickAboutL10n(reviewsMeta.translations, locale, ['label', 'title'], {
    label: fallback.reviews.eyebrow,
    title: fallback.reviews.heading,
  });

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
    intro: {
      image1:
        typeof introMeta.image_1 === 'string' && introMeta.image_1
          ? introMeta.image_1
          : fallback.intro.image1,
      image1Alt:
        typeof introMeta.image_1_alt === 'string'
          ? introMeta.image_1_alt
          : fallback.intro.image1Alt,
      image2:
        typeof introMeta.image_2 === 'string' && introMeta.image_2
          ? introMeta.image_2
          : fallback.intro.image2,
      image2Alt:
        typeof introMeta.image_2_alt === 'string'
          ? introMeta.image_2_alt
          : fallback.intro.image2Alt,
      eyebrow: introT.label || fallback.intro.eyebrow,
      heading: introT.title || fallback.intro.heading,
      body: introT.text || fallback.intro.body,
      highlights: resolveHighlights(introMeta.highlights, locale, fallback.intro.highlights),
    },
    stats: {
      eyebrow: statsT.label || fallback.stats.eyebrow,
      heading: statsT.title || fallback.stats.heading,
      items: resolveStats(statsMeta.items, locale, fallback.stats.items),
    },
    brands: {
      eyebrow: brandsT.label || fallback.brands.eyebrow,
      heading: brandsT.title || fallback.brands.heading,
      body: brandsT.text || fallback.brands.body,
      items: resolveBrands(brandsMeta.items, locale, fallback.brands.items),
    },
    reviews: {
      eyebrow: reviewsT.label || fallback.reviews.eyebrow,
      heading: reviewsT.title || fallback.reviews.heading,
      items: resolveReviews(reviewsMeta.items, locale, fallback.reviews.items),
    },
  };
}

export async function fetchAboutPageDisplay(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<AboutPageDisplay> {
  const data = await fetchWebPage(ABOUT_PAGE_CODE, tenantId);
  return resolveAboutPageDisplay(data?.page?.metadata, locale);
}
