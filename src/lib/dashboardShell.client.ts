/**
 * Dashboard 壳层：登录校验、侧栏、面板切换、登出
 */

import { isAuthenticated, logout, getCurrentMembershipId, getAuthTenantId, getUser, type User } from './auth';
import { clientProduct } from './product';
import { clientTranslations } from './translations';
import { bindDashboardModalClose } from './dashboardModal.client';

export interface DashboardSectionConfig {
  loginUrl: string;
  homeUrl: string;
  defaultPanel: string;
}

function getRoot(): HTMLElement | null {
  return document.querySelector('[data-dashboard-section]');
}

function parseConfig(root: HTMLElement): DashboardSectionConfig {
  const defaults: DashboardSectionConfig = {
    loginUrl: '/login',
    homeUrl: '/',
    defaultPanel: 'addresses',
  };
  const raw = root.dataset.dashboardConfig;
  if (!raw) return defaults;
  try {
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function getInitials(displayName?: string, email?: string): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return displayName.substring(0, 2).toUpperCase();
  }
  if (email?.trim()) return email[0].toUpperCase();
  return 'U';
}

function updateAvatar(el: HTMLElement, avatarUrl?: string, displayName?: string, email?: string) {
  if (avatarUrl?.trim()) {
    const cacheBust = avatarUrl.includes('?') ? '&' : '?';
    el.style.backgroundImage = `url(${avatarUrl}${cacheBust}t=${Date.now()})`;
    el.textContent = '';
    el.classList.add('dashboard-profile__avatar--image');
  } else {
    el.textContent = getInitials(displayName, email);
    el.style.backgroundImage = '';
    el.classList.remove('dashboard-profile__avatar--image');
  }
}

type SidebarUser = Pick<User, 'avatar_url' | 'display_name' | 'email'>;

function applySidebarUser(root: HTMLElement, user: SidebarUser) {
  const avatarEl = root.querySelector('[data-dashboard-user-avatar]') as HTMLElement | null;
  const nameEl = root.querySelector('[data-dashboard-user-name]');
  const emailEl = root.querySelector('[data-dashboard-user-email]');
  if (!avatarEl || !nameEl || !emailEl) return;

  updateAvatar(avatarEl, user.avatar_url, user.display_name, user.email);
  nameEl.textContent = user.display_name || user.email || 'User';
  emailEl.textContent = user.email || '';
}

/** 本地 auth 资料优先（updateProfile 后立即生效），静态 JSON 作补充 */
function mergeSidebarUser(localUser: User | null, remoteUser: SidebarUser | null | undefined): SidebarUser | null {
  if (!localUser && !remoteUser) return null;
  if (!remoteUser) return localUser;
  if (!localUser) return remoteUser;
  return {
    ...remoteUser,
    avatar_url: localUser.avatar_url ?? remoteUser.avatar_url,
    display_name: localUser.display_name || remoteUser.display_name,
    email: localUser.email || remoteUser.email,
  };
}

export function refreshDashboardSidebarProfile(root?: HTMLElement | null, user?: SidebarUser | null) {
  const sectionRoot = root || getRoot();
  if (!sectionRoot) return;

  const resolved = user || mergeSidebarUser(getUser(), null);
  if (resolved) {
    applySidebarUser(sectionRoot, resolved);
  }
}

async function loadSidebarProfile(root: HTMLElement) {
  const avatarEl = root.querySelector('[data-dashboard-user-avatar]') as HTMLElement | null;
  const nameEl = root.querySelector('[data-dashboard-user-name]');
  const emailEl = root.querySelector('[data-dashboard-user-email]');
  if (!avatarEl || !nameEl || !emailEl) return;

  const localUser = getUser();
  if (localUser) {
    applySidebarUser(root, localUser);
  }

  try {
    const membershipId = getCurrentMembershipId();
    const tenantId = getAuthTenantId();
    if (!membershipId || !tenantId) throw new Error('not logged in');

    const profile = await clientProduct.fetchUserProfile(membershipId, tenantId);
    const remoteUser = profile.data?.user;
    const merged = mergeSidebarUser(localUser, remoteUser);
    if (merged) {
      applySidebarUser(root, merged);
      return;
    }
    throw new Error('no user');
  } catch {
    if (localUser) return;
    avatarEl.textContent = 'U';
    nameEl.textContent = clientTranslations.get('please_login_first');
    emailEl.textContent = '';
  }
}

function activatePanel(root: HTMLElement, panelId: string) {
  root.querySelectorAll('[data-dashboard-content-panel]').forEach((panel) => {
    const el = panel as HTMLElement;
    const active = el.dataset.dashboardContentPanel === panelId;
    el.classList.toggle('dashboard-section__hidden', !active);
    el.classList.toggle('dashboard-content-panel--active', active);
  });

  root.querySelectorAll('[data-dashboard-nav-link]').forEach((link) => {
    const el = link as HTMLElement;
    const active = el.dataset.dashboardSection === panelId;
    el.classList.toggle('dashboard-nav__link--active', active);
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  if (location.hash !== `#${panelId}`) {
    history.replaceState(null, '', `#${panelId}`);
  }

  document.dispatchEvent(
    new CustomEvent('gt6:dashboard:panel-activate', { detail: { panelId, root } })
  );
}

function bindNav(root: HTMLElement, config: DashboardSectionConfig) {
  if (root.dataset.dashboardNavBound === '1') return;
  root.dataset.dashboardNavBound = '1';

  root.querySelectorAll('[data-dashboard-nav-link]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const panelId = (link as HTMLElement).dataset.dashboardSection;
      if (!panelId || panelId === 'logout') return;
      activatePanel(root, panelId);
      root.querySelector('[data-dashboard-sidebar]')?.classList.remove('dashboard-sidebar--open');
    });
  });

  const logoutLink = root.querySelector('[data-dashboard-logout]');
  logoutLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    window.location.href = config.homeUrl;
  });

  const openBtn = root.querySelector('[data-dashboard-menu-open]');
  const closeBtn = root.querySelector('[data-dashboard-menu-close]');
  const sidebar = root.querySelector('[data-dashboard-sidebar]');
  openBtn?.addEventListener('click', () => sidebar?.classList.add('dashboard-sidebar--open'));
  closeBtn?.addEventListener('click', () => sidebar?.classList.remove('dashboard-sidebar--open'));

  const avatar = root.querySelector('[data-dashboard-user-avatar]');
  avatar?.addEventListener('click', () => {
    if (typeof (window as any).openDashboardEditProfile === 'function') {
      (window as any).openDashboardEditProfile();
    }
  });
}

export function initDashboardShell(): boolean {
  const root = getRoot();
  if (!root) return false;

  const config = parseConfig(root);
  bindDashboardModalClose(root);

  if (!isAuthenticated()) {
    const params = new URLSearchParams({ return: window.location.pathname + window.location.search });
    window.location.href = `${config.loginUrl}?${params.toString()}`;
    return false;
  }

  bindNav(root, config);
  void loadSidebarProfile(root);

  window.addEventListener('profile-updated', (event) => {
    const detailUser = (event as CustomEvent<{ user?: SidebarUser }>).detail?.user;
    refreshDashboardSidebarProfile(root, detailUser || getUser());
    if (typeof (window as any).updateHeaderLogin === 'function') {
      (window as any).updateHeaderLogin();
    }
  });

  const hash = location.hash.replace(/^#/, '');
  const initial = hash || config.defaultPanel;
  activatePanel(root, initial);

  return true;
}
