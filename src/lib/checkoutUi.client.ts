/**
 * Checkout 页面动态组件 — 客户端逻辑（参考 newworld checkout-page.astro）
 */

import { isAuthenticated } from './auth';
import { syncLocalCartFromServer } from './cart-api';
import { clientCart, type CartItem } from './cart';
import { clientPricing } from './pricing';
import { clientTranslations } from './translations';
import { clientPayment, getPaymentMethodDisplayName, type PaymentMethod } from './payment';
import { clientAddress, type Address } from './address';
import {
  postCreateCheckoutSession,
  pickCheckoutRedirectUrl,
  type CreateCheckoutSessionPayload,
} from './checkout-api';
import { clientArticleSearch } from './articleSearch';

export interface CheckoutSectionConfig {
  loginUrl: string;
  cartUrl: string;
  addressesUrl: string;
  successReturnPath: string;
  cancelReturnPath: string;
}

function getSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-checkout-section]');
}

function parseCheckoutConfig(root: HTMLElement): CheckoutSectionConfig {
  const defaults: CheckoutSectionConfig = {
    loginUrl: '/login',
    cartUrl: '/cart',
    addressesUrl: '/dashboard#addresses',
    successReturnPath: '/checkout?status=success&session_id={CHECKOUT_SESSION_ID}',
    cancelReturnPath: '/checkout?status=cancel',
  };
  const raw = root.dataset.checkoutConfig;
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
    locale: win.__ASTRO_LOCALE__ || 'zh-CN',
    tenantId: win.__ASTRO_TENANT_ID__ || '',
    currentCurrency: win.__ASTRO_CURRENT_CURRENCY__ || null,
    exchangeRate: win.__ASTRO_EXCHANGE_RATE__ || 1,
  };
}

function convertToCurrentCurrency(amountInBase: number, exchangeRate: number): number {
  return amountInBase * exchangeRate;
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
    console.warn('[checkout] failed to load localized product titles', error);
  }

  return titleMap;
}

function show(root: HTMLElement, selector: string) {
  root.querySelector(selector)?.classList.remove('checkout-section__hidden');
}

function hide(root: HTMLElement, selector: string) {
  root.querySelector(selector)?.classList.add('checkout-section__hidden');
}

function setText(root: HTMLElement, selector: string, text: string) {
  const el = root.querySelector(selector);
  if (el) el.textContent = text;
}

let selectedPaymentMethodId: string | null = null;
let selectedBillingAddressId: string | null = null;
let paymentLoadOk = false;
let paymentHasMethods = false;
let billingLoadOk = false;
let billingHasAddresses = false;

function refreshPayButton(root: HTMLElement) {
  const btn = root.querySelector('[data-checkout-pay-btn]') as HTMLButtonElement | null;
  if (!btn) return;
  const canPay =
    paymentLoadOk &&
    paymentHasMethods &&
    selectedPaymentMethodId != null &&
    billingLoadOk &&
    billingHasAddresses &&
    selectedBillingAddressId != null;
  btn.disabled = !canPay;
  btn.classList.toggle('checkout-section__pay-btn--ready', canPay);
}

function updateTotals(root: HTMLElement, items: CartItem[], currencyConfig: ReturnType<typeof getGlobalConfig>) {
  const currency = currencyConfig.currentCurrency || { currency_symbol: '$', decimal_places: 2 };
  const exchangeRate = currencyConfig.exchangeRate || 1;

  const subtotalBase = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const shippingBase = items.reduce((sum, item) => sum + item.shipping_fee, 0);
  const taxBase = items.reduce((sum, item) => sum + item.tax_fee, 0);

  const subtotal = convertToCurrentCurrency(subtotalBase, exchangeRate);
  const shipping = convertToCurrentCurrency(shippingBase, exchangeRate);
  const tax = convertToCurrentCurrency(taxBase, exchangeRate);
  const total = subtotal + shipping + tax;

  setText(root, '[data-checkout-subtotal]', clientPricing.formatPrice(subtotal, currency));
  setText(root, '[data-checkout-shipping]', clientPricing.formatPrice(shipping, currency));
  setText(root, '[data-checkout-tax]', clientPricing.formatPrice(tax, currency));
  setText(root, '[data-checkout-total]', clientPricing.formatPrice(total, currency));
}

