/**
 * 动态表单 Section — 服务端加载模板字段
 */

import {
  fetchTemplateForTenant,
  getTranslationByLocale,
  type TemplateField,
} from './template';
import type { FormSectionMeta } from '../components/sections/resolvers/form';

export type FormFieldType = TemplateField['field_type'];

export interface FormFieldView {
  id: string;
  fieldKey: string;
  fieldType: FormFieldType;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
  options: string[];
  accept?: string;
  rows: number;
}

export type FormSectionStatus = 'pending' | 'ready';

export interface FormSectionViewModel {
  status: FormSectionStatus;
  templateId: string;
  formType: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  fields: FormFieldView[];
}

function mapFieldToView(field: TemplateField, locale: string): FormFieldView {
  const translation = getTranslationByLocale(field.translations || [], locale, field);
  const label =
    translation?.display_name ||
    translation?.field_name ||
    field.display_name ||
    field.field_name ||
    field.field_key;
  const description = translation?.description || field.description || '';
  const placeholder = translation?.placeholder || field.placeholder || '';
  const options = Array.isArray(field.validation_rules?.options)
    ? field.validation_rules.options.map(String)
    : [];

  let accept: string | undefined;
  const formats = field.validation_rules?.allowed_formats;
  if (Array.isArray(formats) && formats.length) {
    accept = formats.map((f) => (String(f).startsWith('.') ? String(f) : `.${f}`)).join(',');
  }

  return {
    id: field.id,
    fieldKey: field.field_key,
    fieldType: field.field_type,
    label,
    description,
    placeholder,
    required: Boolean(field.is_required),
    options,
    accept,
    rows: field.field_type === 'rich_text' ? 8 : field.field_type === 'textarea' ? 4 : 1,
  };
}

export async function loadFormSectionViewModel(
  meta: FormSectionMeta,
  locale: string,
  tenantId: string
): Promise<FormSectionViewModel> {
  const base: FormSectionViewModel = {
    status: 'pending',
    templateId: meta.templateId,
    formType: meta.formType,
    title: meta.title,
    subtitle: meta.subtitle,
    submitLabel: meta.submitLabel,
    fields: [],
  };

  if (!meta.templateId) return base;

  const templateData = await fetchTemplateForTenant(meta.templateId, tenantId);
  if (!templateData?.fields?.length) return base;

  const fields = templateData.fields
    .filter((f) => f.status === 'active')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((f) => mapFieldToView(f, locale));

  if (!fields.length) return base;

  return {
    ...base,
    status: 'ready',
    fields,
  };
}
