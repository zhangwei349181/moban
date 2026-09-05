/**
 * login 组件 HTML 模板注入
 */

import type { LoginSectionMeta } from '../components/sections/resolvers/login';

export interface LoginClientI18n {
  submit: string;
  submitting: string;
  errorIncomplete: string;
  errorFailed: string;
}

export interface RenderLoginSectionOptions {
  meta: LoginSectionMeta;
  templateShell: string | null;
  clientI18n: LoginClientI18n;
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

export function renderLoginSectionHtml(options: RenderLoginSectionOptions): string {
  const { meta, templateShell, clientI18n } = options;
  if (!templateShell) return '';

  let html = expandConditionalBlocks(templateShell, {
    LOGIN_HAS_HEADER: Boolean(meta.title || meta.subtitle),
    LOGIN_HAS_TITLE: Boolean(meta.title),
    LOGIN_HAS_SUBTITLE: Boolean(meta.subtitle),
  });

  return applyTemplate(html, {
    LOGIN_TITLE: escapeHtml(meta.title),
    LOGIN_SUBTITLE: escapeHtml(meta.subtitle),
    LOGIN_IDENTIFIER_LABEL: escapeHtml(meta.identifierLabel),
    LOGIN_PASSWORD_LABEL: escapeHtml(meta.passwordLabel),
    LOGIN_SUBMIT_LABEL: escapeHtml(meta.submitLabel),
    LOGIN_REMEMBER_LABEL: escapeHtml(meta.rememberLabel),
    LOGIN_FORGOT_LABEL: escapeHtml(meta.forgotLabel),
    LOGIN_FORGOT_URL: escapeHtml(meta.forgotUrl),
    LOGIN_SIGNUP_PROMPT: escapeHtml(meta.signupPrompt),
    LOGIN_SIGNUP_LINK_TEXT: escapeHtml(meta.signupLinkText),
    LOGIN_SIGNUP_URL: escapeHtml(meta.signupUrl),
    LOGIN_HOME_URL: escapeHtml(meta.homeUrl),
    LOGIN_SUCCESS_URL: escapeHtml(meta.successUrl),
    LOGIN_I18N_JSON: escapeHtmlAttr(JSON.stringify(clientI18n)),
  });
}
