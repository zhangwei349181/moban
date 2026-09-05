/**
 * 动态表单字段 — SSR HTML 字符串（供 form 模板 {{FORM_FIELD_HTML}} 注入）
 * 无 Tailwind；皮 CSS 覆盖 .dynamic-form-field / .form-field__*
 */

import type { FormFieldView } from './formSection';

function escapeHtml(value: string | null | undefined): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formFieldColClass(fieldType: FormFieldView['fieldType']): string {
  if (
    fieldType === 'textarea' ||
    fieldType === 'rich_text' ||
    fieldType === 'file' ||
    fieldType === 'image'
  ) {
    return 'form-field--wide';
  }
  return '';
}

function reqMark(required: boolean): string {
  return required ? ' <span class="form-field__req" aria-hidden="true">*</span>' : '';
}

export function renderFormFieldHtml(field: FormFieldView): string {
  const inputId = `form-field-${field.id}`;
  const req = field.required ? ' required' : '';
  const name = escapeHtml(field.fieldKey);
  const id = escapeHtml(inputId);
  const ph = escapeHtml(field.placeholder);

  const parts: string[] = [];
  parts.push(
    `<div class="dynamic-form-field" data-field-key="${name}" data-field-type="${escapeHtml(field.fieldType)}">`
  );

  if (field.fieldType !== 'boolean') {
    parts.push(
      `<label class="form-field__label" for="${id}">${escapeHtml(field.label)}${reqMark(field.required)}</label>`
    );
    if (field.description) {
      parts.push(`<p class="form-field__desc">${escapeHtml(field.description)}</p>`);
    }
  }

  switch (field.fieldType) {
    case 'text':
      parts.push(
        `<input class="form-field__control" type="text" id="${id}" name="${name}" placeholder="${ph}"${req} />`
      );
      break;
    case 'email':
      parts.push(
        `<input class="form-field__control" type="email" id="${id}" name="${name}" placeholder="${ph}"${req} />`
      );
      break;
    case 'phone':
      parts.push(
        `<input class="form-field__control" type="tel" id="${id}" name="${name}" placeholder="${ph}"${req} />`
      );
      break;
    case 'textarea':
    case 'rich_text':
      parts.push(
        `<textarea class="form-field__control" id="${id}" name="${name}" rows="${field.rows}" placeholder="${ph}"${req}></textarea>`
      );
      break;
    case 'number':
      parts.push(
        `<input class="form-field__control" type="number" id="${id}" name="${name}" placeholder="${ph}"${req} />`
      );
      break;
    case 'date':
      parts.push(
        `<input class="form-field__control" type="date" id="${id}" name="${name}"${req} />`
      );
      break;
    case 'datetime':
      parts.push(
        `<input class="form-field__control" type="datetime-local" id="${id}" name="${name}"${req} />`
      );
      break;
    case 'boolean':
      parts.push(
        `<label class="form-field__check">` +
          `<input type="checkbox" id="${id}" name="${name}"${req} />` +
          `<span>` +
          `<span class="form-field__label">${escapeHtml(field.label)}${reqMark(field.required)}</span>` +
          (field.description
            ? `<span class="form-field__desc">${escapeHtml(field.description)}</span>`
            : '') +
          `</span>` +
        `</label>`
      );
      break;
    case 'select': {
      const blank = field.placeholder
        ? `<option value="">${escapeHtml(field.placeholder)}</option>`
        : '';
      const opts = field.options
        .map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`)
        .join('');
      parts.push(
        `<select class="form-field__control" id="${id}" name="${name}"${req}>${blank}${opts}</select>`
      );
      break;
    }
    case 'multiselect': {
      const size = Math.min(Math.max(field.options.length, 3), 6);
      const opts = field.options
        .map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`)
        .join('');
      parts.push(
        `<select class="form-field__control" id="${id}" name="${name}" multiple${req} size="${size}">${opts}</select>`
      );
      break;
    }
    case 'file':
    case 'image':
      parts.push(
        `<input class="form-field__control" type="file" id="${id}" name="${name}"${
          field.accept ? ` accept="${escapeHtml(field.accept)}"` : ''
        } multiple${req} data-upload-field="true" />` +
          `<div class="form-field__progress" id="${id}-progress" hidden aria-live="polite"></div>` +
          `<div class="form-field__preview" id="${id}-preview"></div>`
      );
      break;
    default:
      parts.push(
        `<input class="form-field__control" type="text" id="${id}" name="${name}" placeholder="${ph}"${req} />`
      );
  }

  parts.push('</div>');
  return parts.join('\n');
}
