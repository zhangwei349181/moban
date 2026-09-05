/**
 * Wishlist 页面动态组件 — 客户端渲染与交互（逻辑参考 newworld wishlist.astro）
 */

import { clientArticleSearch } from './articleSearch';
import { clientTranslations } from './translations';
import { formatProductPriceDisplay } from './globalDiscountPrice';
import { buildDetailPagePath } from './detailPageRoute';
import { getWishlist, isInWishlist, toggleWishlist } from './wishlist';

export interface WishlistSectionConfig {
  continueShoppingUrl: string;
  productPageCode: string;
}

function getSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-wishlist-section]');
}

function parseWishlistConfig(root: HTMLElement): WishlistSectionConfig {
  const defaults: WishlistSectionConfig = {
    continueShoppingUrl: '/product',
    productPageCode: 'productsingle',
  };
  const raw = root.dataset.wishlistConfig;
  if (!raw) return defaults;
  try {
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function getGlobalConfig() {
  const win = window as any;
  return {
    tenantId: win.__ASTRO_TENANT_ID__ || '',
    locale: win.__ASTRO_LOCALE__ || 'zh-CN',
    currentCurrency: win.__ASTRO_CURRENT_CURRENCY__ || null,
    exchangeRate: win.__ASTRO_EXCHANGE_RATE__ || 1,
  };
}

function convertToCurrentCurrency(amountInBase: number, exchangeRate: number): number {
  return amountInBase * exchangeRate;
}

function formatPrice(amount: number, currencyCode?: string): string {
  const config = getGlobalConfig();
  const currency = config.currentCurrency?.code || currencyCode || 'USD';
  return new Intl.NumberFormat(config.locale.replace('_', '-'), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getValidThumbnailUrls(templateFields: Record<string, unknown>): string[] {
  const raw = templateFields?.thumbnails ?? templateFields?.['Showcase Gallery'];
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => {
    return (
      typeof u === 'string' &&
      u.length > 3 &&
      (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
    );
  });
}

function buildProductUrl(config: WishlistSectionConfig, articleId: string): string {
  return buildDetailPagePath(config.productPageCode, articleId) || `/${config.productPageCode}-${articleId}`;
}

function renderProductCard(product: any, config: WishlistSectionConfig): string {
  const globalConfig = getGlobalConfig();
  const articleData = product.data;
  const templateFields = (articleData.metadata?.template_fields || {}) as Record<string, unknown>;
  const thumbnails = getValidThumbnailUrls(templateFields);
  const priceInBase = parseFloat(String(templateFields.price || '0'));
  const priceInCurrent = convertToCurrentCurrency(priceInBase, globalConfig.exchangeRate);
  const formattedPrice = formatProductPriceDisplay(
    priceInCurrent,
    globalConfig.tenantId,
    formatPrice,
    clientTranslations.get('price_login_to_view')
  );

  const publishStatus = articleData.publish_status || 'draft';
  const statusText =
    publishStatus === 'recommended' || publishStatus === 'featured'
      ? clientTranslations.get('new_arrival')
      : '';

  const mainImage = thumbnails[0] || '';
  const productId = articleData.article_id;
  const productUrl = buildProductUrl(config, productId);
  const title = String(articleData.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const wishlistActiveClass = isInWishlist(productId) ? ' wishlist-section__wishlist--active' : '';

  return `
    <div class="wishlist-section__col">
      <div class="wishlist-section__card">
        <div class="wishlist-section__card-image">
          <a href="${productUrl}">
            <img src="${mainImage}" alt="${title}" loading="lazy" />
          </a>
          <ul class="wishlist-section__card-actions">
            <li>
              <a href="${productUrl}" class="wishlist-section__action" aria-label="View">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </a>
            </li>
            <li>
              <a href="javascript:void(0)" class="wishlist-section__action wishlist-section__wishlist${wishlistActiveClass}" data-product-id="${productId}" data-action="toggle-wishlist" aria-label="Wishlist">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </a>
            </li>
          </ul>
        </div>
        <div class="wishlist-section__card-body">
          ${statusText ? `<span class="wishlist-section__tag">${statusText}</span>` : ''}
          <a href="${productUrl}"><h3 class="wishlist-section__card-title">${title}</h3></a>
          <p class="wishlist-section__card-price">${formattedPrice}</p>
        </div>
      </div>
    </div>
  `;
}

let currentView: 'grid' | 'list' = 'grid';
let productsData: any[] = [];
let wishlistEventsBound = false;

function updateWishlistCount(count: number) {
  const countEl = document.querySelector('[data-wishlist-product-count]') as HTMLElement | null;
  if (!countEl) return;
  const productsText = clientTranslations.get('products');
  countEl.textContent = `${count} ${productsText}`;
}

function renderProducts(products: any[], view: 'grid' | 'list', config: WishlistSectionConfig) {
  const root = getSectionRoot();
  if (!root) return;

  const gridRow = root.querySelector('[data-wishlist-grid-row]') as HTMLElement | null;
  const listRow = root.querySelector('[data-wishlist-list-row]') as HTMLElement | null;
  const gridContent = root.querySelector('[data-wishlist-grid-content]') as HTMLElement | null;
  const listContent = root.querySelector('[data-wishlist-list-content]') as HTMLElement | null;
  const loadingEl = root.querySelector('[data-wishlist-loading]') as HTMLElement | null;
  const emptyEl = root.querySelector('[data-wishlist-empty]') as HTMLElement | null;
  const errorEl = root.querySelector('[data-wishlist-error]') as HTMLElement | null;
  const wrapperEl = root.querySelector('[data-wishlist-wrapper]') as HTMLElement | null;

  loadingEl?.classList.add('wishlist-section__hidden');
  emptyEl?.classList.add('wishlist-section__hidden');
  errorEl?.classList.add('wishlist-section__hidden');
  gridContent?.classList.add('wishlist-section__hidden');
  listContent?.classList.add('wishlist-section__hidden');

  updateWishlistCount(products.length);

  if (products.length === 0) {
    if (gridRow) gridRow.innerHTML = '';
    if (listRow) listRow.innerHTML = '';
    emptyEl?.classList.remove('wishlist-section__hidden');
    wrapperEl?.classList.add('wishlist-section__hidden');
    return;
  }

  wrapperEl?.classList.remove('wishlist-section__hidden');

  const html = products.map((p) => renderProductCard(p, config)).join('');

  if (view === 'grid') {
    gridContent?.classList.remove('wishlist-section__hidden');
    if (gridRow) gridRow.innerHTML = html;
  } else {
    listContent?.classList.remove('wishlist-section__hidden');
    if (listRow) listRow.innerHTML = html;
  }
}

function bindWishlistEvents(config: WishlistSectionConfig) {
  if (wishlistEventsBound) return;
  wishlistEventsBound = true;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const wishlistLink = target.closest('[data-action="toggle-wishlist"]') as HTMLElement | null;
    if (!wishlistLink) return;

    const root = getSectionRoot();
    if (!root || !root.contains(wishlistLink)) return;

    e.preventDefault();
    e.stopPropagation();

    const productId = wishlistLink.dataset.productId;
    if (!productId) return;

    toggleWishlist(productId);

    if (isInWishlist(productId)) {
      wishlistLink.classList.add('wishlist-section__wishlist--active');
    } else {
      wishlistLink.classList.remove('wishlist-section__wishlist--active');
      void loadWishlistProducts(config);
    }

    if (typeof (window as any).renderFooterWishlist === 'function') {
      (window as any).renderFooterWishlist();
    }
  });
}

async function loadWishlistProducts(config: WishlistSectionConfig) {
  const root = getSectionRoot();
  if (!root) return;

  const globalConfig = getGlobalConfig();
  const loadingEl = root.querySelector('[data-wishlist-loading]') as HTMLElement | null;
  const emptyEl = root.querySelector('[data-wishlist-empty]') as HTMLElement | null;
  const errorEl = root.querySelector('[data-wishlist-error]') as HTMLElement | null;
  const gridContent = root.querySelector('[data-wishlist-grid-content]') as HTMLElement | null;
  const listContent = root.querySelector('[data-wishlist-list-content]') as HTMLElement | null;
  const wrapperEl = root.querySelector('[data-wishlist-wrapper]') as HTMLElement | null;

  loadingEl?.classList.remove('wishlist-section__hidden');
  emptyEl?.classList.add('wishlist-section__hidden');
  errorEl?.classList.add('wishlist-section__hidden');
  gridContent?.classList.add('wishlist-section__hidden');
  listContent?.classList.add('wishlist-section__hidden');
  wrapperEl?.classList.add('wishlist-section__hidden');

  try {
    const productIds = getWishlist();

    if (!productIds.length) {
      productsData = [];
      renderProducts([], currentView, config);
      return;
    }

    const productContents = await clientArticleSearch.fetchArticlesSimpleContent(
      productIds,
      globalConfig.locale,
      globalConfig.tenantId
    );

    const wishlistIds = getWishlist();
    productsData = productContents.filter((product: any) =>
      wishlistIds.includes(product.data?.article_id)
    );

    renderProducts(productsData, currentView, config);
  } catch (error) {
    console.error('[wishlist] load failed', error);
    if (errorEl) {
      errorEl.textContent = clientTranslations.get('error_loading_products');
      errorEl.classList.remove('wishlist-section__hidden');
    }
  } finally {
    loadingEl?.classList.add('wishlist-section__hidden');
  }
}

function handleViewToggle(view: 'grid' | 'list', config: WishlistSectionConfig) {
  currentView = view;
  const root = getSectionRoot();
  if (!root) return;

  const gridBtn = root.querySelector('[data-wishlist-grid-btn]') as HTMLElement | null;
  const listBtn = root.querySelector('[data-wishlist-list-btn]') as HTMLElement | null;
  const wrapper = root.querySelector('[data-wishlist-wrapper]') as HTMLElement | null;

  if (view === 'grid') {
    gridBtn?.classList.add('wishlist-section__view-btn--active');
    listBtn?.classList.remove('wishlist-section__view-btn--active');
    wrapper?.classList.remove('wishlist-section__wrapper--list');
    wrapper?.classList.add('wishlist-section__wrapper--grid');
  } else {
    gridBtn?.classList.remove('wishlist-section__view-btn--active');
    listBtn?.classList.add('wishlist-section__view-btn--active');
    wrapper?.classList.remove('wishlist-section__wrapper--grid');
    wrapper?.classList.add('wishlist-section__wrapper--list');
  }

  renderProducts(productsData, currentView, config);
}

function setupViewToggle(config: WishlistSectionConfig) {
  const root = getSectionRoot();
  if (!root || root.dataset.wishlistViewBound === '1') return;
  root.dataset.wishlistViewBound = '1';

  root.querySelector('[data-wishlist-grid-btn]')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleViewToggle('grid', config);
  });
  root.querySelector('[data-wishlist-list-btn]')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleViewToggle('list', config);
  });
}

export async function initWishlistUi(): Promise<void> {
  const root = getSectionRoot();
  if (!root) return;

  const config = parseWishlistConfig(root);
  setupViewToggle(config);
  bindWishlistEvents(config);
  await loadWishlistProducts(config);
}

if (typeof document !== 'undefined') {
  (window as any).initWishlistUi = initWishlistUi;
}