function renderLineItems(
  root: HTMLElement,
  items: CartItem[],
  currencyConfig: ReturnType<typeof getGlobalConfig>,
  localizedTitles: Map<string, string>
) {
  const currency = currencyConfig.currentCurrency || { currency_symbol: '$', decimal_places: 2 };
  const exchangeRate = currencyConfig.exchangeRate || 1;

  const rowHtml = items
    .map((item) => {
      const unit = convertToCurrentCurrency(item.unit_price, exchangeRate);
      const sub = unit * item.quantity;
      const name = resolveProductDisplayName(item, localizedTitles);
      return `
        <tr>
          <td class="checkout-section__cell checkout-section__cell--product">
            <div class="checkout-section__product">
              <img src="${item.product_image_url}" alt="${name}" class="checkout-section__product-image" loading="lazy" />
              <span class="checkout-section__product-name">${name}</span>
            </div>
          </td>
          <td class="checkout-section__cell">${clientPricing.formatPrice(unit, currency)}</td>
          <td class="checkout-section__cell">${item.quantity}</td>
          <td class="checkout-section__cell">${clientPricing.formatPrice(sub, currency)}</td>
        </tr>`;
    })
    .join('');

  const mobileHtml = items
    .map((item) => {
      const unit = convertToCurrentCurrency(item.unit_price, exchangeRate);
      const sub = unit * item.quantity;
      const name = resolveProductDisplayName(item, localizedTitles);
      return `
        <div class="checkout-section__mobile-item">
          <div class="checkout-section__product-name">${name}</div>
          <div class="checkout-section__mobile-meta">${clientTranslations.get('quantity')}: ${item.quantity}</div>
          <div class="checkout-section__mobile-meta">${clientTranslations.get('subtotal')}: ${clientPricing.formatPrice(sub, currency)}</div>
        </div>`;
    })
    .join('');

  const tbody = root.querySelector('[data-checkout-table-body]');
  const mobile = root.querySelector('[data-checkout-table-mobile]');
  if (tbody) tbody.innerHTML = rowHtml;
  if (mobile) mobile.innerHTML = mobileHtml;
}

function renderPaymentMethods(root: HTMLElement, methods: PaymentMethod[], locale: string) {
  const container = root.querySelector('[data-checkout-payment-methods]');
  hide(root, '[data-checkout-payment-loading]');
  if (!container) return;

  const enabled = methods.filter((m) => m.is_enabled);
  paymentHasMethods = enabled.length > 0;

  if (!paymentHasMethods) {
    selectedPaymentMethodId = null;
    container.innerHTML = `<p class="checkout-section__hint">${clientTranslations.get('no_payment_methods')}</p>`;
    refreshPayButton(root);
    return;
  }

  container.innerHTML = enabled
    .map((m, i) => {
      const name = getPaymentMethodDisplayName(m, locale);
      const id = `checkout-pm-${m.id}`;
      const checked = i === 0 ? 'checked' : '';
      if (i === 0) selectedPaymentMethodId = m.id;
      return `
        <label class="checkout-section__radio">
          <input type="radio" name="checkout_payment_method" id="${id}" value="${m.id}" ${checked} />
          <span>${name}</span>
        </label>`;
    })
    .join('');

  container.querySelectorAll('input[name="checkout_payment_method"]').forEach((input) => {
    input.addEventListener('change', () => {
      selectedPaymentMethodId = (input as HTMLInputElement).value;
      refreshPayButton(root);
    });
  });
  refreshPayButton(root);
}

