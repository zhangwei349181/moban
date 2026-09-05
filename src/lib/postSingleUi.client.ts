/**
 * PostSingle 模板 UI：可选 Swiper 图集、Tab 切换（自定义模板含对应 DOM 时生效）
 */

function getSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-postsingle-section]');
}

export function initPostSingleGallery(): void {
  const root = getSectionRoot();
  if (!root) return;

  const mainEl = root.querySelector<HTMLElement>('.post-single-gallery-main');
  const thumbsEl = root.querySelector<HTMLElement>('.post-single-gallery-thumbs');
  if (!mainEl || typeof (window as any).Swiper === 'undefined') return;

  const SwiperCtor = (window as any).Swiper;
  const slides = mainEl.querySelectorAll('.swiper-slide');
  if (!slides.length) return;

  const existingMain = (mainEl as any).swiper;
  if (existingMain) existingMain.destroy(true, true);
  const existingThumbs = thumbsEl ? (thumbsEl as any).swiper : null;
  if (existingThumbs) existingThumbs.destroy(true, true);

  let thumbsSwiper: any = null;
  if (thumbsEl && thumbsEl.querySelectorAll('.swiper-slide').length > 1) {
    thumbsSwiper = new SwiperCtor(thumbsEl, {
      slidesPerView: 4,
      spaceBetween: 8,
      watchSlidesProgress: true,
    });
  }

  new SwiperCtor(mainEl, {
    slidesPerView: 1,
    effect: slides.length > 1 ? 'fade' : 'slide',
    fadeEffect: { crossFade: true },
    navigation: {
      nextEl: root.querySelector('.post-single-gallery-next'),
      prevEl: root.querySelector('.post-single-gallery-prev'),
    },
    thumbs: thumbsSwiper ? { swiper: thumbsSwiper } : undefined,
  });
}

export function initPostSingleTabs(): void {
  const root = getSectionRoot();
  if (!root) return;

  const tablist = root.querySelector<HTMLElement>('[data-post-single-tabs]');
  if (!tablist) return;

  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[data-post-tab]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-post-tab-panel]'));
  if (!tabs.length || !panels.length) return;

  const activate = (key: string) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.postTab === key;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.classList.toggle('post-single-tab--active', active);
    });
    panels.forEach((panel) => {
      const active = panel.dataset.postTabPanel === key;
      panel.hidden = !active;
      panel.classList.toggle('post-single-tab-panel--active', active);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.postTab;
      if (key) activate(key);
    });
  });

  const initial = tabs.find((t) => t.classList.contains('post-single-tab--active'));
  activate(initial?.dataset.postTab || tabs[0]?.dataset.postTab || '');
}

export function initPostSingleUi(): void {
  initPostSingleGallery();
  initPostSingleTabs();
}

if (typeof document !== 'undefined') {
  (window as any).initPostSingleGallery = initPostSingleGallery;
  (window as any).initPostSingleTabs = initPostSingleTabs;
  (window as any).initPostSingleUi = initPostSingleUi;
}
