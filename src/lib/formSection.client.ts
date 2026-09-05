/**
 * 动态表单 Section — 客户端验证、上传、提交
 */

import { createFormSubmission } from './formSubmission';
import { uploadFile } from './fileUpload';

export interface FormSectionClientI18n {
  submit: string;
  submitting: string;
  submitSuccess: string;
  submitErrorRequired: string;
  uploading: string;
  /** 无 template_id 或模板不可用时（如 footer 订阅） */
  unavailable?: string;
}

type FormControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function getFieldElement(container: Element): FormControlElement | null {
  const el = container.querySelector('input[name], textarea[name], select[name]');
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    return el;
  }
  return null;
}

function validateForm(form: HTMLFormElement): boolean {
  const fields = form.querySelectorAll<HTMLElement>('[data-field-key]');
  let valid = true;

  for (const container of fields) {
    container.classList.remove('has-error');
    const el = getFieldElement(container);
    if (!el || !el.hasAttribute('required')) continue;

    let fieldValid = true;

    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      fieldValid = el.checked;
    } else if (el instanceof HTMLInputElement && el.type === 'file') {
      const urls = el.dataset.uploadedUrls;
      const parsed = urls ? (JSON.parse(urls) as string[]) : [];
      fieldValid = parsed.length > 0;
    } else if (el instanceof HTMLSelectElement && el.multiple) {
      fieldValid = el.selectedOptions.length > 0;
    } else {
      fieldValid = Boolean(el.value.trim());
    }

    if (!fieldValid) {
      valid = false;
      container.classList.add('has-error');
    }
  }

  return valid;
}

function collectFormData(form: HTMLFormElement): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  const fields = form.querySelectorAll<HTMLElement>('[data-field-key]');

  for (const container of fields) {
    const fieldKey = container.getAttribute('data-field-key');
    if (!fieldKey) continue;
    const el = getFieldElement(container);
    if (!el) continue;

    if (el instanceof HTMLInputElement && el.type === 'file') {
      const urls = el.dataset.uploadedUrls;
      metadata[fieldKey] = urls ? JSON.parse(urls) : [];
    } else if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      metadata[fieldKey] = el.checked;
    } else if (el instanceof HTMLSelectElement && el.multiple) {
      metadata[fieldKey] = Array.from(el.selectedOptions).map((o) => o.value);
    } else {
      const value = el.value.trim();
      if (value) metadata[fieldKey] = value;
    }
  }

  return metadata;
}

function showMessage(
  form: HTMLFormElement,
  text: string,
  type: 'success' | 'error' | 'info'
) {
  const box = form.querySelector<HTMLElement>('[data-form-message]');
  if (!box) return;
  box.textContent = text;
  box.hidden = false;
  box.dataset.type = type;
}

function clearFilePreviews(form: HTMLFormElement) {
  form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
    delete input.dataset.uploadedUrls;
    const preview = document.getElementById(`${input.id}-preview`);
    if (preview) preview.innerHTML = '';
  });
}

function bindFileUpload(form: HTMLFormElement, uploadingLabel: string) {
  form.querySelectorAll<HTMLInputElement>('input[data-upload-field]').forEach((input) => {
    input.addEventListener('change', async () => {
      const files = input.files;
      const progress = document.getElementById(`${input.id}-progress`);
      const preview = document.getElementById(`${input.id}-preview`);
      if (!files?.length) {
        delete input.dataset.uploadedUrls;
        if (preview) preview.innerHTML = '';
        return;
      }

      if (progress) {
        progress.textContent = uploadingLabel;
        progress.hidden = false;
      }

      try {
        const urls: string[] = [];
        for (const file of Array.from(files)) {
          const result = await uploadFile(file);
          urls.push(result.url);
        }
        input.dataset.uploadedUrls = JSON.stringify(urls);

        if (preview) {
          const fieldType = input
            .closest('[data-field-type]')
            ?.getAttribute('data-field-type');
          preview.innerHTML = urls
            .map((url) => {
              if (fieldType === 'image') {
                return `<a class="form-field__preview-img" href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="" loading="lazy" /></a>`;
              }
              return `<a class="form-field__preview-link" href="${url}" target="_blank" rel="noopener">${url.split('/').pop()}</a>`;
            })
            .join('');
        }
      } catch (error) {
        console.error('[formSection] file upload failed:', error);
        delete input.dataset.uploadedUrls;
        if (preview) preview.innerHTML = '';
      } finally {
        if (progress) progress.hidden = true;
      }
    });
  });
}

function bindForm(form: HTMLFormElement, i18n: FormSectionClientI18n) {
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const templateId = form.dataset.templateId || '';
  const formType = form.dataset.formType || 'contact';
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-form-submit]');
  const defaultSubmitHtml = submitBtn?.innerHTML ?? i18n.submit;

  bindFileUpload(form, i18n.uploading);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!templateId) {
      showMessage(
        form,
        i18n.unavailable || i18n.submitErrorRequired,
        'error'
      );
      return;
    }

    if (!validateForm(form)) {
      showMessage(form, i18n.submitErrorRequired, 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = i18n.submitting;
    }

    try {
      const metadata = collectFormData(form);
      await createFormSubmission({
        template_id: templateId,
        type: formType,
        metadata,
      });
      showMessage(form, i18n.submitSuccess, 'success');
      form.reset();
      clearFilePreviews(form);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      showMessage(form, msg || i18n.submitErrorRequired, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = defaultSubmitHtml;
      }
    }
  });
}

const DEFAULT_I18N: FormSectionClientI18n = {
  submit: 'Submit',
  submitting: 'Submitting...',
  submitSuccess: 'Thank you for your message!',
  submitErrorRequired: 'Please fill in all required fields.',
  uploading: 'Uploading...',
};

function parseFormI18n(form: HTMLFormElement): FormSectionClientI18n {
  const raw = form.dataset.formI18n;
  if (!raw) return DEFAULT_I18N;
  try {
    const parsed = JSON.parse(raw) as Partial<FormSectionClientI18n>;
    return { ...DEFAULT_I18N, ...parsed };
  } catch {
    return DEFAULT_I18N;
  }
}

export function initDynamicFormSections() {
  document.querySelectorAll<HTMLFormElement>('[data-dynamic-form]').forEach((form) => {
    bindForm(form, parseFormI18n(form));
  });
}
