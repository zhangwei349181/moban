/**
 * PostList 客户端引导：派发 ready 事件；按配置决定是否运行平台默认展示层 init
 */

import { initPostListUi } from './postListUi.client';

export interface PostListReadyDetail {
  root: HTMLElement;
  listPath: string;
}

export function getPostListSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-postlist-section]');
}

export function readPostListListPath(): string {
  const slot = document.querySelector('[data-postlist-slot]');
  const fromSlot = slot?.getAttribute('data-list-path')?.trim();
  if (fromSlot) return fromSlot;
  return '/bloglist';
}

export function dispatchPostListReady(): PostListReadyDetail | null {
  const root = getPostListSectionRoot();
  if (!root) return null;

  const detail: PostListReadyDetail = {
    root,
    listPath: readPostListListPath(),
  };

  document.dispatchEvent(new CustomEvent<PostListReadyDetail>('gt6:postlist:ready', { detail }));
  return detail;
}

export interface BootPostListOptions {
  usePlatformUi: boolean;
}

export function bootPostList(options: BootPostListOptions): void {
  const run = () => {
    dispatchPostListReady();
    if (options.usePlatformUi) {
      initPostListUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
