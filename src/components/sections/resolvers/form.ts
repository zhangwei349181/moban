import { resolveCta, resolveHeader, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface FormSectionMeta {
  templateId: string;
  formType: string;
  title: string;
  subtitle: string;
  submitLabel: string;
}

const FALLBACK_TITLE_EN = 'Get in touch';
const FALLBACK_TITLE_ZH = '联系我们';
const FALLBACK_SUBTITLE_EN = 'Fill out the form and we will get back to you soon.';
const FALLBACK_SUBTITLE_ZH = '填写表单，我们会尽快与您联系。';
const FALLBACK_SUBMIT_EN = 'Submit';
const FALLBACK_SUBMIT_ZH = '提交';

export function resolveFormSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): FormSectionMeta {
  const zh = String(locale).split('-')[0].toLowerCase() === 'zh';
  const meta = metadata || {};

  const header = resolveHeader(meta, locale, {
    title: zh ? FALLBACK_TITLE_ZH : FALLBACK_TITLE_EN,
    subtitle: zh ? FALLBACK_SUBTITLE_ZH : FALLBACK_SUBTITLE_EN,
  });

  const templateId = strMeta(
    meta.template_id ?? meta.templateId ?? meta.template,
    ''
  );

  const formType = strMeta(meta.form_type, 'contact');

  const submitFallback = strMeta(
    meta.submit_label ?? meta.submitLabel,
    zh ? FALLBACK_SUBMIT_ZH : FALLBACK_SUBMIT_EN
  );
  const cta = resolveCta(meta, locale, { label: submitFallback, href: '#' });
  const submitLabel = cta.label;

  return {
    templateId,
    formType,
    title: header.title,
    subtitle: header.subtitle,
    submitLabel,
  };
}

/** 从 metadata.translations[].html_url（或内联 html）加载 form 展示模板壳；没有则返回 null。 */
export async function loadFormSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
