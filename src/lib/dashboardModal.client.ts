/** 简易 modal（不依赖 Bootstrap） */

export function openDashboardModal(root: Document | HTMLElement, modalId: string): void {
  const scope = root instanceof Document ? root : root.ownerDocument || document;
  const modal = scope.querySelector(`[data-dashboard-modal="${modalId}"]`) as HTMLElement | null;
  if (!modal) return;
  modal.classList.remove('dashboard-section__hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('dashboard-modal-open');
}

export function closeDashboardModal(root: Document | HTMLElement, modalId: string): void {
  const scope = root instanceof Document ? root : root.ownerDocument || document;
  const modal = scope.querySelector(`[data-dashboard-modal="${modalId}"]`) as HTMLElement | null;
  if (!modal) return;
  modal.classList.add('dashboard-section__hidden');
  modal.setAttribute('aria-hidden', 'true');
  if (!scope.querySelector('[data-dashboard-modal]:not(.dashboard-section__hidden)')) {
    document.body.classList.remove('dashboard-modal-open');
  }
}

export function bindDashboardModalClose(root: HTMLElement): void {
  if (root.dataset.dashboardModalBound === '1') return;
  root.dataset.dashboardModalBound = '1';

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const closeBtn = target.closest('[data-dashboard-modal-close]') as HTMLElement | null;
    if (!closeBtn) return;
    const modal = closeBtn.closest('[data-dashboard-modal]') as HTMLElement | null;
    if (modal) {
      modal.classList.add('dashboard-section__hidden');
      modal.setAttribute('aria-hidden', 'true');
      if (!root.querySelector('[data-dashboard-modal]:not(.dashboard-section__hidden)')) {
        document.body.classList.remove('dashboard-modal-open');
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    root.querySelectorAll('[data-dashboard-modal]:not(.dashboard-section__hidden)').forEach((modal) => {
      modal.classList.add('dashboard-section__hidden');
      modal.setAttribute('aria-hidden', 'true');
    });
    document.body.classList.remove('dashboard-modal-open');
  });
}
