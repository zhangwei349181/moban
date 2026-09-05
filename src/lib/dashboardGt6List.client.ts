/**
 * Dashboard GT6 列表面板共用逻辑
 */

import { getAuthTenantId } from './auth';
import { clientTranslations } from './translations';
import { openDashboardModal } from './dashboardModal.client';
import { getDashboardRoot } from './dashboardPanelUtils.client';

export interface DashboardListPanelConfig<T> {
  panelId: string;
  pageSize?: number;
  loadPage: (page: number, pageSize: number) => Promise<{ items: { id: string }[]; pagination: { page: number; total_pages: number } }>;
  fetchDetail: (tenantId: string, id: string) => Promise<Record<string, unknown>>;
  mapRow: (json: Record<string, unknown>) => T;
  renderTableRow: (row: T) => string;
  renderCard: (row: T) => string;
  renderDetail: (row: T) => string;
  modalId: string;
  loadErrorKey: string;
}

export function initDashboardGt6ListPanel<T extends { id: string }>(config: DashboardListPanelConfig<T>): void {
  const PAGE_SIZE = config.pageSize ?? 20;
  let currentPage = 1;
  let totalPages = 1;
  let rows: T[] = [];
  let loading = false;
  let bound = false;

  const onActivate = (root: HTMLElement) => {
    if (bound) {
      void loadPage(root, currentPage);
      return;
    }
    bound = true;
    bind(root);
    void loadPage(root, 1);
  };

  document.addEventListener('gt6:dashboard:panel-activate', (e) => {
    const detail = (e as CustomEvent).detail as { panelId?: string };
    if (detail?.panelId !== config.panelId) return;
    const root = document.querySelector(
      `[data-dashboard-section] [data-dashboard-content-panel="${config.panelId}"]`
    ) as HTMLElement | null;
    if (root) onActivate(root);
  });

  const standalone = document.querySelector(`[data-dashboard-panel-root="${config.panelId}"]`) as HTMLElement | null;
  if (standalone) onActivate(standalone);

  const activePanel = document.querySelector(
    `[data-dashboard-section] [data-dashboard-content-panel="${config.panelId}"].dashboard-content-panel--active`
  ) as HTMLElement | null;
  if (activePanel) onActivate(activePanel);

  function bind(root: HTMLElement) {
    root.querySelector('[data-dashboard-prev]')?.addEventListener('click', () => {
      if (currentPage <= 1 || loading) return;
      void loadPage(root, currentPage - 1);
    });
    root.querySelector('[data-dashboard-next]')?.addEventListener('click', () => {
      if (currentPage >= totalPages || loading) return;
      void loadPage(root, currentPage + 1);
    });
  }

  function setVisible(el: HTMLElement | null, show: boolean) {
    el?.classList.toggle('dashboard-section__hidden', !show);
  }

  function updatePagination(root: HTMLElement) {
    const pag = root.querySelector('[data-dashboard-pagination]') as HTMLElement | null;
    const info = root.querySelector('[data-dashboard-page-info]');
    const prev = root.querySelector('[data-dashboard-prev]') as HTMLButtonElement | null;
    const next = root.querySelector('[data-dashboard-next]') as HTMLButtonElement | null;
    const show = totalPages > 1;
    setVisible(pag, show);
    if (info) info.textContent = `Page ${currentPage} / ${totalPages}`;
    if (prev) prev.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= totalPages;
  }

  function bindViewButtons(root: HTMLElement) {
    root.querySelectorAll('[data-dashboard-view-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.dashboardViewId;
        if (id) void showDetail(root, id);
      });
    });
  }

  async function loadPage(root: HTMLElement, page: number) {
    if (loading) return;
    loading = true;

    const loadingEl = root.querySelector('[data-dashboard-loading]') as HTMLElement | null;
    const errorEl = root.querySelector('[data-dashboard-error]') as HTMLElement | null;
    const emptyEl = root.querySelector('[data-dashboard-empty]') as HTMLElement | null;
    const tableEl = root.querySelector('[data-dashboard-table]') as HTMLElement | null;
    const tbodyEl = root.querySelector('[data-dashboard-tbody]') as HTMLElement | null;
    const cardsEl = root.querySelector('[data-dashboard-cards]') as HTMLElement | null;

    setVisible(loadingEl, true);
    setVisible(errorEl, false);
    setVisible(emptyEl, false);
    setVisible(tableEl, false);
    setVisible(cardsEl, false);
    setVisible(root.querySelector('[data-dashboard-pagination]'), false);

    const tenantId = getAuthTenantId();
    if (!tenantId) {
      setVisible(loadingEl, false);
      if (errorEl) {
        errorEl.textContent = clientTranslations.get('please_login_first');
        setVisible(errorEl, true);
      }
      loading = false;
      return;
    }

    try {
      const data = await config.loadPage(page, PAGE_SIZE);
      currentPage = data.pagination.page;
      totalPages = Math.max(1, data.pagination.total_pages);

      if (!data.items.length) {
        setVisible(loadingEl, false);
        setVisible(emptyEl, true);
        updatePagination(root);
        loading = false;
        return;
      }

      const mapped = await Promise.all(
        data.items.map(async (item) => {
          try {
            const j = await config.fetchDetail(tenantId, item.id);
            return config.mapRow(j);
          } catch {
            return null;
          }
        })
      );

      rows = mapped.filter((r): r is T => r != null);
      if (!rows.length) {
        setVisible(loadingEl, false);
        setVisible(emptyEl, true);
        updatePagination(root);
        loading = false;
        return;
      }

      if (tbodyEl) {
        tbodyEl.innerHTML = rows.map(config.renderTableRow).join('');
      }
      if (cardsEl) {
        cardsEl.innerHTML = rows.map(config.renderCard).join('');
      }

      bindViewButtons(root);
      setVisible(loadingEl, false);
      setVisible(tableEl, true);
      setVisible(cardsEl, true);
      updatePagination(root);
    } catch (err) {
      setVisible(loadingEl, false);
      if (errorEl) {
        errorEl.textContent =
          err instanceof Error ? err.message : clientTranslations.get(config.loadErrorKey as any);
        setVisible(errorEl, true);
      }
    } finally {
      loading = false;
    }
  }

  async function showDetail(root: HTMLElement, id: string) {
    let row = rows.find((r) => r.id === id);
    const tenantId = getAuthTenantId();
    if (!row && tenantId) {
      try {
        const j = await config.fetchDetail(tenantId, id);
        row = config.mapRow(j);
      } catch {
        /* ignore */
      }
    }
    if (!row) return;

    const modal =
      root.querySelector(`[data-dashboard-modal="${config.modalId}"]`) ||
      getDashboardRoot()?.querySelector(`[data-dashboard-modal="${config.modalId}"]`);
    if (!(modal instanceof HTMLElement)) return;

    const content = modal.querySelector('[data-dashboard-detail-content]') as HTMLElement | null;
    if (content) content.innerHTML = config.renderDetail(row);

    const sectionRoot = (root.closest('[data-dashboard-section]') || document.body) as HTMLElement;
    openDashboardModal(sectionRoot, config.modalId);
  }
}

export function formatDashboardDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export function statusClass(status: string): string {
  const s = (status || '').toLowerCase();
  if (['delivered', 'completed', 'paid', 'succeeded', 'active'].includes(s)) return 'dashboard-status--success';
  if (['cancelled', 'failed', 'refunded'].includes(s)) return 'dashboard-status--danger';
  if (['pending'].includes(s)) return 'dashboard-status--warning';
  return 'dashboard-status--info';
}
