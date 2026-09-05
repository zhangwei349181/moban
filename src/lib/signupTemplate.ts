/**
 * signup 组件 HTML 模板注入
 */

import type { SignupSectionMeta } from '../components/sections/resolvers/signup';

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

export interface RenderSignupSectionOptions {
  meta: SignupSectionMeta;
  templateShell: string | null;
  clientI18n: SignupClientI18n;
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

export function renderSignupSectionHtml(options: RenderSignupSectionOptions): string {
  const { meta, templateShell, clientI18n } = options;
  if (!templateShell) return '';

  let html = expandConditionalBlocks(templateShell, {
    SIGNUP_HAS_HEADER: Boolean(meta.title || meta.subtitle),
    SIGNUP_HAS_TITLE: Boolean(meta.title),
    SIGNUP_HAS_SUBTITLE: Boolean(meta.subtitle),
  });

  return applyTemplate(html, {
    SIGNUP_TITLE: escapeHtml(meta.title),
    SIGNUP_SUBTITLE: escapeHtml(meta.subtitle),
    SIGNUP_DISPLAY_NAME_LABEL: escapeHtml(meta.displayNameLabel),
    SIGNUP_USERNAME_LABEL: escapeHtml(meta.usernameLabel),
    SIGNUP_EMAIL_LABEL: escapeHtml(meta.emailLabel),
    SIGNUP_PASSWORD_LABEL: escapeHtml(meta.passwordLabel),
    SIGNUP_SUBMIT_LABEL: escapeHtml(meta.submitLabel),
    SIGNUP_LOGIN_PROMPT: escapeHtml(meta.loginPrompt),
    SIGNUP_LOGIN_LINK_TEXT: escapeHtml(meta.loginLinkText),
    SIGNUP_LOGIN_URL: escapeHtml(meta.loginUrl),
    SIGNUP_HOME_URL: escapeHtml(meta.homeUrl),
    SIGNUP_SUCCESS_URL: escapeHtml(meta.successUrl),
    SIGNUP_I18N_JSON: escapeHtmlAttr(JSON.stringify(clientI18n)),
  });
}
