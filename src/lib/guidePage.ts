/**
 * Guide 页面静态 JSON 加载与解析
 */

import { APP_CONFIG } from '../config/app';
import { fetchWebPage } from './webPage';
import { getTranslationByLocale } from './menu';
import {
  getGuideFallback,
  type GuideBlockDisplay,
  type GuideBlockType,
  type GuideListItemDisplay,
  type GuideListItemStyle,
  type GuidePageDisplay,
  type GuideSectionDisplay,
} from './guidePageFallback';

export type {
  GuideBlockDisplay,
  GuideBlockType,
  GuideListItemDisplay,
  GuideListItemStyle,
  GuidePageDisplay,
  GuideSectionDisplay,
} from './guidePageFallback';
export { buildGuidePageMetadataForCdn } from './guidePageFallback';

/** 须与 CDN 文件名一致（区分大小写） */
export const GUIDE_PAGE_CODE = 'guide';

interface GuideLocalized {
  language_code: string;
  is_primary?: boolean;
  title?: string;
  label?: string;
  text?: string;
}

type GuideL10nKey = 'title' | 'label' | 'text';

function isPlaceholderString(val: string | undefined): boolean {
  if (!val || !String(val).trim()) return true;
  const t = String(val).trim();
  return t === '...' || t === '…' || /^\.{2,}$/.test(t);
}

function pickGuideL10n(
  translations: GuideLocalized[] | undefined,
  locale: string,
  keys: GuideL10nKey[],
  fallbackRow?: Partial<Pick<GuideLocalized, GuideL10nKey>>
): Partial<Pick<GuideLocalized, GuideL10nKey>> {
  const row = getTranslationByLocale(translations || [], locale) as GuideLocalized | null;
  const out: Partial<Pick<GuideLocalized, GuideL10nKey>> = {};
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

function mergeGuideItems<T, M>(
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

const LIST_STYLES: GuideListItemStyle[] = ['stacked', 'inline', 'plain'];
const BLOCK_TYPES: GuideBlockType[] = ['paragraph', 'ordered_list', 'unordered_list'];

function normalizeListStyle(
  raw: string | undefined,
  fallback: GuideListItemStyle
): GuideListItemStyle {
  if (raw && LIST_STYLES.includes(raw as GuideListItemStyle)) {
    return raw as GuideListItemStyle;
  }
  return fallback;
}

function normalizeBlockType(raw: string | undefined, fallback: GuideBlockType): GuideBlockType {
  if (raw && BLOCK_TYPES.includes(raw as GuideBlockType)) {
    return raw as GuideBlockType;
  }
  return fallback;
}

function resolveListItems(
  items:
    | Array<{
        style?: string;
        item_class?: string;
        translations?: GuideLocalized[];
      }>
    | undefined,
  locale: string,
  fallback: GuideListItemDisplay[]
): GuideListItemDisplay[] {
  return mergeGuideItems(items, fallback, (item, _i, fb) => {
    if (!item) return fb;
    const t = pickGuideL10n(item.translations, locale, ['title', 'text'], {
      title: fb.title,
      text: fb.bodyHtml,
    });
    return {
      style: normalizeListStyle(item.style, fb.style),
      title: t.title || fb.title,
      bodyHtml: t.text || fb.bodyHtml,
      itemClass:
        typeof item.item_class === 'string' && item.item_class
          ? item.item_class
          : fb.itemClass,
    };
  });
}

function resolveBlocks(
  blocks:
    | Array<{
        type?: string;
        class?: string;
        list_class?: string;
        translations?: GuideLocalized[];
        items?: Array<{
          style?: string;
          item_class?: string;
          translations?: GuideLocalized[];
        }>;
      }>
    | undefined,
  locale: string,
  fallback: GuideBlockDisplay[]
): GuideBlockDisplay[] {
  return mergeGuideItems(blocks, fallback, (block, _i, fb) => {
    if (!block) return fb;
    const type = normalizeBlockType(block.type, fb.type);
    if (type === 'paragraph') {
      const t = pickGuideL10n(block.translations, locale, ['text'], { text: fb.html });
      return {
        type,
        html: t.text || fb.html,
        className:
          typeof block.class === 'string' && block.class ? block.class : fb.className,
      };
    }
    return {
      type,
      listClass:
        typeof block.list_class === 'string' && block.list_class
          ? block.list_class
          : fb.listClass,
      items: resolveListItems(block.items, locale, fb.items || []),
    };
  });
}

/** 供 guide / privacy 等文档型页面复用 */
export function resolvePolicyDocSections(
  sections:
    | Array<{
        translations?: GuideLocalized[];
        blocks?: Array<{
          type?: string;
          class?: string;
          list_class?: string;
          translations?: GuideLocalized[];
          items?: Array<{
            style?: string;
            item_class?: string;
            translations?: GuideLocalized[];
          }>;
        }>;
      }>
    | undefined,
  locale: string,
  fallback: GuideSectionDisplay[]
): GuideSectionDisplay[] {
  return mergeGuideItems(sections, fallback, (section, _i, fb) => {
    if (!section) return fb;
    const t = pickGuideL10n(section.translations, locale, ['title'], { title: fb.heading });
    return {
      heading: t.title || fb.heading,
      blocks: resolveBlocks(section.blocks, locale, fb.blocks),
    };
  });
}

export function resolveGuidePageDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): GuidePageDisplay {
  const fallback = getGuideFallback(locale);
  const meta = metadata || {};

  const seoT = pickGuideL10n(
    (meta.seo as { translations?: GuideLocalized[] })?.translations,
    locale,
    ['title'],
    { title: fallback.seoTitle }
  );
  const breadcrumbT = pickGuideL10n(
    (meta.breadcrumb as { translations?: GuideLocalized[] })?.translations,
    locale,
    ['title', 'label'],
    { title: fallback.breadcrumb.title, label: fallback.breadcrumb.activeLabel }
  );
  const breadcrumbMeta = (meta.breadcrumb || {}) as { home_href?: string };
  const introT = pickGuideL10n(
    (meta.intro as { translations?: GuideLocalized[] })?.translations,
    locale,
    ['text'],
    { text: fallback.introHtml }
  );
  const closingT = pickGuideL10n(
    (meta.closing as { translations?: GuideLocalized[] })?.translations,
    locale,
    ['text'],
    { text: fallback.closingHtml }
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
    introHtml: introT.text || fallback.introHtml,
    sections: resolvePolicyDocSections(
      meta.sections as Parameters<typeof resolvePolicyDocSections>[0],
      locale,
      fallback.sections
    ),
    closingHtml: closingT.text || fallback.closingHtml,
  };
}

export async function fetchGuidePageDisplay(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<GuidePageDisplay> {
  const data = await fetchWebPage(GUIDE_PAGE_CODE, tenantId);
  return resolveGuidePageDisplay(data?.page?.metadata, locale);
}
