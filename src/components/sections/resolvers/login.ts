import { pickLocalePair, resolveHeader, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface LoginSectionMeta {
  title: string;
  subtitle: string;
  identifierLabel: string;
  passwordLabel: string;
  submitLabel: string;
  rememberLabel: string;
  forgotLabel: string;
  forgotUrl: string;
  signupPrompt: string;
  signupLinkText: string;
  signupUrl: string;
  homeUrl: string;
  successUrl: string;
}

const FALLBACK = {
  title: { en: 'Log in', zh: '登录' },
  subtitle: {
    en: 'Log in and enjoy a personalised experience.',
    zh: '登录后享受个性化体验。',
  },
  identifier: { en: 'Email / phone / username', zh: '邮箱 / 手机 / 用户名' },
  password: { en: 'Password', zh: '密码' },
  submit: { en: 'Sign in', zh: '登录' },
  remember: { en: 'Remember me', zh: '记住我' },
  forgot: { en: 'Forgot password', zh: '忘记密码' },
  signupPrompt: { en: "Don't have an account?", zh: '还没有账户？' },
  signupLink: { en: 'Create account', zh: '创建账户' },
};

export function resolveLoginSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): LoginSectionMeta {
  const meta = metadata || {};
  const header = resolveHeader(meta, locale, {
    title: pickLocalePair(locale, FALLBACK.title.en, FALLBACK.title.zh),
    subtitle: pickLocalePair(locale, FALLBACK.subtitle.en, FALLBACK.subtitle.zh),
  });

  return {
    title: header.title,
    subtitle: header.subtitle,
    identifierLabel: strMeta(
      meta.identifier_label ?? meta.identifierLabel,
      pickLocalePair(locale, FALLBACK.identifier.en, FALLBACK.identifier.zh)
    ),
    passwordLabel: strMeta(
      meta.password_label ?? meta.passwordLabel,
      pickLocalePair(locale, FALLBACK.password.en, FALLBACK.password.zh)
    ),
    submitLabel: strMeta(
      meta.submit_label ?? meta.submitLabel,
      pickLocalePair(locale, FALLBACK.submit.en, FALLBACK.submit.zh)
    ),
    rememberLabel: strMeta(
      meta.remember_label ?? meta.rememberLabel,
      pickLocalePair(locale, FALLBACK.remember.en, FALLBACK.remember.zh)
    ),
    forgotLabel: strMeta(
      meta.forgot_label ?? meta.forgotLabel,
      pickLocalePair(locale, FALLBACK.forgot.en, FALLBACK.forgot.zh)
    ),
    forgotUrl: strMeta(meta.forgot_url ?? meta.forgotUrl, '/forgot'),
    signupPrompt: strMeta(
      meta.signup_prompt ?? meta.signupPrompt,
      pickLocalePair(locale, FALLBACK.signupPrompt.en, FALLBACK.signupPrompt.zh)
    ),
    signupLinkText: strMeta(
      meta.signup_link_text ?? meta.signupLinkText,
      pickLocalePair(locale, FALLBACK.signupLink.en, FALLBACK.signupLink.zh)
    ),
    signupUrl: strMeta(meta.signup_url ?? meta.signupUrl, '/signup'),
    homeUrl: strMeta(meta.home_url ?? meta.homeUrl, '/'),
    successUrl: strMeta(meta.success_url ?? meta.successUrl ?? meta.redirect_url, '/dashboard'),
  };
}

/** 从 metadata.translations[].html_url（或内联 html）加载 login 展示模板壳；没有则返回 null。 */
export async function loadLoginSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
