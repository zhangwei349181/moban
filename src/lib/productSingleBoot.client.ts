/**
 * ProductSingle 客户端引导：派发 ready 事件；按配置决定是否运行平台默认展示层 init
 */

import { initProductSingleUi } from './productSingleUi.client';

export interface ProductSingleReadyDetail {
  root: HTMLElement;
  articleId: string;
  payload: unknown | null;
}

export function readProductSingleSsrPayload(): unknown | null {
  const el = document.getElementById('product-single-ssr-payload');
  if (!el?.textContent?.trim()) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

export function getProductSingleSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-productsingle-section][data-article-id]');
}

export function dispatchProductSingleReady(): ProductSingleReadyDetail | null {
  const root = getProductSingleSectionRoot();
  if (!root) return null;

  const articleId = root.getAttribute('data-article-id')?.trim() || '';
  const detail: ProductSingleReadyDetail = {
    root,
    articleId,
    payload: readProductSingleSsrPayload(),
  };

  document.dispatchEvent(
    new CustomEvent<ProductSingleReadyDetail>('gt6:productsingle:ready', { detail })
  );
  return detail;
}

export interface BootProductSingleOptions {
  /** 是否运行平台内置展示层 init（图集 Swiper、Tab 等） */
  usePlatformUi: boolean;
}

export function bootProductSingle(options: BootProductSingleOptions): void {
  const run = () => {
    dispatchProductSingleReady();
    if (options.usePlatformUi) {
      initProductSingleUi();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
  document.addEventListener('productsingle:gallery-updated', () => {
    if (options.usePlatformUi && typeof (window as any).initProductSingleGallery === 'function') {
      (window as any).initProductSingleGallery();
    }
    document.dispatchEvent(new CustomEvent('gt6:productsingle:gallery-updated'));
  });
}
