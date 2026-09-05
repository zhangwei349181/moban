/**
 * 订阅结账页面 — 客户端逻辑（参考 newworld subscription-checkout-page.astro）
 */

import { isAuthenticated } from './auth';
import { clientPricing } from './pricing';
import { clientTranslations } from './translations';
import { clientPayment, getPaymentMethodDisplayName, type PaymentMethod } from './payment';
import { clientAddress, type Address } from './address';
import {
  getLatestSubscriptionCartRecord,
  clearSubscriptionCart,
  type SubscriptionCartStoredRecord,
} from './subscription-cart';
import {
  postCreateSubscriptionCheckoutSession,
  pickSubscriptionCheckoutRedirectUrl,
} from './subscription-checkout-api';

export interface SubscriptionCheckoutSectionConfig {
  loginUrl: string;
  shopUrl: string;
  addressesUrl: string;
  successReturnPath: string;
  cancelReturnPath: string;
}

function getSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-subscription-checkout-section]');
}

function parseConfig(root: HTMLElement): SubscriptionCheckoutSectionConfig {
  const defaults: SubscriptionCheckoutSectionConfig = {
    loginUrl: '/login',
    shopUrl: '/product',
    addressesUrl: '/dashboard#addresses',
    successReturnPath:
      '/subscriptioncheckout?status=success&session_id={CHECKOUT_SESSION_ID}',
    cancelReturnPath: '/subscriptioncheckout?status=cancel',
  };
  const raw = root.dataset.subscriptionCheckoutConfig;
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

function show(root: HTMLElement, selector: string) {
  root.querySelector(selector)?.classList.remove('subscription-checkout-section__hidden');
}

function hide(root: HTMLElement, selector: string) {
  root.querySelector(selector)?.classList.add('subscription-checkout-section__hidden');
}

function setText(root: HTMLElement, selector: string, text: string) {
  const el = root.querySelector(selector);
  if (el) el.textContent = text;
}

let lineRecord: SubscriptionCartStoredRecord | null = null;
let selectedPaymentMethodId: string | null = null;
let selectedBillingAddressId: string | null = null;
let paymentLoadOk = false;
let paymentHasMethods = false;
let billingLoadOk = false;
let billingHasAddresses = false;

function refreshPayButton(root: HTMLElement) {
  const btn = root.querySelector('[data-subscription-checkout-pay-btn]') as HTMLButtonElement | null;
  if (!btn) return;
  const canPay =
    lineRecord != null &&
    paymentLoadOk &&
    paymentHasMethods &&
    selectedPaymentMethodId != null &&
    billingLoadOk &&
    billingHasAddresses &&
    selectedBillingAddressId != null;
  btn.disabled = !canPay;
  btn.classList.toggle('subscription-checkout-section__pay-btn--ready', canPay);
}

function renderSummary(
  root: HTMLElement,
  record: SubscriptionCartStoredRecord,
  currencyConfig: ReturnType<typeof getGlobalConfig>
) {
  const currency = currencyConfig.currentCurrency || { currency_symbol: '$', decimal_places: 2 };
  const paid = Number(record.paid_price);
  const formatted = clientPricing.formatPrice(paid, currency);

  setText(root, '[data-subscription-checkout-summary-product-name]', record.product_name || '—');
  setText(root, '[data-subscription-checkout-summary-attribute-name]', record.attribute_value_name || '—');
  setText(root, '[data-subscription-checkout-summary-payment-period]', record.payment_period || '—');
  setText(root, '[data-subscription-checkout-summary-paid-price]', formatted);
  setText(root, '[data-subscription-checkout-side-total]', formatted);
}

function renderPaymentMethods(root: HTMLElement, methods: PaymentMethod[], locale: string) {
  const container = root.querySelector('[data-subscription-checkout-payment-methods]');
  hide(root, '[data-subscription-checkout-payment-loading]');
  if (!container) return;

  const enabled = methods.filter((m) => m.is_enabled);
  paymentHasMethods = enabled.length > 0;

  if (!paymentHasMethods) {
    selectedPaymentMethodId = null;
    container.innerHTML = `<p class="subscription-checkout-section__hint">${clientTranslations.get('no_payment_methods')}</p>`;
    refreshPayButton(root);
    return;
  }

  container.innerHTML = enabled
    .map((m, i) => {
      const name = getPaymentMethodDisplayName(m, locale);
      const id = `subcheckout-pm-${m.id}`;
      const checked = i === 0 ? 'checked' : '';
      if (i === 0) selectedPaymentMethodId = m.id;
      return `
        <label class="subscription-checkout-section__radio">
          <input type="radio" name="subscription_checkout_payment_method" id="${id}" value="${m.id}" ${checked} />
          <span>${name}</span>
        </label>`;
    })
    .join('');

  container.querySelectorAll('input[name="subscription_checkout_payment_method"]').forEach((input) => {
    input.addEventListener('change', () => {
      selectedPaymentMethodId = (input as HTMLInputElement).value;
      refreshPayButton(root);
    });
  });
  refreshPayButton(root);
}

function renderBillingSection(
  root: HTMLElement,
  addresses: Address[],
  loadError: Error | null,
  config: SubscriptionCheckoutSectionConfig
) {
  const container = root.querySelector('[data-subscription-checkout-billing-addresses]');
  const addWrap = root.querySelector('[data-subscription-checkout-billing-add-wrap]');
  const addHint = root.querySelector('[data-subscription-checkout-billing-add-hint]');
  const errEl = root.querySelector('[data-subscription-checkout-address-error]') as HTMLElement | null;
  const addLink = root.querySelector('[data-subscription-checkout-add-billing-link]') as HTMLAnchorElement | null;

  hide(root, '[data-subscription-checkout-address-loading]');
  if (!container || !addWrap || !errEl) return;

  if (addLink) addLink.href = config.addressesUrl;

  if (loadError) {
    errEl.textContent = loadError.message;
    errEl.classList.remove('subscription-checkout-section__hidden');
    container.innerHTML = '';
    selectedBillingAddressId = null;
    billingHasAddresses = false;
    billingLoadOk = false;
    if (addHint) addHint.textContent = clientTranslations.get('no_billing_addresses');
    addWrap.classList.remove('subscription-checkout-section__hidden');
    refreshPayButton(root);
    return;
  }

  errEl.classList.add('subscription-checkout-section__hidden');
  billingLoadOk = true;

  if (addresses.length === 0) {
    container.innerHTML = '';
    selectedBillingAddressId = null;
    billingHasAddresses = false;
    if (addHint) addHint.textContent = clientTranslations.get('no_billing_addresses');
    addWrap.classList.remove('subscription-checkout-section__hidden');
    refreshPayButton(root);
    return;
  }

  billingHasAddresses = true;
  addWrap.classList.add('subscription-checkout-section__hidden');
  selectedBillingAddressId = addresses[0].id;

  container.innerHTML = addresses
    .map((a, i) => {
      const id = `subcheckout-bill-${a.id}`;
      const checked = i === 0 ? 'checked' : '';
      const lines = [a.recipient_name, a.phone_number, a.address_line1, a.address_line2, a.postal_code]
        .filter(Boolean)
        .join(' · ');
      return `
        <label class="subscription-checkout-section__address">
          <input type="radio" name="subscription_checkout_billing" id="${id}" value="${a.id}" ${checked} />
          <span class="subscription-checkout-section__address-body">
            <strong>${a.address_name}</strong>
            <span class="subscription-checkout-section__address-lines">${lines}</span>
          </span>
        </label>`;
    })
    .join('');

  container.querySelectorAll('input[name="subscription_checkout_billing"]').forEach((input) => {
    input.addEventListener('change', () => {
      selectedBillingAddressId = (input as HTMLInputElement).value;
      refreshPayButton(root);
    });
  });
  refreshPayButton(root);
}

function bindPayButton(root: HTMLElement, config: SubscriptionCheckoutSectionConfig) {
  if (root.dataset.subscriptionCheckoutPayBound === '1') return;
  root.dataset.subscriptionCheckoutPayBound = '1';

  const btn = root.querySelector('[data-subscription-checkout-pay-btn]') as HTMLButtonElement | null;
  const submitErr = root.querySelector('[data-subscription-checkout-submit-error]') as HTMLElement | null;

  btn?.addEventListener('click', async () => {
    refreshPayButton(root);
    if (!btn || btn.disabled) return;

    if (!lineRecord || !selectedPaymentMethodId || !selectedBillingAddressId) {
      if (submitErr) {
        submitErr.textContent = !selectedBillingAddressId
          ? clientTranslations.get('no_billing_addresses')
          : clientTranslations.get('select_payment_method');
        submitErr.classList.remove('subscription-checkout-section__hidden');
      }
      return;
    }

    const origin = window.location.origin;
    const successUrl = `${origin}${config.successReturnPath.startsWith('/') ? config.successReturnPath : `/${config.successReturnPath}`}`;
    const cancelUrl = `${origin}${config.cancelReturnPath.startsWith('/') ? config.cancelReturnPath : `/${config.cancelReturnPath}`}`;

    submitErr?.classList.add('subscription-checkout-section__hidden');
    btn.disabled = true;

    try {
      const payCfg = getGlobalConfig();
      const baseCode = lineRecord.currency_code ? String(lineRecord.currency_code).toUpperCase() : '';
      const variantCode = lineRecord.variant_currency
        ? String(lineRecord.variant_currency).toUpperCase()
        : '';
      const cur = payCfg.currentCurrency;
      const checkoutCode = cur?.currency_code ? String(cur.currency_code).toUpperCase() : baseCode;

      let rate = Number((lineRecord as SubscriptionCartStoredRecord & { exchange_rate?: number }).exchange_rate);
      if (!(typeof rate === 'number' && rate > 0)) {
        rate = typeof payCfg.exchangeRate === 'number' && payCfg.exchangeRate > 0 ? payCfg.exchangeRate : 1;
      }
      if (variantCode && checkoutCode && variantCode === checkoutCode) {
        rate = 1;
      }

      const data = await postCreateSubscriptionCheckoutSession({
        payment_method_id: selectedPaymentMethodId,
        billing_address_id: selectedBillingAddressId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        session_mode: 'subscription',
        checkout_currency_code: checkoutCode || undefined,
        exchange_rate: rate,
        subscription_line: lineRecord,
      });

      const url = pickSubscriptionCheckoutRedirectUrl(data);
      if (!url) {
        throw new Error('Checkout redirect URL missing from server');
      }
      clearSubscriptionCart();
      window.location.href = url;
    } catch (e) {
      if (submitErr) {
        submitErr.textContent = e instanceof Error ? e.message : String(e);
        submitErr.classList.remove('subscription-checkout-section__hidden');
      }
      refreshPayButton(root);
    }
  });
}

export async function initSubscriptionCheckoutUi(): Promise<void> {
  const root = getSectionRoot();
  if (!root) return;

  const config = parseConfig(root);

  const backShopLink = root.querySelector('[data-subscription-checkout-back-shop-link]') as HTMLAnchorElement | null;
  if (backShopLink) backShopLink.href = config.shopUrl;

  if (!isAuthenticated()) {
    show(root, '[data-subscription-checkout-auth-gate]');
    const loginLink = root.querySelector('[data-subscription-checkout-login-link]') as HTMLAnchorElement | null;
    if (loginLink) {
      const params = new URLSearchParams({ return: window.location.pathname });
      loginLink.href = `${config.loginUrl}?${params.toString()}`;
    }
    return;
  }

  lineRecord = getLatestSubscriptionCartRecord();
  const currencyConfig = getGlobalConfig();

  if (!lineRecord) {
    show(root, '[data-subscription-checkout-empty]');
    const emptyLink = root.querySelector('[data-subscription-checkout-empty-shop-link]') as HTMLAnchorElement | null;
    if (emptyLink) emptyLink.href = config.shopUrl;
    return;
  }

  show(root, '[data-subscription-checkout-main]');
  renderSummary(root, lineRecord, currencyConfig);

  show(root, '[data-subscription-checkout-payment-loading]');
  show(root, '[data-subscription-checkout-address-loading]');

  try {
    const pmData = await clientPayment.fetchPaymentMethods(currencyConfig.tenantId);
    paymentLoadOk = true;
    renderPaymentMethods(root, pmData.payment_methods || [], currencyConfig.locale);
  } catch (e) {
    paymentLoadOk = false;
    paymentHasMethods = false;
    selectedPaymentMethodId = null;
    hide(root, '[data-subscription-checkout-payment-loading]');
    const errEl = root.querySelector('[data-subscription-checkout-payment-error]') as HTMLElement | null;
    if (errEl) {
      errEl.textContent = e instanceof Error ? e.message : clientTranslations.get('no_payment_methods');
      errEl.classList.remove('subscription-checkout-section__hidden');
    }
    renderPaymentMethods(root, [], currencyConfig.locale);
  }

  try {
    const addrRes = await clientAddress.getAddresses();
    const all = addrRes.data?.addresses || [];
    const billing = all.filter((a) => a.address_type === 'billing' && a.status === 'active');
    renderBillingSection(root, billing, null, config);
  } catch (e) {
    hide(root, '[data-subscription-checkout-address-loading]');
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
  (window as any).initSubscriptionCheckoutUi = initSubscriptionCheckoutUi;
}
