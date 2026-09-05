/**
 * 页面 metadata：SEO 字段
 */

import { getTranslationByLocale } from './menu';
import { getTranslationByLocale as getI18nText, type TranslationKey } from './translations';

export interface PageSeoDefaults {
  title: string;
  description: string;
  keywords: string;
}

export interface PageSeoFields {
  title: string;
  description: string;
  keywords: string;
}

function pickMetadataString(
  metadata: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const val = metadata[key];
  if (typeof val === 'string' && val.trim()) return val.trim();
  return fallback;
}

interface PageSeoLocalized {
  language_code: string;
  is_primary?: boolean;
  title?: string;
  description?: string;
  keywords?: string;
  /** 部分页面用 text 存描述 */
  text?: string;
}

type PageSeoL10nKey = 'title' | 'description' | 'keywords';

function pickPageSeoLocalized(
  translations: PageSeoLocalized[] | undefined,
  locale: string,
  keys: PageSeoL10nKey[],
  fallbacks: Partial<Record<PageSeoL10nKey, string>>
): Partial<Record<PageSeoL10nKey, string>> {
  const row = getTranslationByLocale(translations || [], locale) as PageSeoLocalized | null;
  const out: Partial<Record<PageSeoL10nKey, string>> = {};

  for (const key of keys) {
    const val = row?.[key];
    if (typeof val === 'string' && val.trim()) {
      out[key] = val.trim();
      continue;
    }
    if (key === 'description' && typeof row?.text === 'string' && row.text.trim()) {
      out.description = row.text.trim();
      continue;
    }
    if (fallbacks[key]) {
      out[key] = fallbacks[key];
    }
  }

  return out;
}

function getPageSeoTranslations(
  metadata: Record<string, unknown>
): PageSeoLocalized[] | undefined {
  const seo = metadata.seo as { translations?: PageSeoLocalized[] } | undefined;
  if (Array.isArray(seo?.translations) && seo.translations.length > 0) {
    return seo.translations;
  }

  const header = metadata.header as { translations?: PageSeoLocalized[] } | undefined;
  if (Array.isArray(header?.translations) && header.translations.length > 0) {
    return header.translations;
  }

  if (Array.isArray(metadata.translations) && metadata.translations.length > 0) {
    return metadata.translations as PageSeoLocalized[];
  }

  return undefined;
}

/**
 * 从页面 metadata 解析 title / description / keywords（支持 seo.translations 多语言）
 */
export function resolvePageSeoFields(
  metadata: Record<string, unknown>,
  defaults: PageSeoDefaults,
  locale: string
): PageSeoFields {
  const flatFallback = {
    title: pickMetadataString(metadata, 'title', defaults.title),
    description: pickMetadataString(metadata, 'description', defaults.description),
    keywords: pickMetadataString(metadata, 'keywords', defaults.keywords),
  };

  const l10n = pickPageSeoLocalized(
    getPageSeoTranslations(metadata),
    locale,
    ['title', 'description', 'keywords'],
    flatFallback
  );

  return {
    title: l10n.title || defaults.title,
    description: l10n.description || defaults.description,
    keywords: l10n.keywords || defaults.keywords,
  };
}

/** 各固定页面的 i18n SEO 回退（CDN metadata 未配置时） */
export function getSystemPageSeoDefaults(
  locale: string,
  page: 'home' | 'bloglist' | 'article' | 'product'
): PageSeoDefaults {
  const keys: Record<typeof page, { title: TranslationKey; description: TranslationKey; keywords: TranslationKey }> = {
    home: {
      title: 'page_seo_home_title',
      description: 'page_seo_home_description',
      keywords: 'page_seo_home_keywords',
    },
    bloglist: {
      title: 'blog_list_title',
      description: 'blog_list_subtitle',
      keywords: 'blog_list_title',
    },
    article: {
      title: 'blog_list_title',
      description: 'blog_list_subtitle',
      keywords: 'blog_list_title',
    },
    product: {
      title: 'our_products_section_title',
      description: 'our_products_section_title',
      keywords: 'products',
    },
  };

  const k = keys[page];
  return {
    title: getI18nText(locale, k.title),
    description: getI18nText(locale, k.description),
    keywords: getI18nText(locale, k.keywords),
  };
}
