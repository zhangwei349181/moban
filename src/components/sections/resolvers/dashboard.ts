import { pickLocalePair, strMeta } from './_shared';
import { loadComponentsHtmlShell } from './componentsHtml';
import {
  isDashboardPanelSectionCode,
  isDashboardSectionCode,
  resolveDashboardPanelKindFromCode,
  type DashboardPanelKind,
} from '../../../lib/dashboardComponentCode';

export type { DashboardPanelKind };

export interface DashboardSectionMeta {
  loginUrl: string;
  homeUrl: string;
  defaultPanel: string;
}

const FALLBACK = {
  loginUrl: { en: '/login', zh: '/login' },
  homeUrl: { en: '/', zh: '/' },
};

export function resolveDashboardSectionMeta(
  metadata: Record<string, unknown> | undefined,
  locale: string
): DashboardSectionMeta {
  const meta = metadata || {};
  return {
    loginUrl: strMeta(
      meta.login_url ?? meta.loginUrl,
      pickLocalePair(locale, FALLBACK.loginUrl.en, FALLBACK.loginUrl.zh)
    ),
    homeUrl: strMeta(
      meta.home_url ?? meta.homeUrl,
      pickLocalePair(locale, FALLBACK.homeUrl.en, FALLBACK.homeUrl.zh)
    ),
    defaultPanel: strMeta(meta.default_panel ?? meta.defaultPanel, 'addresses'),
  };
}

export async function loadDashboardSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}

/** 与 login/checkout 的 loadXxxSectionTemplate 同义，给壳组件预检用。 */
export async function loadDashboardTemplates(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadDashboardSectionTemplate(metadata, locale, baseUrl);
}

export async function loadDashboardPanelTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}

export function isDashboardMainSectionCode(code: string): boolean {
  return isDashboardSectionCode(code);
}

export { isDashboardPanelSectionCode, resolveDashboardPanelKindFromCode };

/** @deprecated 用 resolveDashboardPanelKindFromCode */
export function resolveDashboardPanelKeyFromCode(
  code: string
): Exclude<DashboardPanelKind, never> | null {
  return resolveDashboardPanelKindFromCode(code);
}
