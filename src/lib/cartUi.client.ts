/**
 * Cart 页面动态组件 — 客户端渲染与交互（逻辑参考 newworld car.astro）
 */

import { clientCart, type CartItem } from './cart';
import { deleteCartItem, syncLocalCartFromServer } from './cart-api';
import { isAuthenticated } from './auth';
import { clientPricing } from './pricing';
import { clientTranslations } from './translations';
import { buildDetailPagePath } from './detailPageRoute';
import { clientArticleSearch } from './articleSearch';

export interface CartSectionConfig {
  checkoutUrl: string;
  continueShoppingUrl: string;
  productPageCode: string;
}

function getSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-cart-section]');
}

function parseCartConfig(root: HTMLElement): CartSectionConfig {
  const defaults: CartSectionConfig = {
    checkoutUrl: '/checkout',
    continueShoppingUrl: '/',
    productPageCode: 'productsingle',
  };
  const raw = root.dataset.cartConfig;
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
    defaultCurrency: win.__ASTRO_DEFAULT_CURRENCY__ || null,
    exchangeRate: win.__ASTRO_EXCHANGE_RATE__ || 1,
  };
}

function convertToCurrentCurrency(amountInBase: number, exchangeRate: number): number {
  return amountInBase * exchangeRate;
}

function buildProductUrl(config: CartSectionConfig, articleId: string): string {
  return buildDetailPagePath(config.productPageCode, articleId) || `/${config.productPageCode}-${articleId}`;
}

