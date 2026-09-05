/**
 * verifyemail 组件 HTML 模板注入
 */

import type { VerifyEmailSectionMeta } from '../components/sections/resolvers/verifyemail';

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

export interface RenderVerifyEmailSectionOptions {
  meta: VerifyEmailSectionMeta;
  templateShell: string | null;
  clientI18n: VerifyEmailClientI18n;
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

export function renderVerifyEmailSectionHtml(
  options: RenderVerifyEmailSectionOptions
): string {
  const { meta, templateShell, clientI18n } = options;
  if (!templateShell) return '';

  let html = expandConditionalBlocks(templateShell, {
    VERIFYEMAIL_HAS_HEADER: Boolean(meta.title || meta.subtitle),
    VERIFYEMAIL_HAS_TITLE: Boolean(meta.title),
    VERIFYEMAIL_HAS_SUBTITLE: Boolean(meta.subtitle),
  });

  return applyTemplate(html, {
    VERIFYEMAIL_TITLE: escapeHtml(meta.title),
    VERIFYEMAIL_SUBTITLE: escapeHtml(meta.subtitle),
    VERIFYEMAIL_SENT_TO_LABEL: escapeHtml(meta.sentToLabel),
    VERIFYEMAIL_CODE_LABEL: escapeHtml(meta.codeLabel),
    VERIFYEMAIL_CODE_PLACEHOLDER: escapeHtml(meta.codePlaceholder),
    VERIFYEMAIL_SUBMIT_LABEL: escapeHtml(meta.submitLabel),
    VERIFYEMAIL_RESEND_LABEL: escapeHtml(meta.resendLabel),
    VERIFYEMAIL_HOME_URL: escapeHtml(meta.homeUrl),
    VERIFYEMAIL_LOGIN_URL: escapeHtml(meta.loginUrl),
    VERIFYEMAIL_SIGNUP_URL: escapeHtml(meta.signupUrl),
    VERIFYEMAIL_SUCCESS_URL: escapeHtml(meta.successUrl),
    VERIFYEMAIL_I18N_JSON: escapeHtmlAttr(JSON.stringify(clientI18n)),
  });
}
