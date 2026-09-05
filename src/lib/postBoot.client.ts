/**
 * Post 客户端引导：按实例派发 ready；各 slot 独立决定是否运行平台默认展示层 init
 */

import { initPostUi } from './postUi.client';

export interface PostReadyDetail {
  root: HTMLElement;
  groupCount: number;
}

function readGroupCount(root: HTMLElement): number {
  return root.querySelectorAll(
    '[data-post-group-slide], .post07-groups-swiper .swiper-slide, [data-post-panel]'
  ).length;
}

export function getPostSectionRoot(slot: HTMLElement | null): HTMLElement | null {
  if (!slot) return null;
  return slot.matches('[data-post-section]') ? slot : slot.querySelector<HTMLElement>('[data-post-section]') ?? slot;
}

export function dispatchPostReadyForRoot(root: HTMLElement): PostReadyDetail {
  const detail: PostReadyDetail = {
    root,
    groupCount: readGroupCount(root),
  };

  document.dispatchEvent(new CustomEvent<PostReadyDetail>('gt6:post:ready', { detail }));
  return detail;
}

/** @deprecated 仅保留兼容；多实例场景请使用 ensurePostBoot */
export function dispatchPostReady(): PostReadyDetail | null {
  const slot = document.querySelector<HTMLElement>('[data-post-slot]');
  if (!slot) return null;
  const root = getPostSectionRoot(slot);
  if (!root) return null;
  return dispatchPostReadyForRoot(root);
}

function bootPostSlot(slot: HTMLElement): void {
  const root = getPostSectionRoot(slot);
  if (!root) return;

  dispatchPostReadyForRoot(root);

  if (slot.getAttribute('data-use-platform-ui') !== '0') {
    initPostUi(slot);
  }
}

function bootAllPostSections(): void {
  document.querySelectorAll<HTMLElement>('[data-post-slot]').forEach(bootPostSlot);
}

let listenersAttached = false;
let bootScheduled = false;

function scheduleBootAllPostSections(): void {
  if (bootScheduled) return;
  bootScheduled = true;

  const run = () => {
    bootScheduled = false;
    bootAllPostSections();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    queueMicrotask(run);
  }
}

/**
 * 页面可挂载多个 post 组件；多次调用仅注册一次全局监听，并在 DOM 就绪后遍历全部 slot。
 */
export function ensurePostBoot(): void {
  if (!listenersAttached) {
    listenersAttached = true;
    document.addEventListener('astro:page-load', bootAllPostSections);
  }

  scheduleBootAllPostSections();
}

export interface BootPostOptions {
  usePlatformUi: boolean;
}

/** @deprecated 多实例页面请使用 ensurePostBoot */
export function bootPost(options: BootPostOptions): void {
  const run = () => {
    dispatchPostReady();
    if (options.usePlatformUi) {
      initPostUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
