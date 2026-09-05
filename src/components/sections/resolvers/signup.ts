import { pickLocalePair, resolveHeader, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';

export interface SignupSectionMeta {
  title: string;
  subtitle: string;
  displayNameLabel: string;
  usernameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  loginPrompt: string;
  loginLinkText: string;
  loginUrl: string;
  homeUrl: string;
  successUrl: string;
}

const FALLBACK = {
  title: { en: 'Create account', zh: '创建账户' },
  subtitle: {
    en: 'Enter your information below to proceed.',
    zh: '请填写以下信息完成注册。',
  },
  displayName: { en: 'Display name', zh: '显示名称' },
  username: { en: 'Username', zh: '用户名' },
  email: { en: 'Email', zh: '邮箱' },
  password: { en: 'Password (at least 8 characters)', zh: '密码（至少 8 个字符）' },
  submit: { en: 'Create account', zh: '创建账户' },
  loginPrompt: { en: 'Already have an account?', zh: '已有账户？' },
  loginLink: { en: 'Log in', zh: '登录' },
};

export function resolveSignupSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): SignupSectionMeta {
  const meta = metadata || {};
  const header = resolveHeader(meta, locale, {
    title: pickLocalePair(locale, FALLBACK.title.en, FALLBACK.title.zh),
    subtitle: pickLocalePair(locale, FALLBACK.subtitle.en, FALLBACK.subtitle.zh),
  });

  return {
    title: header.title,
    subtitle: header.subtitle,
    displayNameLabel: strMeta(
      meta.display_name_label ?? meta.displayNameLabel,
      pickLocalePair(locale, FALLBACK.displayName.en, FALLBACK.displayName.zh)
    ),
    usernameLabel: strMeta(
      meta.username_label ?? meta.usernameLabel,
      pickLocalePair(locale, FALLBACK.username.en, FALLBACK.username.zh)
    ),
    emailLabel: strMeta(
      meta.email_label ?? meta.emailLabel,
      pickLocalePair(locale, FALLBACK.email.en, FALLBACK.email.zh)
    ),
    passwordLabel: strMeta(
      meta.password_label ?? meta.passwordLabel,
      pickLocalePair(locale, FALLBACK.password.en, FALLBACK.password.zh)
    ),
    submitLabel: strMeta(
      meta.submit_label ?? meta.submitLabel,
      pickLocalePair(locale, FALLBACK.submit.en, FALLBACK.submit.zh)
    ),
    loginPrompt: strMeta(
      meta.login_prompt ?? meta.loginPrompt,
      pickLocalePair(locale, FALLBACK.loginPrompt.en, FALLBACK.loginPrompt.zh)
    ),
    loginLinkText: strMeta(
      meta.login_link_text ?? meta.loginLinkText,
      pickLocalePair(locale, FALLBACK.loginLink.en, FALLBACK.loginLink.zh)
    ),
    loginUrl: strMeta(meta.login_url ?? meta.loginUrl, '/login'),
    homeUrl: strMeta(meta.home_url ?? meta.homeUrl, '/'),
    successUrl: strMeta(meta.success_url ?? meta.successUrl, '/'),
  };
}

/** 从 metadata.translations[].html_url（或内联 html）加载 signup 展示模板壳；没有则返回 null。 */
export async function loadSignupSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
