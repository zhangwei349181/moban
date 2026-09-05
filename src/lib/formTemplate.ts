/**
 * form 组件 HTML 模板注入（metadata html_url + 占位符）
 */

import type { FormSectionViewModel } from './formSection';
import { formFieldColClass, renderFormFieldHtml } from './formFieldHtml';

export interface RenderFormSectionOptions {
  vm: FormSectionViewModel;
  templateShell: string;
  pendingMessage: string;
  clientI18nJson: string;
}

const BLOCK_PATTERN = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

function escapeHtml(value: string | null | undefined): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function applyTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.split(`{{${key}}}`).join(value),
    template
  );
}

function expandConditionalBlocks(
  template: string,
  conditions: Record<string, boolean>
): string {
  let html = template;
  for (let pass = 0; pass < 16; pass += 1) {
    let changed = false;
    html = html.replace(BLOCK_PATTERN, (match, tag, body) => {
      if (!(tag in conditions)) return match;
      changed = true;
      return conditions[tag] ? body : '';
    });
    if (!changed) break;
  }
  return html;
}

function expandFormFields(template: string, vm: FormSectionViewModel): string {
  const pattern = /\{\{#FORM_FIELD\}\}([\s\S]*?)\{\{\/FORM_FIELD\}\}/g;
  return template.replace(pattern, (_, body) =>
    vm.fields
      .map((field) =>
        applyTemplate(body, {
          FORM_FIELD_COL_CLASS: escapeHtml(formFieldColClass(field.fieldType)),
          FORM_FIELD_HTML: renderFormFieldHtml(field),
          FORM_FIELD_KEY: escapeHtml(field.fieldKey),
          FORM_FIELD_TYPE: escapeHtml(field.fieldType),
          FORM_FIELD_LABEL: escapeHtml(field.label),
        })
      )
      .join('\n')
  );
}

export function renderFormSectionHtml(options: RenderFormSectionOptions): string {
  const { vm, templateShell, pendingMessage, clientI18nJson } = options;

  let html = expandFormFields(templateShell, vm);

  html = expandConditionalBlocks(html, {
    FORM_HAS_HEADER: Boolean(vm.title || vm.subtitle),
    FORM_HAS_TITLE: Boolean(vm.title),
    FORM_HAS_SUBTITLE: Boolean(vm.subtitle),
    FORM_IS_READY: vm.status === 'ready',
    FORM_IS_PENDING: vm.status === 'pending',
  });

  return applyTemplate(html, {
    FORM_TITLE: escapeHtml(vm.title),
    FORM_SUBTITLE: escapeHtml(vm.subtitle),
    FORM_PENDING_MESSAGE: escapeHtml(pendingMessage),
    FORM_SUBMIT_LABEL: escapeHtml(vm.submitLabel),
    FORM_TEMPLATE_ID: escapeHtml(vm.templateId),
    FORM_TYPE: escapeHtml(vm.formType),
    FORM_I18N_JSON: escapeHtmlAttr(clientI18nJson),
    FORM_FIELDS: vm.fields.map((f) => renderFormFieldHtml(f)).join('\n'),
  });
}
