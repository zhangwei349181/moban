import { strMeta } from '../../../sections/resolvers/_shared';
import { getTranslationByLocale } from '../../../../lib/menu';

interface LocalizedField {
  language_code: string;
  is_primary?: boolean;
  text?: string;
  link_text?: string;
  /** 按钮文案（与 cta.label 一致） */
  label?: string;
  button_text?: string;
  email_placeholder?: string;
  placeholder?: string;
}

interface SubscribeMeta {
  template_id?: string;
  templateId?: string;
  template?: string;
  form_type?: string;
  type?: string;
  email_placeholder?: string;
  button_text?: string;
  privacy_href?: string;
  translations?: LocalizedField[];
  cta?: { label?: string; translations?: LocalizedField[] };
}

export interface SubscribeSectionMeta {
  templateId: string;
  formType: string;
  emailPlaceholder: string;
  buttonText: string;
  privacyPrefix: string;
  privacyLinkText: string;
  privacyHref: string;
}

export interface SubscribeDisplay {
  emailPlaceholder: string;
  buttonText: string;
  privacyPrefix: string;
  privacyLinkText: string;
  privacyHref: string;
}

const FALLBACK_EN = {
  emailPlaceholder: 'Enter your email',
  buttonText: 'Subscribe now',
  privacyPrefix: 'By subscribing you agree to with our',
  privacyLinkText: 'Privacy Policy',
  privacyHref: '#',
};

const FALLBACK_ZH = {
  emailPlaceholder: '请输入邮箱',
  buttonText: '立即订阅',
  privacyPrefix: '订阅即表示您同意我们的',
  privacyLinkText: '隐私政策',
  privacyHref: '#',
};

function getFallback(locale: string) {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? FALLBACK_ZH : FALLBACK_EN;
}

type LocalizedKey = keyof Pick<
  LocalizedField,
  'text' | 'link_text' | 'label' | 'button_text' | 'email_placeholder' | 'placeholder'
>;

function pickLocalized(
  translations: LocalizedField[] | undefined,
  locale: string,
  keys: LocalizedKey[]
): Partial<Record<LocalizedKey, string>> {
  const row = getTranslationByLocale(translations || [], locale) as LocalizedField | null;
  const out: Partial<Record<LocalizedKey, string>> = {};
  for (const key of keys) {
    const val = row?.[key];
    if (typeof val === 'string' && val) out[key] = val;
  }
  return out;
}

export function resolveSubscribeSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): SubscribeSectionMeta {
  const fallback = getFallback(locale);
  const meta = (metadata || {}) as SubscribeMeta;
  const t = pickLocalized(meta.translations, locale, [
    'text',
    'link_text',
    'label',
    'button_text',
    'email_placeholder',
    'placeholder',
  ]);

  const cta = (meta.cta || {}) as { label?: string; translations?: LocalizedField[] };
  const ctaT = pickLocalized(cta.translations, locale, ['label', 'link_text']);

  return {
    templateId: strMeta(meta.template_id ?? meta.templateId ?? meta.template, ''),
    formType: strMeta(meta.form_type ?? meta.type, 'newsletter'),
    emailPlaceholder:
      t.email_placeholder ||
      t.placeholder ||
      (typeof meta.email_placeholder === 'string' && meta.email_placeholder
        ? meta.email_placeholder
        : fallback.emailPlaceholder),
    buttonText:
      t.label ||
      t.button_text ||
      ctaT.label ||
      (typeof cta.label === 'string' && cta.label ? cta.label : '') ||
      (typeof meta.button_text === 'string' && meta.button_text ? meta.button_text : '') ||
      fallback.buttonText,
    privacyPrefix: t.text || fallback.privacyPrefix,
    privacyLinkText: t.link_text || fallback.privacyLinkText,
    privacyHref:
      typeof meta.privacy_href === 'string' && meta.privacy_href ? meta.privacy_href : fallback.privacyHref,
  };
}

/** @deprecated 使用 resolveSubscribeSectionMeta */
export function resolveSubscribeDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): SubscribeDisplay {
  const m = resolveSubscribeSectionMeta(metadata, locale);
  return {
    emailPlaceholder: m.emailPlaceholder,
    buttonText: m.buttonText,
    privacyPrefix: m.privacyPrefix,
    privacyLinkText: m.privacyLinkText,
    privacyHref: m.privacyHref,
  };
}
