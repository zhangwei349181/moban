/**
 * 分类/标签等多语言字段解析（主语言在 name，translations 仅含其它语言）
 */

import { getTranslationByLocale } from './menu';
import type { Translation } from './product';

export function localeMatchesPrimary(locale: string, primaryLanguage: string | undefined): boolean {
  if (!primaryLanguage?.trim()) return false;
  const current = locale.toLowerCase();
  const primary = primaryLanguage.toLowerCase();
  if (current === primary) return true;
  return current.split('-')[0] === primary.split('-')[0];
}

export function resolveEntityLocalizedName(
  primaryName: string,
  primaryLanguage: string | undefined,
  translations: Translation[] | undefined,
  locale: string,
  field: 'name' | 'description' = 'name'
): string {
  const base = primaryName.trim();
  if (localeMatchesPrimary(locale, primaryLanguage)) {
    return base;
  }

  const list = Array.isArray(translations) ? translations : [];
  const row = getTranslationByLocale(list, locale) as Record<string, unknown> | null;
  const val = row?.[field];
  if (typeof val === 'string' && val.trim()) return val.trim();

  return base;
}

/** 树形分类/标签节点（categories.json / 子节点） */
export function resolveTreeEntityLocalizedName(
  entity: { name?: string; primary_language?: string; translations?: Translation[] },
  locale: string,
  field: 'name' | 'description' = 'name'
): string {
  return resolveEntityLocalizedName(
    entity.name || '',
    entity.primary_language,
    entity.translations,
    locale,
    field
  );
}
