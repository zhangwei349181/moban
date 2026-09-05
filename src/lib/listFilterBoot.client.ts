/**
 * ListFilter 客户端引导：派发 ready 事件；按配置决定是否运行平台默认展示层 init
 */

import { initListFilterUi } from './listFilterUi.client';

export interface ListFilterReadyDetail {
  root: HTMLElement;
  listPath: string;
}

export function getListFilterSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-listfilter-section]');
}

export function readListFilterListPath(): string {
  const slot = document.querySelector('[data-listfilter-slot]');
  const fromSlot = slot?.getAttribute('data-list-path')?.trim();
  if (fromSlot) return fromSlot;

  const form = getListFilterSectionRoot()?.querySelector<HTMLFormElement>('.listfilter-form');
  const action = form?.getAttribute('action')?.trim();
  if (action) {
    try {
      return new URL(action, window.location.origin).pathname || '/bloglist';
    } catch {
      return action;
    }
  }

  return '/bloglist';
}

export function dispatchListFilterReady(): ListFilterReadyDetail | null {
  const root = getListFilterSectionRoot();
  if (!root) return null;

  const detail: ListFilterReadyDetail = {
    root,
    listPath: readListFilterListPath(),
  };

  document.dispatchEvent(new CustomEvent<ListFilterReadyDetail>('gt6:listfilter:ready', { detail }));
  return detail;
}

export interface BootListFilterOptions {
  usePlatformUi: boolean;
}

export function bootListFilter(options: BootListFilterOptions): void {
  const run = () => {
    dispatchListFilterReady();
    if (options.usePlatformUi) {
      initListFilterUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
