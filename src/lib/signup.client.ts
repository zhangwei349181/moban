/**
 * signup 动态组件 — 客户端提交逻辑
 */

import { register } from './auth';
import { resolvePostAuthRedirect } from './postAuthRedirect';

export interface SignupClientI18n {
  submit: string;
  submitting: string;
  errorRequired: string;
  errorPasswordLength: string;
  errorInvalidEmail: string;
  errorUsernameFormat: string;
  successRedirect: string;
  errorFailed: string;
}

const DEFAULT_I18N: SignupClientI18n = {
  submit: 'CREATE ACCOUNT',
  submitting: 'Creating account...',
  errorRequired: 'Please enter email, password, and display name.',
  errorPasswordLength: 'Password must be at least 8 characters.',
  errorInvalidEmail: 'Please enter a valid email address.',
  errorUsernameFormat: 'Username must be 3-50 characters and contain only letters and numbers.',
  successRedirect: 'Registration successful! Redirecting...',
  errorFailed: 'Registration failed. Please check your information.',
};

function parseSignupI18n(form: HTMLFormElement): SignupClientI18n {
  const raw = form.dataset.signupI18n;
  if (!raw) return DEFAULT_I18N;
  try {
    return { ...DEFAULT_I18N, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_I18N;
  }
}

function bindSignupForm(form: HTMLFormElement) {
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const i18n = parseSignupI18n(form);
  const errorEl = form.querySelector('[data-signup-error]') as HTMLElement | null;
  const successEl = form.querySelector('[data-signup-success]') as HTMLElement | null;
  const submitBtn = form.querySelector('[data-signup-submit]') as HTMLButtonElement | null;
  const submitLabel = submitBtn?.querySelector('[data-signup-submit-text]') as HTMLElement | null;
  const defaultSubmitText = submitLabel?.textContent || i18n.submit;
  const successUrl = form.dataset.successUrl || '/';

  function showError(message: string) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
    if (successEl) successEl.hidden = true;
  }

  function showSuccess(message: string) {
    if (successEl) {
      successEl.textContent = message;
      successEl.hidden = false;
    }
    if (errorEl) errorEl.hidden = true;
  }

  function hideMessages() {
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    if (successEl) {
      successEl.hidden = true;
      successEl.textContent = '';
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessages();

    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const displayName = String(formData.get('display_name') || '').trim();
    const username = String(formData.get('username') || '').trim();

    if (!email || !password || !displayName) {
      showError(i18n.errorRequired);
      return;
    }
    if (password.length < 8) {
      showError(i18n.errorPasswordLength);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(i18n.errorInvalidEmail);
      return;
    }
    if (username && (username.length < 3 || username.length > 50 || !/^[a-zA-Z0-9]+$/.test(username))) {
      showError(i18n.errorUsernameFormat);
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = i18n.submitting;
    }

    try {
      await register(email, password, displayName, undefined, undefined, username || undefined);
      if (typeof (window as any).updateHeaderLogin === 'function') {
        (window as any).updateHeaderLogin();
      }
      const dest = await resolvePostAuthRedirect(
        successUrl.startsWith('/') ? successUrl : '/'
      );
      showSuccess(i18n.successRedirect);
      const delay = dest.includes('/verifyemail') ? 400 : 1500;
      setTimeout(() => {
        window.location.href = dest;
      }, delay);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : i18n.errorFailed;
      showError(message || i18n.errorFailed);
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = defaultSubmitText;
      }
    }
  });
}

export function initSignupSections() {
  document.querySelectorAll<HTMLFormElement>('[data-signup-form]').forEach(bindSignupForm);
}
