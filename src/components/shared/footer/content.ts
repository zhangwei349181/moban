/**
 * Footer 静态展示数据：拉取 CDN JSON + 解析 metadata（仅本组件使用）
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
  label?: string;
}

interface FooterLogoMeta {
  href?: string;
  image?: string;
  alt?: string;
  translations?: LocalizedField[];
}

interface FooterDescriptionMeta {
  translations?: LocalizedField[];
}

interface FooterSocialLinkMeta {
  href?: string;
  icon?: string;
  translations?: LocalizedField[];
}

interface FooterCopyrightMeta {
  translations?: LocalizedField[];
}

export interface FooterSocialLinkDisplay {
  href: string;
  icon: string;
  label: string;
}

export interface FooterContent {
  logo: {
    href: string;
    image: string;
    alt: string;
    srOnly: string;
  };
  description: string;
  socialLinks: FooterSocialLinkDisplay[];
  copyright: string;
}

const DEFAULT_SOCIAL_EN: FooterSocialLinkDisplay[] = [
  { href: '#', icon: './images/icons/facebook-dark.svg', label: 'Facebook' },
  { href: '#', icon: './images/icons/instagram-dark.svg', label: 'Instagram' },
  { href: '#', icon: './images/icons/youtube-dark.svg', label: 'Youtube' },
  { href: '#', icon: './images/icons/linkedin-dark.svg', label: 'LinkedIn' },
  { href: '#', icon: './images/icons/dribble-dark.svg', label: 'Dribble' },
  { href: '#', icon: './images/icons/behance-dark.svg', label: 'Behance' },
];

const DEFAULT_SOCIAL_ZH = DEFAULT_SOCIAL_EN;

const FALLBACK_EN: FooterContent = {
  logo: {
    href: './index.html',
    image: './images/logo/main-logo.svg',
    alt: 'Nexsas Logo',
    srOnly: 'Home',
  },
  description:
    'Nexsas helps teams automate workflows, connect the apps they already use, and ship faster—without piling on complexity.',
  socialLinks: DEFAULT_SOCIAL_EN,
  copyright: 'Copyright © Shopaeo LLC',
};

const FALLBACK_ZH: FooterContent = {
  logo: {
    href: './index.html',
    image: './images/logo/main-logo.svg',
    alt: 'Nexsas Logo',
    srOnly: '首页',
  },
  description:
    'Nexsas 帮助团队自动化工作流、连接常用应用，并更快交付成果，无需增加复杂度。',
  socialLinks: DEFAULT_SOCIAL_ZH,
  copyright: '版权所有 © Shopaeo LLC',
};

function getFallback(locale: string): FooterContent {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? FALLBACK_ZH : FALLBACK_EN;
}

function pickLocalized(
  translations: LocalizedField[] | undefined,
  locale: string,
  keys: Array<keyof Pick<LocalizedField, 'text' | 'label'>>
): Partial<Pick<LocalizedField, 'text' | 'label'>> {
  const row = getTranslationByLocale(translations || [], locale) as LocalizedField | null;
  const out: Partial<Pick<LocalizedField, 'text' | 'label'>> = {};
  for (const key of keys) {
    const val = row?.[key];
    if (typeof val === 'string' && val) {
      out[key] = val;
    }
  }
  return out;
}

function resolveSocialLinks(
  items: FooterSocialLinkMeta[] | undefined,
  locale: string,
  fallback: FooterSocialLinkDisplay[]
): FooterSocialLinkDisplay[] {
  if (!Array.isArray(items) || items.length === 0) return fallback;

  return items.map((item, index) => {
    const fb = fallback[index] || fallback[fallback.length - 1] || { href: '#', icon: '', label: 'Social' };
    const t = pickLocalized(item.translations, locale, ['label']);
    return {
      href: typeof item.href === 'string' && item.href ? item.href : fb.href,
      icon: typeof item.icon === 'string' && item.icon ? item.icon : fb.icon,
      label: t.label || fb.label,
    };
  });
}

function resolveFooterContent(metadata: Record<string, unknown> | undefined, locale: string): FooterContent {
  const fallback = getFallback(locale);
  const meta = metadata || {};

  const logoMeta = (meta.logo || {}) as FooterLogoMeta;
  const logoT = pickLocalized(logoMeta.translations, locale, ['text']);

  const descriptionMeta = (meta.description || {}) as FooterDescriptionMeta;
  const descriptionT = pickLocalized(descriptionMeta.translations, locale, ['text']);

  const copyrightMeta = (meta.copyright || {}) as FooterCopyrightMeta;
  const copyrightT = pickLocalized(copyrightMeta.translations, locale, ['text']);

  return {
    logo: {
      href: typeof logoMeta.href === 'string' && logoMeta.href ? logoMeta.href : fallback.logo.href,
      image: typeof logoMeta.image === 'string' && logoMeta.image ? logoMeta.image : fallback.logo.image,
      alt: typeof logoMeta.alt === 'string' ? logoMeta.alt : fallback.logo.alt,
      srOnly: logoT.text || fallback.logo.srOnly,
    },
    description: descriptionT.text || fallback.description,
    socialLinks: resolveSocialLinks(
      meta.social_links as FooterSocialLinkMeta[] | undefined,
      locale,
      fallback.socialLinks
    ),
    copyright: copyrightT.text || fallback.copyright,
  };
}

async function fetchFooterMetadata(
  tenantId: string
): Promise<Record<string, unknown> | undefined> {
  const url = `${APP_CONFIG.apiBaseUrl}/tenant_${tenantId}/web_components/footer.json`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch footer component: ${response.statusText}`);
    }
    const json = (await response.json()) as WebComponentResponse;
    if (!json.success || !json.data?.component) {
      throw new Error('Invalid footer component response');
    }
    return json.data.component.metadata;
  } catch (error) {
    console.error('[footer/content]', error);
    return undefined;
  }
}

/** 在 footer.astro 服务端调用 */
export async function loadFooterContent(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<FooterContent> {
  const metadata = await fetchFooterMetadata(tenantId);
  return resolveFooterContent(metadata, locale);
}