function renderBillingSection(root: HTMLElement, addresses: Address[], loadError: Error | null, config: CheckoutSectionConfig) {
  const container = root.querySelector('[data-checkout-billing-addresses]');
  const addWrap = root.querySelector('[data-checkout-billing-add-wrap]');
  const addHint = root.querySelector('[data-checkout-billing-add-hint]');
  const errEl = root.querySelector('[data-checkout-address-error]') as HTMLElement | null;
  const addLink = root.querySelector('[data-checkout-add-billing-link]') as HTMLAnchorElement | null;

  hide(root, '[data-checkout-address-loading]');
  if (!container || !addWrap || !errEl) return;

  if (addLink) addLink.href = config.addressesUrl;

  if (loadError) {
    errEl.textContent = loadError.message;
    errEl.classList.remove('checkout-section__hidden');
    container.innerHTML = '';
    selectedBillingAddressId = null;
    billingHasAddresses = false;
    billingLoadOk = false;
    if (addHint) addHint.textContent = clientTranslations.get('no_billing_addresses');
    addWrap.classList.remove('checkout-section__hidden');
    refreshPayButton(root);
    return;
  }

  errEl.classList.add('checkout-section__hidden');
  billingLoadOk = true;

  if (addresses.length === 0) {
    container.innerHTML = '';
    selectedBillingAddressId = null;
    billingHasAddresses = false;
    if (addHint) addHint.textContent = clientTranslations.get('no_billing_addresses');
    addWrap.classList.remove('checkout-section__hidden');
    refreshPayButton(root);
    return;
  }

  billingHasAddresses = true;
  addWrap.classList.add('checkout-section__hidden');
  selectedBillingAddressId = addresses[0].id;

  container.innerHTML = addresses
    .map((a, i) => {
      const id = `checkout-bill-${a.id}`;
      const checked = i === 0 ? 'checked' : '';
      const lines = [a.recipient_name, a.phone_number, a.address_line1, a.address_line2, a.postal_code]
        .filter(Boolean)
        .join(' · ');
      return `
        <label class="checkout-section__address">
          <input type="radio" name="checkout_billing" id="${id}" value="${a.id}" ${checked} />
          <span class="checkout-section__address-body">
            <strong>${a.address_name}</strong>
            <span class="checkout-section__address-lines">${lines}</span>
          </span>
        </label>`;
    })
    .join('');

  container.querySelectorAll('input[name="checkout_billing"]').forEach((input) => {
    input.addEventListener('change', () => {
      selectedBillingAddressId = (input as HTMLInputElement).value;
      refreshPayButton(root);
    });
  });
  refreshPayButton(root);
}

function bindPayButton(root: HTMLElement, config: CheckoutSectionConfig) {
  if (root.dataset.checkoutPayBound === '1') return;
  root.dataset.checkoutPayBound = '1';

  const btn = root.querySelector('[data-checkout-pay-btn]') as HTMLButtonElement | null;
  const submitErr = root.querySelector('[data-checkout-submit-error]') as HTMLElement | null;

  btn?.addEventListener('click', async () => {
    refreshPayButton(root);
    if (!btn || btn.disabled) return;

    if (!selectedPaymentMethodId || !selectedBillingAddressId) {
      if (submitErr) {
        submitErr.textContent = !selectedBillingAddressId
          ? clientTranslations.get('no_billing_addresses')
          : clientTranslations.get('select_payment_method');
        submitErr.classList.remove('checkout-section__hidden');
      }
      return;
    }

    const origin = window.location.origin;
    const successUrl = `${origin}${config.successReturnPath.startsWith('/') ? config.successReturnPath : `/${config.successReturnPath}`}`;
    const cancelUrl = `${origin}${config.cancelReturnPath.startsWith('/') ? config.cancelReturnPath : `/${config.cancelReturnPath}`}`;

    submitErr?.classList.add('checkout-section__hidden');
    btn.disabled = true;

    try {
      const payCfg = getGlobalConfig();
      const cartLines = clientCart.getCartItems();
      const baseCode = cartLines[0]?.currency_code ? String(cartLines[0].currency_code).toUpperCase() : '';
      const cur = payCfg.currentCurrency;
      const checkoutCode = cur?.currency_code ? String(cur.currency_code).toUpperCase() : baseCode;
      let rate = typeof payCfg.exchangeRate === 'number' && payCfg.exchangeRate > 0 ? payCfg.exchangeRate : 1;
      if (checkoutCode && baseCode && checkoutCode === baseCode) {
        rate = 1;
      }

      const payload: CreateCheckoutSessionPayload = {
        payment_method_id: selectedPaymentMethodId,
        billing_address_id: selectedBillingAddressId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        session_mode: 'payment',
        checkout_currency_code: checkoutCode || undefined,
        exchange_rate: rate,
      };

      const data = await postCreateCheckoutSession(payload);
      const url = pickCheckoutRedirectUrl(data);
      if (!url) {
        throw new Error('Checkout redirect URL missing from server');
      }
      window.location.href = url;
    } catch (e) {
      if (submitErr) {
        submitErr.textContent = e instanceof Error ? e.message : String(e);
        submitErr.classList.remove('checkout-section__hidden');
      }
      refreshPayButton(root);
    }
  });
}

