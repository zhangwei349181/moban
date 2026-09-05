/**
 * ProductSingle 模板 UI：图集（无 Swiper 时用原生切换）、描述/附加信息 Tab
 */

function getSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-productsingle-section][data-article-id]');
}

type GalleryHost = HTMLElement & { _gt6GalleryAbort?: AbortController };

function setActiveSlide(slides: HTMLElement[], thumbs: HTMLElement[], index: number): void {
  const len = slides.length;
  if (!len) return;
  const current = ((index % len) + len) % len;
  slides.forEach((slide, i) => {
    const on = i === current;
    slide.classList.toggle('is-active', on);
    slide.classList.toggle('swiper-slide-active', on);
  });
  thumbs.forEach((thumb, i) => {
    const on = i === current;
    thumb.classList.toggle('is-active', on);
    thumb.classList.toggle('swiper-slide-thumb-active', on);
  });
}

function initVanillaGallery(
  gallery: GalleryHost,
  mainEl: HTMLElement,
  thumbsEl: HTMLElement | null
): void {
  gallery._gt6GalleryAbort?.abort();
  const ac = new AbortController();
  gallery._gt6GalleryAbort = ac;
  const { signal } = ac;

  const slides = Array.from(
    mainEl.querySelectorAll<HTMLElement>('.swiper-wrapper > .swiper-slide')
  );
  const thumbs = thumbsEl
    ? Array.from(thumbsEl.querySelectorAll<HTMLElement>('.swiper-slide'))
    : [];
  if (!slides.length) return;

  let index = slides.findIndex(
    (slide) =>
      slide.classList.contains('is-active') || slide.classList.contains('swiper-slide-active')
  );
  if (index < 0) index = 0;

  const show = (next: number) => {
    index = ((next % slides.length) + slides.length) % slides.length;
    setActiveSlide(slides, thumbs, index);
  };

  gallery
    .querySelector('.product-single-gallery-prev')
    ?.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        show(index - 1);
      },
      { signal }
    );
  gallery
    .querySelector('.product-single-gallery-next')
    ?.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        show(index + 1);
      },
      { signal }
    );
  thumbs.forEach((thumb, i) => {
    thumb.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        show(i);
      },
      { signal }
    );
  });

  show(index);
}

function initSwiperGallery(
  root: HTMLElement,
  mainEl: HTMLElement,
  thumbsEl: HTMLElement | null
): void {
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
      slidesPerView: 'auto',
      spaceBetween: 8,
      watchSlidesProgress: true,
      watchOverflow: true,
      slideToClickedSlide: true,
      observer: true,
      observeParents: true,
    });
  }

  const mainSwiper = new SwiperCtor(mainEl, {
    slidesPerView: 1,
    spaceBetween: 0,
    speed: 400,
    effect: 'slide',
    observer: true,
    observeParents: true,
    watchOverflow: true,
    navigation: {
      nextEl: root.querySelector('.product-single-gallery-next'),
      prevEl: root.querySelector('.product-single-gallery-prev'),
    },
    thumbs: thumbsSwiper ? { swiper: thumbsSwiper } : undefined,
  });

  const refresh = () => {
    try {
      mainSwiper.updateSize();
      mainSwiper.updateSlides();
      mainSwiper.update();
      thumbsSwiper?.update();
    } catch {
      /* ignore */
    }
  };
  requestAnimationFrame(refresh);
  window.setTimeout(refresh, 50);
  window.setTimeout(refresh, 300);
}

export function initProductSingleGallery(): void {
  const root = getSectionRoot();
  if (!root) return;

  const mainEl = root.querySelector<HTMLElement>('.product-single-gallery-main');
  if (!mainEl) return;
  const thumbsEl = root.querySelector<HTMLElement>('.product-single-gallery-thumbs');
  const gallery =
    (mainEl.closest('.product-single-gallery') as GalleryHost | null) || (mainEl as GalleryHost);

  if (typeof (window as any).Swiper !== 'undefined') {
    initSwiperGallery(root, mainEl, thumbsEl);
    return;
  }

  initVanillaGallery(gallery, mainEl, thumbsEl);
}

export function initProductSingleTabs(): void {
  const root = getSectionRoot();
  if (!root) return;

  const tablist = root.querySelector<HTMLElement>('[data-product-single-tabs]');
  if (!tablist) return;

  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[data-product-tab]'));
  const panels = Array.from(
    root.querySelectorAll<HTMLElement>('[data-product-tab-panel]')
  );
  if (!tabs.length || !panels.length) return;

  const activate = (key: string) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.productTab === key;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.classList.toggle('product-single-tab--active', active);
    });
    panels.forEach((panel) => {
      const active = panel.dataset.productTabPanel === key;
      panel.hidden = !active;
      panel.classList.toggle('product-single-tab-panel--active', active);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.productTab;
      if (key) activate(key);
    });
  });

  const initial = tabs.find((t) => t.classList.contains('product-single-tab--active'));
  activate(initial?.dataset.productTab || tabs[0]?.dataset.productTab || 'description');
}

export function initProductSingleUi(): void {
  initProductSingleGallery();
  initProductSingleTabs();
}

if (typeof document !== 'undefined') {
  (window as any).initProductSingleGallery = initProductSingleGallery;
  (window as any).initProductSingleTabs = initProductSingleTabs;
  (window as any).initProductSingleUi = initProductSingleUi;
}
