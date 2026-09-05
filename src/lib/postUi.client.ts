/**
 * Post 模板 UI：Tab 切换、多组轮播（可选）
 */

import { initPostSectionTabs } from './postSection.client';

export function initPostGroupsCarousel(root: ParentNode = document): void {
  const scope = root instanceof HTMLElement ? root : document;
  const sections =
    root instanceof HTMLElement && root.matches('[data-post-slot]')
      ? [root]
      : Array.from(scope.querySelectorAll<HTMLElement>('[data-post-slot], [data-post-section]'));

  sections.forEach((section) => {
    const carouselEl = section.querySelector<HTMLElement>('.post-groups-swiper, .post07-groups-swiper');
    if (!carouselEl || typeof (window as any).Swiper === 'undefined') return;
    if (carouselEl.dataset.postGroupsCarouselBound === '1') return;

    const SwiperCtor = (window as any).Swiper;
    const slides = carouselEl.querySelectorAll('.swiper-slide');
    if (slides.length < 2) return;

    carouselEl.dataset.postGroupsCarouselBound = '1';

    if ((carouselEl as any).swiper) {
      (carouselEl as any).swiper.destroy(true, true);
    }

    const paginationEl = section.querySelector<HTMLElement>('.post07-groups-pagination, .post-groups-pagination');
    const labelEl = section.querySelector<HTMLElement>('[data-post07-group-label]');

    const swiper = new SwiperCtor(carouselEl, {
      slidesPerView: 1,
      spaceBetween: 24,
      autoHeight: true,
      navigation: {
        nextEl: section.querySelector('.post07-groups-next, .post-groups-next'),
        prevEl: section.querySelector('.post07-groups-prev, .post-groups-prev'),
      },
      pagination: paginationEl ? { el: paginationEl, clickable: true } : undefined,
      on: {
        init(s: any) {
          updateGroupLabel(s, labelEl);
        },
        slideChange(s: any) {
          updateGroupLabel(s, labelEl);
        },
      },
    });

    updateGroupLabel(swiper, labelEl);
  });
}

function updateGroupLabel(swiper: any, labelEl: HTMLElement | null): void {
  if (!labelEl || !swiper?.slides?.length) return;
  const slide = swiper.slides[swiper.activeIndex] as HTMLElement | undefined;
  const label = slide?.dataset.postGroupLabel || slide?.querySelector('[data-post-group-label]')?.textContent?.trim();
  if (label) labelEl.textContent = label;
}

export function initPostUi(root: ParentNode = document): void {
  initPostSectionTabs(root);
  initPostGroupsCarousel(root);
}

if (typeof document !== 'undefined') {
  (window as any).initPostSectionTabs = initPostSectionTabs;
  (window as any).initPostGroupsCarousel = initPostGroupsCarousel;
  (window as any).initPostUi = initPostUi;
}
