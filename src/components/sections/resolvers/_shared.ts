/**
 * Section 组件 metadata 解析共用工具（多语言）
 */

import { getTranslationByLocale } from '../../../lib/menu';

export interface TranslationRow {
  language_code: string;
  is_primary?: boolean;
  title?: string;
  title_prefix?: string;
  title_accent?: string;
  text?: string;
  link_text?: string;
  label?: string;
  name?: string;
  role?: string;
  subtitle?: string;
  description?: string;
  tagline?: string;
  quote?: string;
  date?: string;
}

export type TranslationKey = keyof TranslationRow;

/** 可从 translations 行读取的字符串字段（排除 language_code、is_primary） */
export type StringTranslationKey = Exclude<TranslationKey, 'language_code' | 'is_primary'>;

export function isZhLocale(locale: string): boolean {
  return String(locale).split('-')[0].toLowerCase() === 'zh';
}

export function pickLocalized(
  translations: TranslationRow[] | undefined,
  locale: string,
  keys: StringTranslationKey[]
): Partial<Record<StringTranslationKey, string>> {
  const list = Array.isArray(translations) ? translations : [];
  const row = getTranslationByLocale(list, locale) as TranslationRow | null;
  const out: Partial<Record<StringTranslationKey, string>> = {};
  for (const key of keys) {
    const val = row?.[key];
    if (typeof val === 'string' && val.trim()) {
      out[key] = val;
    }
  }
  return out;
}

export function pickLocalePair<T>(locale: string, en: T, zh: T): T {
  return isZhLocale(locale) ? zh : en;
}

export function strMeta(
  value: unknown,
  fallback: string
): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function numMeta(value: unknown, fallback: number): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

export function normalizeAssetUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('./')) return url.slice(1);
  return url;
}

export function resolveHeader(
  meta: Record<string, unknown> | undefined,
  locale: string,
  fallback: { title: string; subtitle?: string },
  titleKey: StringTranslationKey = 'title',
  subtitleKey: StringTranslationKey = 'text'
): { title: string; subtitle: string } {
  const header = (meta?.header || meta) as Record<string, unknown>;
  const translations = header.translations as TranslationRow[] | undefined;
  const t = pickLocalized(translations, locale, [titleKey, subtitleKey]);
  return {
    title: t[titleKey] || strMeta(header.title, fallback.title),
    subtitle: t[subtitleKey] || strMeta(header.subtitle ?? header.description, fallback.subtitle || ''),
  };
}

export function resolveCta(
  meta: Record<string, unknown> | undefined,
  locale: string,
  fallback: { label: string; href: string; ariaLabel?: string }
): { label: string; href: string; ariaLabel: string } {
  const cta = (meta?.cta || {}) as Record<string, unknown>;
  const t = pickLocalized(cta.translations as TranslationRow[] | undefined, locale, [
    'link_text',
    'label',
  ]);
  return {
    label: t.link_text || t.label || strMeta(cta.label, fallback.label),
    href: strMeta(cta.href ?? cta.link_href, fallback.href),
    ariaLabel: strMeta(cta.aria_label, fallback.ariaLabel || fallback.label),
  };
}

export interface ItemWithTranslations {
  image?: string;
  alt?: string;
  href?: string;
  link_href?: string;
  icon?: string;
  icon_class?: string;
  variant?: string;
  wide?: boolean;
  translations?: TranslationRow[];
  [key: string]: unknown;
}

export function resolveItemText(
  item: ItemWithTranslations,
  locale: string,
  keys: StringTranslationKey[],
  fallbacks: Partial<Record<StringTranslationKey, string>>
): Partial<Record<StringTranslationKey, string>> {
  const t = pickLocalized(item.translations, locale, keys);
  const out: Partial<Record<StringTranslationKey, string>> = {};
  for (const key of keys) {
    out[key] = t[key] || fallbacks[key] || '';
  }
  return out;
}

export function resolveItems<T>(
  raw: unknown,
  locale: string,
  fallback: T[],
  mapItem: (item: ItemWithTranslations, index: number, fb: T) => T
): T[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((item, index) => {
    const fb = fallback[index] ?? fallback[fallback.length - 1];
    return mapItem(item as ItemWithTranslations, index, fb);
  });
}

/** 组件 html_url / 内联 html 均缺失时的可见提示；内核不再回退内置模板。 */
export function missingTemplateNoticeHtml(locale: string): string {
  const msg = isZhLocale(locale) ? '没有可加载的模板' : 'No template available to load';
  return `<p class="gt6-missing-template" data-missing-template>${msg}</p>`;
}
