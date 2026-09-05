/**
 * CMS 静态 HTML 插槽（components01–99）客户端引导：按实例派发 ready
 */

export interface ComponentsHtmlReadyDetail {
  root: HTMLElement;
}

function dispatchReadyForRoot(root: HTMLElement): ComponentsHtmlReadyDetail {
  const detail: ComponentsHtmlReadyDetail = { root };
  document.dispatchEvent(new CustomEvent<ComponentsHtmlReadyDetail>('gt6:componentshtml:ready', { detail }));
  return detail;
}

function bootComponentsHtmlSlot(slot: HTMLElement): void {
  const root =
    slot.matches('[data-components-html-slot]')
      ? slot
      : slot.querySelector<HTMLElement>('[data-components-html-slot]') ?? slot;
  dispatchReadyForRoot(root);
}

function bootAllComponentsHtmlSlots(): void {
  document.querySelectorAll<HTMLElement>('[data-components-html-slot]').forEach(bootComponentsHtmlSlot);
}

let listenersAttached = false;
let bootScheduled = false;

function scheduleBootAll(): void {
  if (bootScheduled) return;
  bootScheduled = true;

  const run = () => {
    bootScheduled = false;
    bootAllComponentsHtmlSlots();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    queueMicrotask(run);
  }
}

/** 页面可挂载多个静态 HTML 插槽；多次调用仅注册一次全局监听 */
export function ensureComponentsHtmlBoot(): void {
  if (!listenersAttached) {
    listenersAttached = true;
    document.addEventListener('astro:page-load', bootAllComponentsHtmlSlots);
  }

  scheduleBootAll();
}
