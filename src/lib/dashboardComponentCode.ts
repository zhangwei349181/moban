/** 会员中心：壳 type=dashboard；子块 type=dashboardpanel，靠壳 HTML 的 {{code}} 嵌套 */

export function isDashboardComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'dashboard';
}

export function isDashboardPanelComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'dashboardpanel';
}

const DASHBOARD_SHELL_CODE_RE = /^dashboard(\d{1,2})?$/;
const LEGACY_DASHBOARD_SHELL_CODES = new Set(['userdashboard', 'accountdashboard']);

const DASHBOARD_PANEL_KIND_RE =
  /^dashboard(nav|profile|editprofile|addresses|password|orders|subscriptionorders|payments|subscriptionpayments|logout)(\d{1,2})?$/;

export type DashboardPanelKind =
  | 'nav'
  | 'profile'
  | 'addresses'
  | 'password'
  | 'orders'
  | 'subscription_orders'
  | 'payments'
  | 'subscription_payments';

const PANEL_KIND_MAP: Record<string, DashboardPanelKind> = {
  nav: 'nav',
  profile: 'profile',
  editprofile: 'profile',
  addresses: 'addresses',
  password: 'password',
  orders: 'orders',
  subscriptionorders: 'subscription_orders',
  payments: 'payments',
  subscriptionpayments: 'subscription_payments',
  logout: 'nav',
};

function withOptionalIndex(match: RegExpExecArray | null): boolean {
  if (!match) return false;
  const digits = match[match.length - 1];
  if (!digits) return true;
  const n = parseInt(digits, 10);
  return n >= 1 && n <= 99;
}

export function isDashboardSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  if (LEGACY_DASHBOARD_SHELL_CODES.has(normalized)) return true;
  return withOptionalIndex(DASHBOARD_SHELL_CODE_RE.exec(normalized));
}

export function resolveDashboardPanelKindFromCode(code: string): DashboardPanelKind | null {
  const normalized = String(code || '').trim().toLowerCase();
  const match = DASHBOARD_PANEL_KIND_RE.exec(normalized);
  if (!match) return null;
  if (!withOptionalIndex(match)) return null;
  return PANEL_KIND_MAP[match[1]] ?? null;
}

export function isDashboardPanelSectionCode(code: string): boolean {
  if (isDashboardSectionCode(code)) return false;
  return resolveDashboardPanelKindFromCode(code) !== null;
}

export function isDashboardScalarPlaceholder(code: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(String(code || '').trim());
}

export function isDashboardNestableCode(code: string): boolean {
  return isDashboardPanelSectionCode(code);
}

export function isDashboardSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isDashboardComponentType(slot.componentType) || isDashboardSectionCode(slot.normalizedCode);
}

export function isDashboardPanelSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return (
    isDashboardPanelComponentType(slot.componentType) ||
    isDashboardPanelSectionCode(slot.normalizedCode)
  );
}
