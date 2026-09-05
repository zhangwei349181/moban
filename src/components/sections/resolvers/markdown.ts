import {
  loadComponentsHtmlShell,
  resolveComponentsCss,
} from './componentsHtml';
import { normalizeAssetUrl, strMeta } from './_shared';
import { getTranslationByLocale } from '../../../lib/menu';

function optionalStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function coerceTranslationsList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) as Array<
    Record<string, unknown>
  >;
}

function localeRow(
  translations: Array<Record<string, unknown>>,
  locale: string
): Record<string, unknown> | null {
  if (!translations.length) return null;
  const normalized = translations.map((row) => ({
    ...row,
    language_code: strMeta(
      row.language_code ?? row.language ?? row.locale,
      ''
    ),
  }));
  return (getTranslationByLocale(normalized as any, locale) as Record<string, unknown> | null) ?? null;
}

function mdUrlFromRow(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  const url = optionalStr(
    row.md_url ?? row.mdUrl ?? row.markdown_url ?? row.markdownUrl ?? row.content_url ?? row.contentUrl
  );
  return url ? normalizeAssetUrl(url) : null;
}

/** 当前语言的远程 Markdown URL（translations[].md_url，否则顶层 md_url） */
export function resolveMarkdownUrl(
  metadata: Record<string, unknown> | undefined,
  locale: string
): string | null {
  const meta = metadata || {};
  const translations = coerceTranslationsList(meta.translations);
  const fromRow = mdUrlFromRow(localeRow(translations, locale));
  if (fromRow) return fromRow;

  const top = optionalStr(meta.md_url ?? meta.mdUrl ?? meta.markdown_url ?? meta.content_url);
  return top ? normalizeAssetUrl(top) : null;
}

export async function loadMarkdownSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}

export { resolveComponentsCss };
