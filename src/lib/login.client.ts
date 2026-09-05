/**
 * login 动态组件 — 客户端提交逻辑
 */

import { login } from './auth';
import { resolvePostAuthRedirect } from './postAuthRedirect';

export interface LoginClientI18n {
  submit: string;
  submitting: string;
  errorIncomplete: string;
  errorFailed: string;
}

const DEFAULT_I18N: LoginClientI18n = {
  submit: 'SIGN IN',
  submitting: 'Signing in...',
  errorIncomplete: 'Please fill in your login information.',
  errorFailed: 'Login failed. Please check your credentials.',
};

function parseLoginI18n(form: HTMLFormElement): LoginClientI18n {
  const raw = form.dataset.loginI18n;
  if (!raw) return DEFAULT_I18N;
  try {
    return { ...DEFAULT_I18N, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_I18N;
  }
}

function bindLoginForm(form: HTMLFormElement) {
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const i18n = parseLoginI18n(form);
  const errorEl = form.querySelector('[data-login-error]') as HTMLElement | null;
  const submitBtn = form.querySelector('[data-login-submit]') as HTMLButtonElement | null;
  const submitLabel = submitBtn?.querySelector('[data-login-submit-text]') as HTMLElement | null;
  const defaultSubmitText = submitLabel?.textContent || i18n.submit;

  function showError(message: string) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError();

    const formData = new FormData(form);
    const loginIdentifier = String(formData.get('login_identifier') || '').trim();
    const password = String(formData.get('password') || '');
    const rememberMe = formData.get('remember_me') === 'true';

    if (!loginIdentifier || !password) {
      showError(i18n.errorIncomplete);
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = i18n.submitting;
    }

    try {
      await login(loginIdentifier, password, undefined, rememberMe);
      if (typeof (window as any).updateHeaderLogin === 'function') {
        (window as any).updateHeaderLogin();
      }
      const configured = form.dataset.successUrl;
      const fallback = configured && configured.startsWith('/') ? configured : '/dashboard';
      window.location.href = await resolvePostAuthRedirect(fallback);
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

export function initLoginSections() {
  document.querySelectorAll<HTMLFormElement>('[data-login-form]').forEach(bindLoginForm);
}
