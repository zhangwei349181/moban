/**
 * headerhtml / footerhtml 客户端引导：派发 gt6:chrome:ready，并引导嵌套 data-components-html-slot
 */

import { ensureComponentsHtmlBoot } from './componentsHtmlBoot.client';

export interface ChromeHtmlReadyDetail {
  root: HTMLElement;
  kind: string;
}

function dispatchChromeReady(root: HTMLElement): void {
  const kind = root.getAttribute('data-chrome-kind') || '';
  document.dispatchEvent(
    new CustomEvent<ChromeHtmlReadyDetail>('gt6:chrome:ready', {
      detail: { root, kind },
    })
  );
}

function bootChromeSlot(slot: HTMLElement): void {
  dispatchChromeReady(slot);
}

function bootAllChromeSlots(): void {
  document.querySelectorAll<HTMLElement>('[data-chrome-slot]').forEach(bootChromeSlot);
  ensureComponentsHtmlBoot();
}

let listenersAttached = false;
let bootScheduled = false;

function scheduleBootAll(): void {
  if (bootScheduled) return;
  bootScheduled = true;

  const run = () => {
    bootScheduled = false;
    bootAllChromeSlots();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    queueMicrotask(run);
  }
}

export function ensureChromeHtmlBoot(): void {
  if (!listenersAttached) {
    listenersAttached = true;
    document.addEventListener('astro:page-load', bootAllChromeSlots);
  }

  scheduleBootAll();
}
