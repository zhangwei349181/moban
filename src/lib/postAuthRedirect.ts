/**
 * 登录 / 注册成功后的跳转：租户 metadata.email_verify=true 且未验证邮箱时进验证页。
 */

import { APP_CONFIG } from '../config/app';
import { getUser, isAuthenticated, isEmailVerified } from './auth';
import { isTenantEmailVerifyRequired } from './tenant';

export const VERIFY_EMAIL_PATH = '/verifyemail';

function safeReturnPath(raw: string | null | undefined): string {
  const value = String(raw || '').trim();
  if (!value.startsWith('/')) return '';
  if (value.startsWith('//')) return '';
  if (value.startsWith(VERIFY_EMAIL_PATH)) return '';
  return value;
}

export function buildVerifyEmailUrl(email?: string, returnTo?: string): string {
  const params = new URLSearchParams();
  const mail = String(email || '').trim();
  if (mail) params.set('email', mail);
  const back = safeReturnPath(returnTo);
  if (back) params.set('return', back);
  const query = params.toString();
  return query ? `${VERIFY_EMAIL_PATH}?${query}` : VERIFY_EMAIL_PATH;
}

/**
 * @param fallback 表单 data-success-url 或默认落地页
 */
export async function resolvePostAuthRedirect(fallback: string): Promise<string> {
  const params = new URLSearchParams(window.location.search);
  const dest = safeReturnPath(params.get('return')) || (fallback.startsWith('/') ? fallback : '/');

  if (!isAuthenticated()) return '/login';

  const tenantId =
    (typeof window !== 'undefined' ? String((window as any).__ASTRO_TENANT_ID__ || '') : '') ||
    APP_CONFIG.tenantId;

  if ((await isTenantEmailVerifyRequired(tenantId)) && !isEmailVerified()) {
    return buildVerifyEmailUrl(getUser()?.email || '', dest);
  }

  return dest;
}
