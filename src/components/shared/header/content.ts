/**
 * Header 静态展示数据：拉取 CDN JSON + 解析 metadata（仅本组件使用）
 */

import { APP_CONFIG } from '../../../config/app';
import { getTranslationByLocale } from '../../../lib/menu';

interface WebComponentResponse {
  success: boolean;
  data: {
    component: {
      metadata: Record<string, unknown>;
    };
  };
}

interface LocalizedField {
  language_code: string;
  is_primary?: boolean;
  text?: string;
  link_text?: string;
}

interface HeaderLogoImageMeta {
  image?: string;
  dark_image?: string;
  alt?: string;
}

interface HeaderLogoMeta {
  href?: string;
  sr_only?: string;
  translations?: LocalizedField[];
  desktop?: HeaderLogoImageMeta;
  mobile?: HeaderLogoImageMeta;
  sidebar?: HeaderLogoImageMeta;
  /** @deprecated 兼容旧 metadata，映射到 desktop */
  image?: string;
  /** @deprecated 兼容旧 metadata */
  alt?: string;
}

interface HeaderCtaMeta {
  href?: string;
  aria_label?: string;
  show_icon?: boolean;
  translations?: LocalizedField[];
}

export interface HeaderLogoImageDisplay {
  image: string;
  darkImage?: string;
  alt: string;
}

export interface HeaderContent {
  logo: {
    href: string;
    srOnly: string;
    desktop: HeaderLogoImageDisplay;
    mobile: HeaderLogoImageDisplay;
    sidebar: HeaderLogoImageDisplay;
  };
  cta: {
    href: string;
    ariaLabel: string;
    text: string;
    showIcon: boolean;
  };
}

const FALLBACK_EN: HeaderContent = {
  logo: {
    href: './index.html',
    srOnly: 'Home',
    desktop: {
      image: './images/logo/main-logo.svg',
      alt: 'Nexsas',
    },
    mobile: {
      image: './images/logo/logo.svg',
      alt: 'Nexsas',
    },
    sidebar: {
      image: './images/logo/logo.svg',
      alt: 'Nexsas',
    },
  },
  cta: {
    href: './signup.html',
    ariaLabel: 'Get started',
    text: 'Get started',
    showIcon: true,
  },
};

const FALLBACK_ZH: HeaderContent = {
  logo: {
    href: './index.html',
    srOnly: '首页',
    desktop: {
      image: './images/logo/main-logo.svg',
      alt: 'Nexsas',
    },
    mobile: {
      image: './images/logo/logo.svg',
      alt: 'Nexsas',
    },
    sidebar: {
      image: './images/logo/logo.svg',
      alt: 'Nexsas',
    },
  },
  cta: {
    href: './signup.html',
    ariaLabel: '立即开始',
    text: '立即开始',
    showIcon: true,
  },
};

function getFallback(locale: string): HeaderContent {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? FALLBACK_ZH : FALLBACK_EN;
}

function pickLocalized(
  translations: LocalizedField[] | undefined,
  locale: string,
  keys: Array<keyof Pick<LocalizedField, 'text' | 'link_text'>>
): Partial<Pick<LocalizedField, 'text' | 'link_text'>> {
  const row = getTranslationByLocale(translations || [], locale) as LocalizedField | null;
  const out: Partial<Pick<LocalizedField, 'text' | 'link_text'>> = {};
  for (const key of keys) {
    const val = row?.[key];
    if (typeof val === 'string' && val) {
      out[key] = val;
    }
  }
  return out;
}

function resolveLogoImage(
  meta: HeaderLogoImageMeta | undefined,
  fallback: HeaderLogoImageDisplay
): HeaderLogoImageDisplay {
  return {
    image: typeof meta?.image === 'string' && meta.image ? meta.image : fallback.image,
    darkImage:
      typeof meta?.dark_image === 'string' && meta.dark_image ? meta.dark_image : fallback.darkImage,
    alt: typeof meta?.alt === 'string' ? meta.alt : fallback.alt,
  };
}

function resolveHeaderContent(metadata: Record<string, unknown> | undefined, locale: string): HeaderContent {
  const fallback = getFallback(locale);
  const meta = metadata || {};

  const logoMeta = (meta.logo || {}) as HeaderLogoMeta;
  const logoT = pickLocalized(logoMeta.translations, locale, ['text']);

  const ctaMeta = (meta.cta || {}) as HeaderCtaMeta;
  const ctaT = pickLocalized(ctaMeta.translations, locale, ['link_text']);

  return {
    logo: {
      href: typeof logoMeta.href === 'string' && logoMeta.href ? logoMeta.href : fallback.logo.href,
      srOnly:
        (typeof logoMeta.sr_only === 'string' && logoMeta.sr_only) ||
        logoT.text ||
        fallback.logo.srOnly,
      desktop: resolveLogoImage(
        logoMeta.desktop ||
          (logoMeta.image ? { image: logoMeta.image, alt: logoMeta.alt } : undefined),
        fallback.logo.desktop
      ),
      mobile: resolveLogoImage(logoMeta.mobile, fallback.logo.mobile),
      sidebar: resolveLogoImage(logoMeta.sidebar || logoMeta.mobile, fallback.logo.sidebar),
    },
    cta: {
      href: typeof ctaMeta.href === 'string' && ctaMeta.href ? ctaMeta.href : fallback.cta.href,
      ariaLabel:
        typeof ctaMeta.aria_label === 'string' && ctaMeta.aria_label
          ? ctaMeta.aria_label
          : fallback.cta.ariaLabel,
      text: ctaT.link_text || fallback.cta.text,
      showIcon: ctaMeta.show_icon !== false,
    },
  };
}

async function fetchHeaderMetadata(
  tenantId: string
): Promise<Record<string, unknown> | undefined> {
  const url = `${APP_CONFIG.apiBaseUrl}/tenant_${tenantId}/web_components/header.json`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch header component: ${response.statusText}`);
    }
    const json = (await response.json()) as WebComponentResponse;
    if (!json.success || !json.data?.component) {
      throw new Error('Invalid header component response');
    }
    return json.data.component.metadata;
  } catch (error) {
    console.error('[header/content]', error);
    return undefined;
  }
}

/** 在 header.astro 服务端调用 */
export async function loadHeaderContent(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<HeaderContent> {
  const metadata = await fetchHeaderMetadata(tenantId);
  return resolveHeaderContent(metadata, locale);
}
