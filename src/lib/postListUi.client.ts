/**
 * PostList 模板 UI：筛选 pill 横向滚动、列表卡片悬停增强
 */

function getSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-postlist-section]');
}

function initFilterNavScroll(root: HTMLElement): void {
  const nav = root.querySelector<HTMLElement>('[data-postlist-filter-nav], nav[aria-label="Filter"]');
  if (!nav || nav.dataset.postlistFilterNavBound === '1') return;

  nav.dataset.postlistFilterNavBound = '1';
  nav.classList.add('postlist-filter-nav--enhanced');

  const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
  if (active) {
    active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
  }
}

function initListCardHover(root: HTMLElement): void {
  const cards = root.querySelectorAll<HTMLElement>('[data-postlist-card], .postlist-card');
  cards.forEach((card) => {
    if (card.dataset.postlistCardBound === '1') return;
    card.dataset.postlistCardBound = '1';
    card.classList.add('postlist-card--enhanced');
  });
}

export function initPostListUi(): void {
  const root = getSectionRoot();
  if (!root) return;

  initFilterNavScroll(root);
  initListCardHover(root);
}

if (typeof document !== 'undefined') {
  (window as any).initPostListUi = initPostListUi;
}
