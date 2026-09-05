/**
 * Contact 页面静态 JSON 加载与解析
 */

import { APP_CONFIG } from '../config/app';
import { fetchWebPage } from './webPage';
import { getTranslationByLocale } from './menu';
import {
  getContactFallback,
  type ContactFormFieldDisplay,
  type ContactHtmlInputType,
  type ContactInfoItemDisplay,
  type ContactPageDisplay,
} from './contactPageFallback';

export type {
  ContactInfoItemDisplay,
  ContactFormFieldDisplay,
  ContactHtmlInputType,
  ContactPageDisplay,
} from './contactPageFallback';

function normalizeContactInputType(
  raw: string | undefined,
  fallback: ContactFormFieldDisplay
): ContactFormFieldDisplay['inputType'] {
  if (
    raw === 'text' ||
    raw === 'email' ||
    raw === 'tel' ||
    raw === 'textarea'
  ) {
    return raw;
  }
  return fallback.inputType;
}
export { buildContactPageMetadataForCdn } from './contactPageFallback';

/** 须与 CDN 文件名一致（区分大小写） */
export const CONTACT_PAGE_CODE = 'contact';

interface ContactLocalized {
  language_code: string;
  is_primary?: boolean;
  title?: string;
  label?: string;
  text?: string;
}

type ContactL10nKey = 'title' | 'label' | 'text';

function isPlaceholderString(val: string | undefined): boolean {
  if (!val || !String(val).trim()) return true;
  const t = String(val).trim();
  return t === '...' || t === '…' || /^\.{2,}$/.test(t);
}

function pickContactL10n(
  translations: ContactLocalized[] | undefined,
  locale: string,
  keys: ContactL10nKey[],
  fallbackRow?: Partial<Pick<ContactLocalized, ContactL10nKey>>
): Partial<Pick<ContactLocalized, ContactL10nKey>> {
  const row = getTranslationByLocale(translations || [], locale) as ContactLocalized | null;
  const out: Partial<Pick<ContactLocalized, ContactL10nKey>> = {};
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

function mergeContactItems<T, M>(
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

function resolveInfoItems(
  items:
    | Array<{ icon?: string; translations?: ContactLocalized[] }>
    | undefined,
  locale: string,
  fallback: ContactInfoItemDisplay[]
): ContactInfoItemDisplay[] {
  return mergeContactItems(items, fallback, (item, _i, fb) => {
    if (!item) return fb;
    const t = pickContactL10n(item.translations, locale, ['label', 'text'], {
      label: fb.label,
      text: fb.valueHtml,
    });
    return {
      iconClass:
        typeof item.icon === 'string' && item.icon ? item.icon : fb.iconClass,
      label: t.label || fb.label,
      valueHtml: t.text || fb.valueHtml,
    };
  });
}

function resolveFormFields(
  items:
    | Array<{
        field_id?: string;
        input_type?: string;
        col_class?: string;
        maxlength?: number | null;
        is_textarea?: boolean;
        textarea_rows?: number | null;
        icon?: string;
        translations?: ContactLocalized[];
      }>
    | undefined,
  locale: string,
  fallback: ContactFormFieldDisplay[]
): ContactFormFieldDisplay[] {
  return mergeContactItems(items, fallback, (item, _i, fb) => {
    if (!item) return fb;
    const t = pickContactL10n(item.translations, locale, ['label', 'text'], {
      label: fb.label,
      text: fb.placeholder,
    });
    const isTextarea =
      typeof item.is_textarea === 'boolean' ? item.is_textarea : fb.isTextarea;
    return {
      fieldId:
        typeof item.field_id === 'string' && item.field_id
          ? item.field_id
          : fb.fieldId,
      inputType: normalizeContactInputType(item.input_type, fb),
      colClass:
        typeof item.col_class === 'string' && item.col_class
          ? item.col_class
          : fb.colClass,
      label: t.label || fb.label,
      placeholder: t.text || fb.placeholder,
      iconClass: typeof item.icon === 'string' && item.icon ? item.icon : fb.iconClass,
      maxLength:
        typeof item.maxlength === 'number'
          ? item.maxlength
          : fb.maxLength,
      isTextarea,
      textareaRows:
        typeof item.textarea_rows === 'number'
          ? item.textarea_rows
          : fb.textareaRows,
    };
  });
}

export function resolveContactPageDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): ContactPageDisplay {
  const fallback = getContactFallback(locale);
  const meta = metadata || {};

  const seoT = pickContactL10n(
    (meta.seo as { translations?: ContactLocalized[] })?.translations,
    locale,
    ['title'],
    { title: fallback.seoTitle }
  );
  const breadcrumbT = pickContactL10n(
    (meta.breadcrumb as { translations?: ContactLocalized[] })?.translations,
    locale,
    ['title', 'label'],
    { title: fallback.breadcrumb.title, label: fallback.breadcrumb.activeLabel }
  );
  const breadcrumbMeta = (meta.breadcrumb || {}) as { home_href?: string };

  const sectionMeta = (meta.contact_section || meta.contact || {}) as {
    image?: string;
    image_alt?: string;
    translations?: ContactLocalized[];
    info_items?: Array<{ icon?: string; translations?: ContactLocalized[] }>;
    form_fields?: Array<{
      field_id?: string;
      input_type?: string;
      col_class?: string;
      maxlength?: number | null;
      is_textarea?: boolean;
      textarea_rows?: number | null;
      icon?: string;
      translations?: ContactLocalized[];
    }>;
    form_submit?: { translations?: ContactLocalized[] };
  };
  const sectionT = pickContactL10n(sectionMeta.translations, locale, ['title', 'label'], {
    title: fallback.sidebarTitle,
    label: fallback.formMobileTitle,
  });
  const submitT = pickContactL10n(sectionMeta.form_submit?.translations, locale, ['title'], {
    title: fallback.formSubmitText,
  });

  const mapMeta = (meta.map_section || meta.map || {}) as { iframe_src?: string };

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
    image:
      typeof sectionMeta.image === 'string' && sectionMeta.image
        ? sectionMeta.image
        : fallback.image,
    imageAlt:
      typeof sectionMeta.image_alt === 'string'
        ? sectionMeta.image_alt
        : fallback.imageAlt,
    sidebarTitle: sectionT.title || fallback.sidebarTitle,
    formMobileTitle: sectionT.label || fallback.formMobileTitle,
    infoItems: resolveInfoItems(sectionMeta.info_items, locale, fallback.infoItems),
    formFields: resolveFormFields(sectionMeta.form_fields, locale, fallback.formFields),
    formSubmitText: submitT.title || fallback.formSubmitText,
    mapIframeSrc:
      typeof mapMeta.iframe_src === 'string' && mapMeta.iframe_src
        ? mapMeta.iframe_src
        : fallback.mapIframeSrc,
  };
}

export async function fetchContactPageDisplay(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<ContactPageDisplay> {
  const data = await fetchWebPage(CONTACT_PAGE_CODE, tenantId);
  return resolveContactPageDisplay(data?.page?.metadata, locale);
}