export async function initCheckoutUi(): Promise<void> {
  const root = getSectionRoot();
  if (!root) return;

  const config = parseCheckoutConfig(root);

  const backCartLink = root.querySelector('[data-checkout-back-cart-link]') as HTMLAnchorElement | null;
  if (backCartLink) backCartLink.href = config.cartUrl;

  if (!isAuthenticated()) {
    show(root, '[data-checkout-auth-gate]');
    const loginLink = root.querySelector('[data-checkout-login-link]') as HTMLAnchorElement | null;
    if (loginLink) {
      const params = new URLSearchParams({ return: window.location.pathname });
      loginLink.href = `${config.loginUrl}?${params.toString()}`;
    }
    return;
  }

  try {
    await syncLocalCartFromServer();
  } catch (e) {
    console.error('[checkout] cart sync failed', e);
  }

  const items = clientCart.getCartItems();
  const currencyConfig = getGlobalConfig();

  if (items.length === 0) {
    show(root, '[data-checkout-empty]');
    const emptyLink = root.querySelector('[data-checkout-empty-cart-link]') as HTMLAnchorElement | null;
    if (emptyLink) emptyLink.href = config.cartUrl;
    return;
  }

  show(root, '[data-checkout-main]');
  const localizedTitles = await fetchLocalizedProductTitles(
    items,
    currencyConfig.locale,
    currencyConfig.tenantId
  );
  renderLineItems(root, items, currencyConfig, localizedTitles);
  updateTotals(root, items, currencyConfig);

  const settleLine = root.querySelector('[data-checkout-settle-currency-line]') as HTMLElement | null;
  const settleCodeEl = root.querySelector('[data-checkout-settle-currency-code]');
  const cur0 = currencyConfig.currentCurrency;
  const baseCode0 = items[0]?.currency_code ? String(items[0].currency_code).toUpperCase() : '';
  const displayCode0 = cur0?.currency_code ? String(cur0.currency_code).toUpperCase() : baseCode0;
  if (settleLine && settleCodeEl && displayCode0) {
    settleCodeEl.textContent = displayCode0;
    settleLine.classList.remove('checkout-section__hidden');
  }

  show(root, '[data-checkout-payment-loading]');
  show(root, '[data-checkout-address-loading]');

  try {
    const pmData = await clientPayment.fetchPaymentMethods(currencyConfig.tenantId);
    paymentLoadOk = true;
    renderPaymentMethods(root, pmData.payment_methods || [], currencyConfig.locale);
  } catch (e) {
    paymentLoadOk = false;
    paymentHasMethods = false;
    selectedPaymentMethodId = null;
    hide(root, '[data-checkout-payment-loading]');
    const errEl = root.querySelector('[data-checkout-payment-error]') as HTMLElement | null;
    if (errEl) {
      errEl.textContent = e instanceof Error ? e.message : clientTranslations.get('no_payment_methods');
      errEl.classList.remove('checkout-section__hidden');
    }
    renderPaymentMethods(root, [], currencyConfig.locale);
  }

  try {
    const addrRes = await clientAddress.getAddresses();
    const all = addrRes.data?.addresses || [];
    const billing = all.filter((a) => a.address_type === 'billing' && a.status === 'active');
    renderBillingSection(root, billing, null, config);
  } catch (e) {
    hide(root, '[data-checkout-address-loading]');
    renderBillingSection(
      root,
      [],
      e instanceof Error ? e : new Error(String(e)),
      config
    );
  }

  bindPayButton(root, config);
  refreshPayButton(root);
}

if (typeof document !== 'undefined') {
  (window as any).initCheckoutUi = initCheckoutUi;
}
