/**
 * PostSingle 客户端引导：派发 ready 事件；按配置决定是否运行平台默认展示层 init
 */

import { initPostSingleUi } from './postSingleUi.client';

export interface PostSingleReadyDetail {
  root: HTMLElement;
  articleId: string;
}

export function getPostSingleSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-postsingle-section]');
}

export function readPostSingleArticleId(): string {
  const slot = document.querySelector('[data-postsingle-slot]');
  const fromSlot = slot?.getAttribute('data-article-id')?.trim();
  if (fromSlot) return fromSlot;
  return getPostSingleSectionRoot()?.getAttribute('data-article-id')?.trim() || '';
}

export function dispatchPostSingleReady(): PostSingleReadyDetail | null {
  const root = getPostSingleSectionRoot();
  if (!root) return null;

  const detail: PostSingleReadyDetail = {
    root,
    articleId: readPostSingleArticleId(),
  };

  document.dispatchEvent(new CustomEvent<PostSingleReadyDetail>('gt6:postsingle:ready', { detail }));
  return detail;
}

export interface BootPostSingleOptions {
  /** 是否运行平台内置展示层 init */
  usePlatformUi: boolean;
}

export function bootPostSingle(options: BootPostSingleOptions): void {
  const run = () => {
    dispatchPostSingleReady();
    if (options.usePlatformUi) {
      initPostSingleUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}
