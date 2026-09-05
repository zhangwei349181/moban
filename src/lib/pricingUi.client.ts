/**
 * Pricing 订阅定价客户端交互：计费周期切换 + 登录态续费/升级 + 写入 subscription_cart_items
 */

import {
  addSubscriptionCartRecord,
  computeSubscriptionExpiryIso,
  type SubscriptionPlanCartPayloadJson,
} from './subscription-cart';
import { getCurrentMembershipId, getSessionToken, getAuthTenantId } from './auth';
import { clientTranslations } from './translations';
import {
  findActiveSubscriptionForArticle,
  isBillingPeriodAtLeast,
  parseCartPayloadFromCard,
  resolvePricingCardAction,
  type ActiveArticleSubscription,
  type PricingCardAction,
} from './pricingSubscriptionState.client';

interface PricingClientConfig {
  checkoutUrl: string;
}

interface PricingJson {
  defaultCode?: string;
  currencySymbol?: string;
  options?: Array<{
    code: string;
    priceDisplay: string;
    periodSuffix?: string;
    equivHint?: string;
  }>;
}

function readPricingConfig(root: Element): PricingClientConfig {
  const raw = root.getAttribute('data-pricing-config');
  if (!raw) return { checkoutUrl: '/subscriptioncheckout' };
  try {
    const parsed = JSON.parse(raw) as PricingClientConfig;
    return {
      checkoutUrl:
        typeof parsed.checkoutUrl === 'string' && parsed.checkoutUrl.trim()
          ? parsed.checkoutUrl.trim()
          : '/subscriptioncheckout',
    };
  } catch {
    return { checkoutUrl: '/subscriptioncheckout' };
  }
}

function subscribeLabelForAction(action: PricingCardAction): string {
  if (action === 'renew') return clientTranslations.get('pricing_renew' as any);
  if (action === 'upgrade') return clientTranslations.get('pricing_upgrade' as any);
  return clientTranslations.get('pricing_subscribe_now' as any);
}

function applyBillingToCard(card: Element, code: string): void {
  const raw = card.getAttribute('data-pricing-json');
  if (!raw) return;
  let data: PricingJson;
  try {
    data = JSON.parse(raw) as PricingJson;
  } catch {
    return;
  }

  const opt = (data.options || []).find((o) => o.code === code);
  if (!opt) return;

  const sym = data.currencySymbol || '¥';
  const curEl = card.querySelector('.pricing-plan-price .currency, [data-pricing-currency]');
  if (curEl) curEl.textContent = sym;

  const amountEl = card.querySelector('.pricing-plan-price .amount, [data-pricing-amount]');
  if (amountEl) amountEl.textContent = opt.priceDisplay;

  const periodEl = card.querySelector('.pricing-plan-price .period, [data-pricing-period]');
  if (periodEl) periodEl.textContent = opt.periodSuffix || '';

  const equivEl = card.querySelector('[data-pricing-equiv]');
  if (equivEl) {
    equivEl.textContent = opt.equivHint || '\u00a0';
    if (opt.equivHint) equivEl.removeAttribute('hidden');
    else equivEl.setAttribute('hidden', '');
  }

  const yc = String(code).toLowerCase();
  const isYear = yc === 'yearly' || yc === 'year' || yc === 'annual';
  const hintEl = card.querySelector('[data-pricing-yearly-hint]');
  if (hintEl) {
    if (isYear) hintEl.removeAttribute('hidden');
    else hintEl.setAttribute('hidden', '');
  }

  card.querySelectorAll('[data-billing]').forEach((btn) => {
    const c = btn.getAttribute('data-billing');
    const active = c === code;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function getActiveBillingCode(card: Element, payload: SubscriptionPlanCartPayloadJson): string {
  const active = card.querySelector('[data-billing].active:not([hidden])');
  if (active) {
    const c = active.getAttribute('data-billing');
    if (c) return c;
  }
  return payload.default_billing_code;
}

function getMinBillingPeriod(card: Element): string | null {
  const v = card.getAttribute('data-pricing-min-billing');
  return v && v.trim() ? v.trim() : null;
}

function applySubscriptionToCard(card: Element, sub: ActiveArticleSubscription): void {
  const payload = parseCartPayloadFromCard(card);
  if (!payload) return;

  const action = resolvePricingCardAction(payload.variant_id, payload.base_price, sub);
  card.setAttribute('data-pricing-action', action);
  card.setAttribute('data-pricing-min-billing', sub.paymentPeriod);

  const btn = card.querySelector('[data-pricing-subscribe]') as HTMLButtonElement | null;
  if (btn) {
    btn.textContent = subscribeLabelForAction(action);
    const disabled = action === 'disabled';
    btn.disabled = disabled;
    btn.classList.toggle('pricing-subscribe-btn--disabled', disabled);
    btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }

  if (action === 'disabled') {
    card.classList.add('pricing-plan-card--locked');
    card.querySelectorAll('[data-billing]').forEach((billingBtn) => {
      (billingBtn as HTMLButtonElement).disabled = true;
      billingBtn.classList.add('pricing-billing-toggle__btn--disabled');
    });
    return;
  }

  card.classList.remove('pricing-plan-card--locked');
  const minPeriod = sub.paymentPeriod;
  let firstAllowed: string | null = null;

  card.querySelectorAll('[data-billing]').forEach((billingBtn) => {
    const code = billingBtn.getAttribute('data-billing') || '';
    const allowed = isBillingPeriodAtLeast(code, minPeriod);
    if (allowed) {
      billingBtn.removeAttribute('hidden');
      (billingBtn as HTMLButtonElement).disabled = false;
      billingBtn.classList.remove('pricing-billing-toggle__btn--disabled');
      if (!firstAllowed) firstAllowed = code;
    } else {
      billingBtn.setAttribute('hidden', '');
      (billingBtn as HTMLButtonElement).disabled = true;
      billingBtn.classList.remove('active');
      billingBtn.classList.add('pricing-billing-toggle__btn--disabled');
      billingBtn.setAttribute('aria-pressed', 'false');
    }
  });

  const toggle = card.querySelector('.pricing-billing-toggle');
  const visibleBtns = card.querySelectorAll('[data-billing]:not([hidden])');
  if (toggle instanceof HTMLElement) {
    toggle.hidden = visibleBtns.length <= 1;
  }

  let preferCode = firstAllowed || minPeriod;
  if (action === 'renew') {
    const renewBtn = card.querySelector(`[data-billing="${minPeriod}"]:not([hidden])`);
    if (renewBtn) preferCode = minPeriod;
  }

  const preferBtn = card.querySelector(`[data-billing="${preferCode}"]:not([hidden])`);
  if (preferBtn) {
    applyBillingToCard(card, preferCode);
  } else if (firstAllowed) {
    applyBillingToCard(card, firstAllowed);
  }
}

async function applySubscriptionState(root: Element): Promise<void> {
  if (!getSessionToken() || !getAuthTenantId()) return;

  const articleId = root.getAttribute('data-pricing-article-id')?.trim();
  if (!articleId) return;

  try {
    const sub = await findActiveSubscriptionForArticle(articleId);
    if (!sub) return;

    root.setAttribute('data-pricing-has-subscription', '1');
    root.querySelectorAll('[data-pricing-plan]').forEach((card) => {
      applySubscriptionToCard(card, sub);
    });
  } catch (err) {
    console.warn('[pricing] failed to load subscription state', err);
  }
}

type GalleryHost = HTMLElement & { _gt6PricingGalleryAbort?: AbortController };

function initPricingGallery(root: Element): void {
  const galleries = root.querySelectorAll<GalleryHost>('[data-pricing-gallery]');
  galleries.forEach((gallery) => {
    gallery._gt6PricingGalleryAbort?.abort();
    const ac = new AbortController();
    gallery._gt6PricingGalleryAbort = ac;
    const { signal } = ac;

    const slides = Array.from(
      gallery.querySelectorAll<HTMLElement>('[data-pricing-gallery-slide]')
    );
    const thumbs = Array.from(
      gallery.querySelectorAll<HTMLElement>('[data-pricing-gallery-thumb]')
    );
    if (slides.length <= 1) return;

    let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
    if (index < 0) index = 0;

    const show = (next: number) => {
      index = ((next % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
      });
      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle('is-active', i === index);
      });
    };

    gallery.querySelector('[data-pricing-gallery-prev]')?.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        show(index - 1);
      },
      { signal }
    );
    gallery.querySelector('[data-pricing-gallery-next]')?.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        show(index + 1);
      },
      { signal }
    );
    thumbs.forEach((thumb, i) => {
      thumb.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          show(i);
        },
        { signal }
      );
    });

    show(index);
  });
}