function escapeProductName(value: string): string {
  return String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function resolveProductDisplayName(
  item: CartItem,
  localizedTitles: Map<string, string>
): string {
  const localized = localizedTitles.get(item.article_id)?.trim();
  return escapeProductName(localized || item.product_name || '');
}

async function fetchLocalizedProductTitles(
  items: CartItem[],
  locale: string,
  tenantId: string
): Promise<Map<string, string>> {
  const titleMap = new Map<string, string>();
  const articleIds = [...new Set(items.map((item) => item.article_id).filter(Boolean))];
  if (!articleIds.length || !tenantId) return titleMap;

  try {
    const articles = await clientArticleSearch.fetchArticlesSimpleContent(
      articleIds,
      locale,
      tenantId
    );
    for (const article of articles) {
      const id = article.data?.article_id || article.data?.id;
      const title = article.data?.title?.trim();
      if (id && title) titleMap.set(id, title);
    }
  } catch (error) {
    console.warn('[cart] failed to load localized product titles', error);
  }

  return titleMap;
}

function renderBadges(item: CartItem): string {
  const badges: string[] = [];
  if (item.group_buying_id) {
    badges.push(
      `<span class="cart-section__badge cart-section__badge--primary">${clientTranslations.get('group_buying_label')}</span>`
    );
  }
  if (item.crowdfunding_activity_id) {
    badges.push(
      `<span class="cart-section__badge cart-section__badge--info">${clientTranslations.get('crowdfunding_label')}</span>`
    );
  }
  if (item.discount_rule_ids && item.discount_rule_ids.length > 0) {
    badges.push(
      `<span class="cart-section__badge cart-section__badge--success">${clientTranslations.get('discount_label')}</span>`
    );
  }
  return badges.join('');
}

function renderCartItemDesktop(
  item: CartItem,
  config: CartSectionConfig,
  currencyConfig: ReturnType<typeof getGlobalConfig>,
  localizedTitles: Map<string, string>
) {
  const currency = currencyConfig.currentCurrency || { currency_symbol: '$', decimal_places: 2 };
  const exchangeRate = currencyConfig.exchangeRate || 1;

  const unitPriceInCurrent = convertToCurrentCurrency(item.unit_price, exchangeRate);
  const originalUnitPriceInCurrent = convertToCurrentCurrency(item.original_unit_price, exchangeRate);
  const shippingFeeInCurrent = convertToCurrentCurrency(item.shipping_fee, exchangeRate);
  const taxFeeInCurrent = convertToCurrentCurrency(item.tax_fee, exchangeRate);

  const unitPriceFormatted = clientPricing.formatPrice(unitPriceInCurrent, currency);
  const subtotalFormatted = clientPricing.formatPrice(unitPriceInCurrent * item.quantity, currency);
  const shippingFormatted = clientPricing.formatPrice(shippingFeeInCurrent, currency);
  const taxFormatted = clientPricing.formatPrice(taxFeeInCurrent, currency);

  const originalPriceFormatted =
    item.discount_amount > 0
      ? clientPricing.formatPrice(originalUnitPriceInCurrent, currency)
      : '';

  const badgesHtml = renderBadges(item);
  const productUrl = buildProductUrl(config, item.article_id);
  const productName = resolveProductDisplayName(item, localizedTitles);
  const removeLabel = clientTranslations.get('remove');

  return `
    <tr data-cart-item-id="${item.id}">
      <td class="cart-section__cell cart-section__cell--product">
        <button type="button" class="cart-section__remove" data-cart-item-id="${item.id}" aria-label="${removeLabel}">×</button>
        <div class="cart-section__product">
          <a href="${productUrl}" class="cart-section__product-image">
            <img src="${item.product_image_url}" alt="${productName}" loading="lazy" />
          </a>
          <div class="cart-section__product-detail">
            <a href="${productUrl}" class="cart-section__product-name">${productName}</a>
            ${badgesHtml ? `<div class="cart-section__badges">${badgesHtml}</div>` : ''}
            ${item.product_sku ? `<div class="cart-section__sku">SKU: ${item.product_sku}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="cart-section__cell cart-section__cell--price">
        ${originalPriceFormatted ? `<del class="cart-section__price-old">${originalPriceFormatted}</del>` : ''}
        <span>${unitPriceFormatted}</span>
      </td>
      <td class="cart-section__cell cart-section__cell--qty">${item.quantity}</td>
      <td class="cart-section__cell cart-section__cell--subtotal">${subtotalFormatted}</td>
      <td class="cart-section__cell">${shippingFormatted}</td>
      <td class="cart-section__cell">${taxFormatted}</td>
    </tr>
  `;
}

function renderCartItemMobile(
  item: CartItem,
  config: CartSectionConfig,
  currencyConfig: ReturnType<typeof getGlobalConfig>,
  localizedTitles: Map<string, string>
) {
  const currency = currencyConfig.currentCurrency || { currency_symbol: '$', decimal_places: 2 };
  const exchangeRate = currencyConfig.exchangeRate || 1;

  const unitPriceInCurrent = convertToCurrentCurrency(item.unit_price, exchangeRate);
  const originalUnitPriceInCurrent = convertToCurrentCurrency(item.original_unit_price, exchangeRate);
  const shippingFeeInCurrent = convertToCurrentCurrency(item.shipping_fee, exchangeRate);
  const taxFeeInCurrent = convertToCurrentCurrency(item.tax_fee, exchangeRate);

  const priceFormatted = clientPricing.formatPrice(unitPriceInCurrent, currency);
  const subtotalFormatted = clientPricing.formatPrice(unitPriceInCurrent * item.quantity, currency);
  const shippingFormatted = clientPricing.formatPrice(shippingFeeInCurrent, currency);
  const taxFormatted = clientPricing.formatPrice(taxFeeInCurrent, currency);
  const originalPriceFormatted =
    item.discount_amount > 0
      ? clientPricing.formatPrice(originalUnitPriceInCurrent, currency)
      : '';

  const badgesHtml = renderBadges(item);
  const productUrl = buildProductUrl(config, item.article_id);
  const productName = resolveProductDisplayName(item, localizedTitles);
  const removeLabel = clientTranslations.get('remove');

  return `
    <div class="cart-section__mobile-item" data-cart-item-id="${item.id}">
      <button type="button" class="cart-section__remove" data-cart-item-id="${item.id}" aria-label="${removeLabel}">×</button>
      <div class="cart-section__mobile-inner">
        <a href="${productUrl}" class="cart-section__mobile-image">
          <img src="${item.product_image_url}" alt="${productName}" loading="lazy" />
        </a>
        <div class="cart-section__mobile-body">
          <a href="${productUrl}" class="cart-section__product-name">${productName}</a>
          ${badgesHtml ? `<div class="cart-section__badges">${badgesHtml}</div>` : ''}
          <div class="cart-section__mobile-price">
            ${originalPriceFormatted ? `<del>${originalPriceFormatted}</del>` : ''}
            <span>${priceFormatted}</span>
          </div>
          ${item.product_sku ? `<div class="cart-section__sku">SKU: ${item.product_sku}</div>` : ''}
          <ul class="cart-section__mobile-meta">
            <li>${clientTranslations.get('quantity')}: ${item.quantity}</li>
            <li>${clientTranslations.get('subtotal')}: ${subtotalFormatted}</li>
            <li>${clientTranslations.get('shipping')}: ${shippingFormatted}</li>
            <li>${clientTranslations.get('tax')}: ${taxFormatted}</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function updateCartTotals(items: CartItem[], currencyConfig: ReturnType<typeof getGlobalConfig>) {
  const currency = currencyConfig.currentCurrency || { currency_symbol: '$', decimal_places: 2 };
  const exchangeRate = currencyConfig.exchangeRate || 1;

  const subtotalBase = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const shippingBase = items.reduce((sum, item) => sum + item.shipping_fee, 0);
  const taxBase = items.reduce((sum, item) => sum + item.tax_fee, 0);

  const subtotal = convertToCurrentCurrency(subtotalBase, exchangeRate);
  const shipping = convertToCurrentCurrency(shippingBase, exchangeRate);
  const tax = convertToCurrentCurrency(taxBase, exchangeRate);
  const total = subtotal + shipping + tax;

  const subtotalEl = document.querySelector('[data-cart-subtotal]');
  const shippingEl = document.querySelector('[data-cart-shipping]');
  const taxEl = document.querySelector('[data-cart-tax]');
  const totalEl = document.querySelector('[data-cart-total]');

  if (subtotalEl) subtotalEl.textContent = clientPricing.formatPrice(subtotal, currency);
  if (shippingEl) shippingEl.textContent = clientPricing.formatPrice(shipping, currency);
  if (taxEl) taxEl.textContent = clientPricing.formatPrice(tax, currency);
  if (totalEl) totalEl.textContent = clientPricing.formatPrice(total, currency);
}

async function renderCart() {
  const root = getSectionRoot();
  if (!root) return;

  const config = parseCartConfig(root);
  const currencyConfig = getGlobalConfig();
  const items = clientCart.getCartItems();

  const emptyEl = root.querySelector('[data-cart-empty]') as HTMLElement | null;
  const tableBody = root.querySelector('[data-cart-table-body]') as HTMLElement | null;
  const mobileWrap = root.querySelector('[data-cart-table-mobile]') as HTMLElement | null;
  const tableWrap = root.querySelector('[data-cart-table-wrap]') as HTMLElement | null;
  const summaryEl = root.querySelector('[data-cart-sidebar-summary]') as HTMLElement | null;

  if (items.length === 0) {
    emptyEl?.classList.remove('cart-section__hidden');
    if (tableBody) tableBody.innerHTML = '';
    if (mobileWrap) mobileWrap.innerHTML = '';
    tableWrap?.classList.add('cart-section__hidden');
    summaryEl?.classList.add('cart-section__hidden');
    return;
  }

  const localizedTitles = await fetchLocalizedProductTitles(
    items,
    currencyConfig.locale,
    currencyConfig.tenantId
  );

  emptyEl?.classList.add('cart-section__hidden');
  tableWrap?.classList.remove('cart-section__hidden');
  summaryEl?.classList.remove('cart-section__hidden');

  if (tableBody) {
    tableBody.innerHTML = items
      .map((item) => renderCartItemDesktop(item, config, currencyConfig, localizedTitles))
      .join('');
  }
  if (mobileWrap) {
    mobileWrap.innerHTML = items
      .map((item) => renderCartItemMobile(item, config, currencyConfig, localizedTitles))
      .join('');
  }

  updateCartTotals(items, currencyConfig);
}

async function removeCartLine(itemId: string) {
  try {
    if (isAuthenticated()) {
      await deleteCartItem(itemId);
      await syncLocalCartFromServer();
    } else {
      clientCart.removeFromCart(itemId);
    }
  } catch (err) {
    console.error(err);
    alert(err instanceof Error ? err.message : clientTranslations.get('confirm_delete_item'));
    return;
  }

  void renderCart();
  if (typeof (window as any).updateCartCount === 'function') {
    (window as any).updateCartCount();
  }
  if (typeof (window as any).renderMinicart === 'function') {
    (window as any).renderMinicart();
  }
}

function bindDeleteEvents(root: HTMLElement) {
  if (root.dataset.cartDelBound === '1') return;
  root.dataset.cartDelBound = '1';

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-cart-item-id].cart-section__remove, button[data-cart-item-id]');
    if (!btn || !root.contains(btn)) return;
    e.preventDefault();
    e.stopPropagation();
    const itemId = btn.getAttribute('data-cart-item-id');
    if (itemId && confirm(clientTranslations.get('confirm_delete_item'))) {
      void removeCartLine(itemId);
    }
  });
}

export async function initCartUi(): Promise<void> {
  const root = getSectionRoot();
  if (!root) return;

  bindDeleteEvents(root);

  if (isAuthenticated()) {
    try {
      await syncLocalCartFromServer();
    } catch (err) {
      console.error('[cart] sync failed', err);
    }
  }

  await renderCart();
}

if (typeof document !== 'undefined') {
  (window as any).initCartUi = initCartUi;
  (window as any).renderCartPage = renderCart;
}
