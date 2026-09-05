/**
 * 邮箱 OTP：/mailbox/verification/email/send|confirm
 */

import { APP_CONFIG } from '../config/app';

export type EmailVerificationPurpose = 'register_email' | 'login_email';

export interface SendEmailCodeResult {
  message: string;
  expires_in_seconds: number;
  cooldown_seconds: number;
  daily_limit: number;
}

export interface ConfirmEmailCodeResult {
  message: string;
  purpose: EmailVerificationPurpose;
  email_verified?: boolean;
}

interface EmailApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

function emailApiUrl(path: string): string {
  const base = APP_CONFIG.emailApiBaseUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function resolveTenantId(tenantId?: string): string {
  if (tenantId) return tenantId;
  if (typeof window !== 'undefined') {
    const fromWin = (window as any).__ASTRO_TENANT_ID__;
    if (fromWin) return String(fromWin);
  }
  return APP_CONFIG.tenantId;
}

function parseEmailApiError(json: EmailApiResponse<unknown>, status: number): Error {
  const msg = json?.message || `请求失败 (${status})`;
  const err = new Error(msg) as Error & { code?: number; retryAfterSeconds?: number };
  err.code = json?.code ?? status;
  const retry = (json?.data as { retry_after_seconds?: number } | undefined)?.retry_after_seconds;
  if (typeof retry === 'number' && retry > 0) {
    err.retryAfterSeconds = retry;
  }
  return err;
}

export async function sendRegisterEmailCode(
  email: string,
  tenantId?: string,
  purpose: EmailVerificationPurpose = 'register_email'
): Promise<SendEmailCodeResult> {
  const tid = resolveTenantId(tenantId);
  const res = await fetch(emailApiUrl('/mailbox/verification/email/send'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tid,
    },
    body: JSON.stringify({
      email: email.trim(),
      purpose,
    }),
  });

  let json: EmailApiResponse<SendEmailCodeResult> = { code: res.status, message: '' };
  try {
    json = (await res.json()) as EmailApiResponse<SendEmailCodeResult>;
  } catch {
    throw new Error('服务器响应无效');
  }

  if (!res.ok || json.code !== 0) {
    throw parseEmailApiError(json, res.status);
  }

  return (
    json.data ?? {
      message: 'sent',
      expires_in_seconds: 900,
      cooldown_seconds: 60,
      daily_limit: 10,
    }
  );
}

export async function confirmRegisterEmailCode(
  email: string,
  code: string,
  tenantId?: string,
  purpose: EmailVerificationPurpose = 'register_email'
): Promise<ConfirmEmailCodeResult> {
  const tid = resolveTenantId(tenantId);
  const res = await fetch(emailApiUrl('/mailbox/verification/email/confirm'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tid,
    },
    body: JSON.stringify({
      email: email.trim(),
      code: code.trim(),
      purpose,
    }),
  });

  let json: EmailApiResponse<ConfirmEmailCodeResult> = { code: res.status, message: '' };
  try {
    json = (await res.json()) as EmailApiResponse<ConfirmEmailCodeResult>;
  } catch {
    throw new Error('服务器响应无效');
  }

  if (!res.ok || json.code !== 0) {
    throw parseEmailApiError(json, res.status);
  }

  return json.data ?? { message: 'ok', purpose, email_verified: true };
}