function initCard(card: Element): void {
  const raw = card.getAttribute('data-pricing-json');
  if (!raw) return;
  try {
    const data = JSON.parse(raw) as PricingJson;
    const code = data.defaultCode || data.options?.[0]?.code;
    if (code) applyBillingToCard(card, code);
  } catch {
    /* ignore */
  }
}

function bindPricingSection(root: Element): void {
  root.querySelectorAll('[data-pricing-plan]').forEach((card) => initCard(card));
  initPricingGallery(root);

  const config = readPricingConfig(root);

  if (root.getAttribute('data-pricing-bound') !== '1') {
    root.setAttribute('data-pricing-bound', '1');

    root.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      const billingBtn = target?.closest?.('[data-billing]') as HTMLButtonElement | null;
      if (billingBtn) {
        if (billingBtn.disabled || billingBtn.hasAttribute('hidden')) return;
        const card = billingBtn.closest('[data-pricing-plan]');
        const code = billingBtn.getAttribute('data-billing');
        if (card && code) applyBillingToCard(card, code);
        return;
      }

      const subscribeBtn = target?.closest?.('[data-pricing-subscribe]') as HTMLButtonElement | null;
      if (!subscribeBtn) return;
      if (subscribeBtn.disabled) return;

      const card = subscribeBtn.closest('[data-pricing-plan]');
      if (!card) return;
      if (card.getAttribute('data-pricing-action') === 'disabled') return;

      const raw = card.getAttribute('data-cart-payload');
      if (!raw) return;

      let payload: SubscriptionPlanCartPayloadJson;
      try {
        payload = JSON.parse(raw) as SubscriptionPlanCartPayloadJson;
      } catch {
        return;
      }

      const code = getActiveBillingCode(card, payload);
      const minPeriod = getMinBillingPeriod(card);
      if (minPeriod && !isBillingPeriodAtLeast(code, minPeriod)) return;

      const opt = payload.billing_options.find((o) => o.code === code) ?? payload.billing_options[0];
      if (!opt) return;

      const now = new Date();
      addSubscriptionCartRecord(payload, {
        membership_id: getCurrentMembershipId(),
        payment_period: code,
        price_multiplier: opt.multiplier,
        paid_price: opt.amount_display,
        created_at: now.toISOString(),
        expires_at: computeSubscriptionExpiryIso(now, code),
      });

      window.location.href = config.checkoutUrl;
    });
  }

  void applySubscriptionState(root);
}

export function initPricingUi(): void {
  document.querySelectorAll('[data-pricing-section]').forEach((root) => {
    bindPricingSection(root);
  });
}
