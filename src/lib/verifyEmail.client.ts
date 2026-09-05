/**
 * 邮箱验证区块 — 发码、确认、冷却
 */

import { confirmRegisterEmailCode, sendRegisterEmailCode } from './emailVerification';
import {
  getUser,
  isAuthenticated,
  isEmailVerified,
  refreshLocalAuthFromUserProfile,
  setEmailVerified,
} from './auth';
import { isTenantEmailVerifyRequired } from './tenant';
import { APP_CONFIG } from '../config/app';

export interface VerifyEmailClientI18n {
  submit: string;
  submitting: string;
  resend: string;
  sending: string;
  resendIn: string;
  sentSuccess: string;
  expiresHint: string;
  success: string;
  errorRequired: string;
  errorSendFailed: string;
  errorConfirmFailed: string;
  errorNotConfigured: string;
  errorRateLimit: string;
}

const DEFAULT_I18N: VerifyEmailClientI18n = {
  submit: 'Verify',
  submitting: 'Verifying...',
  resend: 'Resend code',
  sending: 'Sending...',
  resendIn: 'Resend in {seconds}s',
  sentSuccess: 'Verification code sent. Please check your email.',
  expiresHint: 'The code is valid for about {minutes} minutes.',
  success: 'Email verified! Redirecting...',
  errorRequired: 'Please enter the verification code',
  errorSendFailed: 'Failed to send code. Please try again later.',
  errorConfirmFailed: 'Verification failed. Please check the code.',
  errorNotConfigured: 'Email verification is not configured. Please contact support.',
  errorRateLimit: 'Too many requests. Please try again later.',
};

function parseI18n(form: HTMLFormElement): VerifyEmailClientI18n {
  const raw = form.dataset.verifyemailI18n;
  if (!raw) return DEFAULT_I18N;
  try {
    return { ...DEFAULT_I18N, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_I18N;
  }
}

function safeReturnPath(raw: string | null | undefined): string {
  const value = String(raw || '').trim();
  if (!value.startsWith('/')) return '';
  if (value.startsWith('//')) return '';
  if (value.startsWith('/verifyemail')) return '';
  return value;
}

function resolveSuccessUrl(form: HTMLFormElement): string {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = safeReturnPath(params.get('return'));
  if (fromQuery) return fromQuery;
  const configured = form.dataset.successUrl;
  return configured && configured.startsWith('/') ? configured : '/';
}

function bindVerifyEmailForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-verifyemail-form]');
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const i18n = parseI18n(form);
  const emailEl = root.querySelector<HTMLElement>('[data-verifyemail-email]');
  const hintEl = root.querySelector<HTMLElement>('[data-verifyemail-hint]');
  const errorEl = root.querySelector<HTMLElement>('[data-verifyemail-error]');
  const successEl = root.querySelector<HTMLElement>('[data-verifyemail-success]');
  const submitBtn = root.querySelector<HTMLButtonElement>('[data-verifyemail-submit]');
  const submitText = root.querySelector<HTMLElement>('[data-verifyemail-submit-text]');
  const resendBtn = root.querySelector<HTMLButtonElement>('[data-verifyemail-resend]');
  const resendText = root.querySelector<HTMLElement>('[data-verifyemail-resend-text]');
  const codeInput = form.querySelector<HTMLInputElement>('input[name="code"]');
  const loginUrl = form.dataset.loginUrl || '/login';
  const signupUrl = form.dataset.signupUrl || '/signup';
  const defaultSubmit = submitText?.textContent || i18n.submit;
  const defaultResend = resendText?.textContent || i18n.resend;

  let targetEmail = '';
  let cooldownTimer: ReturnType<typeof setInterval> | null = null;
  let cooldownLeft = 0;

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

  function startCooldown(seconds: number) {
    cooldownLeft = Math.max(0, Math.floor(seconds));
    if (cooldownTimer) clearInterval(cooldownTimer);

    const tick = () => {
      if (!resendBtn || !resendText) return;
      if (cooldownLeft <= 0) {
        resendBtn.disabled = false;
        resendText.textContent = defaultResend;
        if (cooldownTimer) clearInterval(cooldownTimer);
        cooldownTimer = null;
        return;
      }
      resendBtn.disabled = true;
      resendText.textContent = i18n.resendIn.replace('{seconds}', String(cooldownLeft));
      cooldownLeft -= 1;
    };

    tick();
    cooldownTimer = setInterval(tick, 1000);
  }

  function setHint(expiresIn?: number) {
    if (!hintEl) return;
    const mins = Math.max(1, Math.round((expiresIn ?? 900) / 60));
    hintEl.textContent = i18n.expiresHint.replace('{minutes}', String(mins));
  }

  async function doSend(auto = false) {
    hideMessages();
    if (!targetEmail) return;
    if (resendBtn) resendBtn.disabled = true;
    if (resendText && !auto) resendText.textContent = i18n.sending;

    try {
      const data = await sendRegisterEmailCode(targetEmail);
      setHint(data.expires_in_seconds);
      if (!auto) showSuccess(i18n.sentSuccess);
      startCooldown(data.cooldown_seconds ?? 60);
    } catch (err: unknown) {
      const error = err as Error & { code?: number; retryAfterSeconds?: number };
      if (error?.code === 409) {
        setEmailVerified(true);
        window.location.href = resolveSuccessUrl(form);
        return;
      }
      if (error?.code === 404) {
        showError(i18n.errorNotConfigured);
      } else if (error?.code === 429) {
        showError(i18n.errorRateLimit);
        startCooldown(error.retryAfterSeconds ?? 60);
      } else {
        showError(error?.message || i18n.errorSendFailed);
        if (resendBtn) resendBtn.disabled = false;
        if (resendText) resendText.textContent = defaultResend;
      }
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessages();
    const code = String(codeInput?.value || '')
      .trim()
      .replace(/\D/g, '');
    if (!code) {
      showError(i18n.errorRequired);
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = i18n.submitting;

    try {
      const result = await confirmRegisterEmailCode(targetEmail, code);
      if (result.email_verified !== false) setEmailVerified(true);
      showSuccess(i18n.success);
      setTimeout(() => {
        window.location.href = resolveSuccessUrl(form);
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : i18n.errorConfirmFailed;
      showError(message || i18n.errorConfirmFailed);
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = defaultSubmit;
    }
  });

  resendBtn?.addEventListener('click', () => void doSend(false));

  void (async function boot() {
    if (!isAuthenticated()) {
      window.location.href = loginUrl;
      return;
    }

    await refreshLocalAuthFromUserProfile();

    const tenantId =
      String((window as any).__ASTRO_TENANT_ID__ || '') || APP_CONFIG.tenantId;
    if (!(await isTenantEmailVerifyRequired(tenantId)) || isEmailVerified()) {
      window.location.href = resolveSuccessUrl(form);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    targetEmail = params.get('email')?.trim() || getUser()?.email?.trim() || '';
    if (!targetEmail) {
      window.location.href = signupUrl;
      return;
    }
    if (emailEl) emailEl.textContent = targetEmail;

    const sentKey = `verify_email_sent_${targetEmail}`;
    if (sessionStorage.getItem(sentKey) !== '1') {
      sessionStorage.setItem(sentKey, '1');
      void doSend(true);
    } else {
      startCooldown(60);
    }
  })();
}

export function initVerifyEmailSections() {
  document
    .querySelectorAll<HTMLElement>('[data-verifyemail-section]')
    .forEach(bindVerifyEmailForm);
}
