import { pickLocalePair, resolveHeader, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface VerifyEmailSectionMeta {
  title: string;
  subtitle: string;
  sentToLabel: string;
  codeLabel: string;
  codePlaceholder: string;
  submitLabel: string;
  resendLabel: string;
  homeUrl: string;
  loginUrl: string;
  signupUrl: string;
  successUrl: string;
}

const FALLBACK = {
  title: { en: 'Verify email', zh: '验证邮箱' },
  subtitle: {
    en: 'We sent a verification code to your email. Enter it below to continue.',
    zh: '我们已向您的邮箱发送验证码，请查收并输入以完成验证。',
  },
  sentTo: { en: 'Code sent to:', zh: '验证码已发送至：' },
  code: { en: 'Verification code', zh: '验证码' },
  placeholder: { en: 'Enter code', zh: '请输入验证码' },
  submit: { en: 'Verify', zh: '确认验证' },
  resend: { en: 'Resend code', zh: '重新发送验证码' },
};

export function resolveVerifyEmailSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): VerifyEmailSectionMeta {
  const meta = metadata || {};
  const header = resolveHeader(meta, locale, {
    title: pickLocalePair(locale, FALLBACK.title.en, FALLBACK.title.zh),
    subtitle: pickLocalePair(locale, FALLBACK.subtitle.en, FALLBACK.subtitle.zh),
  });

  return {
    title: header.title,
    subtitle: header.subtitle,
    sentToLabel: strMeta(
      meta.sent_to_label ?? meta.sentToLabel,
      pickLocalePair(locale, FALLBACK.sentTo.en, FALLBACK.sentTo.zh)
    ),
    codeLabel: strMeta(
      meta.code_label ?? meta.codeLabel,
      pickLocalePair(locale, FALLBACK.code.en, FALLBACK.code.zh)
    ),
    codePlaceholder: strMeta(
      meta.code_placeholder ?? meta.codePlaceholder,
      pickLocalePair(locale, FALLBACK.placeholder.en, FALLBACK.placeholder.zh)
    ),
    submitLabel: strMeta(
      meta.submit_label ?? meta.submitLabel,
      pickLocalePair(locale, FALLBACK.submit.en, FALLBACK.submit.zh)
    ),
    resendLabel: strMeta(
      meta.resend_label ?? meta.resendLabel,
      pickLocalePair(locale, FALLBACK.resend.en, FALLBACK.resend.zh)
    ),
    homeUrl: strMeta(meta.home_url ?? meta.homeUrl, '/'),
    loginUrl: strMeta(meta.login_url ?? meta.loginUrl, '/login'),
    signupUrl: strMeta(meta.signup_url ?? meta.signupUrl, '/signup'),
    successUrl: strMeta(meta.success_url ?? meta.successUrl, '/dashboard'),
  };
}

export async function loadVerifyEmailSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
