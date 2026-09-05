/** Dashboard 面板共用工具 */

export function getDashboardRoot(): HTMLElement | null {
  return document.querySelector('[data-dashboard-section]');
}

export function getPanelRoot(panelId: string): HTMLElement | null {
  const inDashboard = document.querySelector(
    `[data-dashboard-section] [data-dashboard-content-panel="${panelId}"]`
  ) as HTMLElement | null;
  if (inDashboard) return inDashboard;
  return document.querySelector(`[data-dashboard-panel-root="${panelId}"]`) as HTMLElement | null;
}

export function isPanelActive(panelId: string): boolean {
  const root = getPanelRoot(panelId);
  if (!root) return false;
  if (root.hasAttribute('data-dashboard-panel-root')) return true;
  return root.classList.contains('dashboard-content-panel--active');
}

export function onPanelActivate(panelId: string, cb: (root: HTMLElement) => void): void {
  const tryRun = () => {
    const root = getPanelRoot(panelId);
    if (root && isPanelActive(panelId)) cb(root);
  };

  document.addEventListener('gt6:dashboard:panel-activate', (e) => {
    const detail = (e as CustomEvent).detail as { panelId?: string };
    if (detail?.panelId === panelId) tryRun();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryRun, { once: true });
  } else {
    tryRun();
  }
}

export function showEl(el: HTMLElement | null) {
  el?.classList.remove('dashboard-section__hidden');
}

export function hideEl(el: HTMLElement | null) {
  el?.classList.add('dashboard-section__hidden');
}

export function setText(el: HTMLElement | null, text: string) {
  if (el) el.textContent = text;
}
