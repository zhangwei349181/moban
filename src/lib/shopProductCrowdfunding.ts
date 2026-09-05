/**
 * 产品单页：众筹列表、回报匹配、众筹价与库存、详情弹窗（由 ShopProductRuntime 注入宿主上下文）
 */

import type {
  CrowdfundingData,
  CrowdfundingActivity,
  CrowdfundingReward,
  Variant,
  DiscountRulesData,
} from './product';
import type { DiscountViewerContext, DiscountResult } from './pricing';
import { clientPricing, matchesCrowdfundingUserRestrictions } from './pricing';
import { clientTranslations } from './translations';
import { isUnregisteredPriceUiHidden } from './globalDiscountPrice';

function guestHidesProductPrices(): boolean {
  const tid = typeof window !== 'undefined' ? String((window as any).__ASTRO_TENANT_ID__ || '') : '';
  return isUnregisteredPriceUiHidden(tid);
}

export interface ShopCrowdfundingGlobalProductData {
  discountRules: DiscountRulesData;
  config: {
    exchangeRate: number;
    currentCurrency: unknown;
  };
}

export interface ShopCrowdfundingCurrentPriceInfo {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountResult: DiscountResult;
}

export interface ShopCrowdfundingContext {
  getSelectedActivity: () => CrowdfundingActivity | null;
  setSelectedActivity: (a: CrowdfundingActivity | null) => void;
  getMatchedReward: () => CrowdfundingReward | null;
  setMatchedReward: (r: CrowdfundingReward | null) => void;
  getGlobalProductData: () => ShopCrowdfundingGlobalProductData | null;
  getCurrentVariant: () => Variant | null;
  getDiscountViewerContext: () => DiscountViewerContext;
  getCurrentQuantity: () => number;
  getLocale: () => string;
  updatePriceAndStock: (variant: Variant | null) => void;
  updatePriceWithVariant: (
    variant: Variant,
    discountRules: DiscountRulesData,
    config: Record<string, unknown>
  ) => void;
  updateStockWithVariant: (variant: Variant) => void;
  renderPriceDisplay: (
    originalPrice: number,
    discountedPrice: number,
    hasDiscount: boolean,
    currency: unknown
  ) => void;
  setCurrentDiscountedPrice: (n: number) => void;
  setCurrentPriceInfo: (info: ShopCrowdfundingCurrentPriceInfo) => void;
  getSelectedAddress: () => unknown | null;
  calculateShippingAndTax: () => void;
}

export interface ShopCrowdfundingController {
  getCrowdfundingDisplayName: (activity: CrowdfundingActivity, locale: string) => string;
  renderCrowdfundingList: (crowdfundingData: CrowdfundingData, locale: string) => void;
  matchCrowdfundingRewardAndUpdate: () => void;
  updatePriceAndStockWithCrowdfunding: () => void;
  openCrowdfundingModal: (activity: CrowdfundingActivity, locale: string) => void;
}

function hideCrowdfundingDeliveryTime(): void {
  const el = document.getElementById('crowdfunding-delivery-time');
  if (el) el.style.display = 'none';
}

function getCrowdfundingDisplayName(activity: CrowdfundingActivity, locale: string): string {
  if (activity.translations && activity.translations.length > 0) {
    const translation = activity.translations.find((t) => t.language_code === locale);
    if (translation && translation.activity_name) {
      return translation.activity_name;
    }
  }
  return activity.activity_name || '';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatFundingAmount(n: number, locale: string): string {
  return Number(n).toLocaleString(locale.replace('_', '-'), { maximumFractionDigits: 2 });
}

function getCrowdfundingProgressPercent(activity: CrowdfundingActivity): number {
  const p = activity.statistics?.progress_percentage;
  if (typeof p === 'number' && !Number.isNaN(p)) {
    return Math.min(100, Math.max(0, p));
  }
  const target = activity.funding_config?.target_amount;
  const current = activity.funding_config?.current_amount;
  if (typeof target === 'number' && target > 0 && typeof current === 'number') {
    return Math.min(100, Math.max(0, (current / target) * 100));
  }
  return 0;
}

function bindCrowdfundingCardSelectionHighlight(root: HTMLElement): void {
  const radios = root.querySelectorAll<HTMLInputElement>('input[name="crowdfunding-activity"]');
  const sync = () => {
    radios.forEach((r) => {
      const card = r.closest('.crowdfunding-activity-card, .crowdfunding-option-normal');
      if (card) {
        card.classList.toggle('crowdfunding-card--selected', r.checked);
      }
    });
  };
  radios.forEach((r) => r.addEventListener('change', sync));
  sync();
}

/** 弹窗内展示 restrictions（allow 优先于 interdict 的说明与数据一致） */
function appendCrowdfundingRestrictionsHtml(activity: CrowdfundingActivity): string {
  const r = activity.restrictions;
  if (!r || typeof r !== 'object') return '';

  const ulRaw =
    r.user_level_restriction &&
    typeof r.user_level_restriction === 'object' &&
    (r.user_level_restriction as { allow?: unknown }).allow != null &&
    String((r.user_level_restriction as { allow?: unknown }).allow).trim() !== ''
      ? `allow`
      : r.user_level_restriction &&
          typeof r.user_level_restriction === 'object' &&
          (r.user_level_restriction as { interdict?: unknown }).interdict != null &&
          String((r.user_level_restriction as { interdict?: unknown }).interdict).trim() !== ''
        ? `interdict`
        : null;

  const mrRaw =
    r.membership_restriction &&
    typeof r.membership_restriction === 'object' &&
    (r.membership_restriction as { allow?: unknown }).allow != null &&
    String((r.membership_restriction as { allow?: unknown }).allow).trim() !== ''
      ? `allow`
      : r.membership_restriction &&
          typeof r.membership_restriction === 'object' &&
          (r.membership_restriction as { interdict?: unknown }).interdict != null &&
          String((r.membership_restriction as { interdict?: unknown }).interdict).trim() !== ''
        ? `interdict`
        : null;

  const hasPerUser = r.per_user_limit != null && r.per_user_limit !== undefined;
  if (!ulRaw && !mrRaw && !hasPerUser) {
    return '';
  }

  let html = `<div class="mb-3">`;
  html += `<p class="mb-1"><strong>${clientTranslations.get('crowdfunding_restrictions_title')}</strong></p>`;
  if (r.per_user_limit != null && r.per_user_limit !== undefined) {
    html += `<p class="mb-0">${clientTranslations.get('crowdfunding_per_user_limit').replace('{perUserLimit}', String(r.per_user_limit))}</p>`;
  }
  if (ulRaw === 'allow') {
    const v = String((r.user_level_restriction as { allow: unknown }).allow).trim();
    html += `<p class="mb-0">${clientTranslations.get('crowdfunding_level_allow').replace('{value}', v)}</p>`;
  } else if (ulRaw === 'interdict') {
    const v = String((r.user_level_restriction as { interdict: unknown }).interdict).trim();
    html += `<p class="mb-0">${clientTranslations.get('crowdfunding_level_interdict').replace('{value}', v)}</p>`;
  }
  if (mrRaw === 'allow') {
    const v = String((r.membership_restriction as { allow: unknown }).allow).trim();
    html += `<p class="mb-0">${clientTranslations.get('crowdfunding_user_allow').replace('{value}', v)}</p>`;
  } else if (mrRaw === 'interdict') {
    const v = String((r.membership_restriction as { interdict: unknown }).interdict).trim();
    html += `<p class="mb-0">${clientTranslations.get('crowdfunding_user_interdict').replace('{value}', v)}</p>`;
  }
  if (ulRaw || mrRaw) {
    html += `<p class="mb-0 small text-muted">${clientTranslations.get('crowdfunding_allow_priority_note')}</p>`;
  }
  html += `</div>`;
  return html;
}

function generateCrowdfundingModalContent(activity: CrowdfundingActivity, locale: string): void {
  const activityName = getCrowdfundingDisplayName(activity, locale);
  const description =
    activity.translations?.find((t) => t.language_code === locale)?.description ||
    activity.description ||
    '';

  let infoHtml = '';
  infoHtml += `<div class="mb-3">`;
  infoHtml += `<p class="mb-2"><strong>${clientTranslations.get('crowdfunding_activity_name')}</strong>${activityName}</p>`;
  if (description) {
    infoHtml += `<p class="mb-2"><strong>${clientTranslations.get('crowdfunding_activity_description')}</strong>${description}</p>`;
  }
  infoHtml += `</div>`;

  infoHtml += `<div class="mb-3">`;
  infoHtml += `<p class="mb-1"><strong>${clientTranslations.get('crowdfunding_funding_config')}</strong></p>`;
  if (guestHidesProductPrices()) {
    infoHtml += `<p class="mb-0 text-muted">${clientTranslations.get('price_login_to_view' as any)}</p>`;
    infoHtml += `<p class="mb-0 small">${clientTranslations.get('crowdfunding_progress_percentage').replace('{percentage}', activity.statistics.progress_percentage.toFixed(2))}</p>`;
  } else {
    infoHtml += `<p class="mb-0">${clientTranslations.get('crowdfunding_target_amount').replace('{targetAmount}', activity.funding_config.target_amount.toString())}</p>`;
    infoHtml += `<p class="mb-0">${clientTranslations.get('crowdfunding_current_amount').replace('{currentAmount}', activity.funding_config.current_amount.toString())}</p>`;
    infoHtml += `<p class="mb-0">${clientTranslations.get('crowdfunding_progress_percentage').replace('{percentage}', activity.statistics.progress_percentage.toFixed(2))}</p>`;
    infoHtml += `<p class="mb-0">${clientTranslations.get('crowdfunding_min_support_amount').replace('{minAmount}', activity.funding_config.min_support_amount.toString())}</p>`;
  }
  infoHtml += `</div>`;

  infoHtml += `<div class="mb-3">`;
  infoHtml += `<p class="mb-1"><strong>${clientTranslations.get('crowdfunding_statistics')}</strong></p>`;
  infoHtml += `<p class="mb-0">${clientTranslations.get('crowdfunding_supporter_count').replace('{supporterCount}', activity.statistics.supporter_count.toString())}</p>`;
  infoHtml += `</div>`;

  infoHtml += `<div class="mb-3">`;
  infoHtml += `<p class="mb-1"><strong>${clientTranslations.get('crowdfunding_time_config')}</strong></p>`;
  const startTime = new Date(activity.time_config.start_time).toLocaleString(locale);
  const endTime = new Date(activity.time_config.end_time).toLocaleString(locale);
  infoHtml += `<p class="mb-0">${clientTranslations.get('crowdfunding_start_time').replace('{startTime}', startTime)}</p>`;
  infoHtml += `<p class="mb-0">${clientTranslations.get('crowdfunding_end_time').replace('{endTime}', endTime)}</p>`;
  infoHtml += `</div>`;

  infoHtml += appendCrowdfundingRestrictionsHtml(activity);

  const infoContent = document.getElementById('crowdfunding-info-content');
  if (infoContent) {
    infoContent.innerHTML = infoHtml;
  }

  let updatesHtml = '';
  if (activity.updates && Array.isArray(activity.updates)) {
    const activeUpdates = activity.updates.filter((u) => u.status === 'active' && u.is_public);
    if (activeUpdates.length === 0) {
      updatesHtml = `<p class="text-muted">${clientTranslations.get('crowdfunding_no_updates')}</p>`;
    } else {
      activeUpdates.forEach((update) => {
        const updateTitle =
          update.translations?.find((t) => t.language_code === locale)?.update_title || update.update_title;
        const updateContent =
          update.translations?.find((t) => t.language_code === locale)?.update_content || update.update_content;
        const updateDate = new Date(update.created_at).toLocaleDateString(locale);
        updatesHtml += `<div class="mb-3 pb-3 border-bottom">`;
        updatesHtml += `<h5>${updateTitle}</h5>`;
        updatesHtml += `<p class="text-muted small">${updateDate}</p>`;
        updatesHtml += `<div>${updateContent}</div>`;
        updatesHtml += `</div>`;
      });
    }
  } else {
    updatesHtml = `<p class="text-muted">${clientTranslations.get('crowdfunding_no_updates')}</p>`;
  }
  const updatesContent = document.getElementById('crowdfunding-updates-content');
  if (updatesContent) {
    updatesContent.innerHTML = updatesHtml;
  }

  let faqsHtml = '';
  if (activity.faqs && Array.isArray(activity.faqs)) {
    const activeFaqs = activity.faqs.filter((f) => f.status === 'active');
    if (activeFaqs.length === 0) {
      faqsHtml = `<p class="text-muted">${clientTranslations.get('crowdfunding_no_faqs')}</p>`;
    } else {
      activeFaqs.forEach((faq) => {
        const question =
          faq.translations?.find((t) => t.language_code === locale)?.question || faq.question;
        const answer = faq.translations?.find((t) => t.language_code === locale)?.answer || faq.answer;
        faqsHtml += `<div class="mb-3">`;
        faqsHtml += `<h6>${question}</h6>`;
        faqsHtml += `<p class="mb-0">${answer}</p>`;
        faqsHtml += `</div>`;
      });
    }
  } else {
    faqsHtml = `<p class="text-muted">${clientTranslations.get('crowdfunding_no_faqs')}</p>`;
  }
  const faqsContent = document.getElementById('crowdfunding-faqs-content');
  if (faqsContent) {
    faqsContent.innerHTML = faqsHtml;
  }
}

function bindCrowdfundingModalCloseEvents(): void {
  const modal = document.getElementById('crowdfunding-modal');
  const overlay = document.getElementById('crowdfunding-modal-overlay');
  const closeBtn = document.getElementById('crowdfunding-modal-close');

  const closeModal = () => {
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (overlay) overlay.onclick = closeModal;
}

export function createShopCrowdfunding(ctx: ShopCrowdfundingContext): ShopCrowdfundingController {
  function openCrowdfundingModal(activity: CrowdfundingActivity, locale: string): void {
    const modal = document.getElementById('crowdfunding-modal');
    const overlay = document.getElementById('crowdfunding-modal-overlay');
    const modalTitle = document.getElementById('crowdfunding-modal-title');

    if (!modal || !overlay || !modalTitle) return;

    modalTitle.textContent = clientTranslations.get('crowdfunding_modal_title');

    const infoTab = document.getElementById('crowdfunding-info-tab');
    const updatesTab = document.getElementById('crowdfunding-updates-tab');
    const faqsTab = document.getElementById('crowdfunding-faqs-tab');

    if (infoTab) infoTab.textContent = clientTranslations.get('crowdfunding_tab_info');
    if (updatesTab) updatesTab.textContent = clientTranslations.get('crowdfunding_tab_updates');
    if (faqsTab) faqsTab.textContent = clientTranslations.get('crowdfunding_tab_faqs');

    generateCrowdfundingModalContent(activity, locale);

    modal.style.display = 'block';
    overlay.style.display = 'block';
    bindCrowdfundingModalCloseEvents();
  }

  function renderCrowdfundingDeliveryTime(): void {
    const reward = ctx.getMatchedReward();
    if (!reward || !reward.estimated_delivery_time) return;

    const deliveryTimeElement = document.getElementById('crowdfunding-delivery-time');
    if (!deliveryTimeElement) return;

    const deliveryTime = new Date(reward.estimated_delivery_time);
    const locale = ctx.getLocale();
    const formattedTime = deliveryTime.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    deliveryTimeElement.className = 'crowdfunding-delivery-banner border rounded-3 px-3 py-2 bg-white border-success border-opacity-25';
    deliveryTimeElement.innerHTML = `
        <p class="mb-0 small">
          <i class="fa fa-truck text-success me-2" aria-hidden="true"></i>
          <strong class="text-body">${clientTranslations.get('crowdfunding_estimated_delivery_time').replace('{deliveryTime}', formattedTime)}</strong>
        </p>
      `;
    deliveryTimeElement.style.display = 'block';
  }

  function renderCrowdfundingList(crowdfundingData: CrowdfundingData, locale: string): void {
    console.log('=== 渲染众筹列表 ===');
    const crowdfundingListContainer = document.getElementById('crowdfunding-list');
    if (!crowdfundingListContainer) {
      console.error('众筹列表容器未找到 (id="crowdfunding-list")');
      return;
    }

    const activities = crowdfundingData.data.crowdfunding || [];
    const viewer = ctx.getDiscountViewerContext();
    const activeActivities = activities.filter(
      (a) => a.status === 'active' && matchesCrowdfundingUserRestrictions(a, viewer)
    );

    let shouldRefreshPriceAfterRestrictions = false;
    const selected = ctx.getSelectedActivity();
    if (selected && !activeActivities.some((a) => a.id === selected.id)) {
      ctx.setSelectedActivity(null);
      ctx.setMatchedReward(null);
      shouldRefreshPriceAfterRestrictions = true;
    }

    if (activeActivities.length === 0) {
      crowdfundingListContainer.style.display = 'none';
      if (shouldRefreshPriceAfterRestrictions) {
        hideCrowdfundingDeliveryTime();
        ctx.updatePriceAndStock(ctx.getCurrentVariant());
      }
      return;
    }

    if (shouldRefreshPriceAfterRestrictions) {
      hideCrowdfundingDeliveryTime();
      ctx.updatePriceAndStock(ctx.getCurrentVariant());
    }

    crowdfundingListContainer.style.display = 'block';
    crowdfundingListContainer.innerHTML = '';

    const shell = document.createElement('div');
    shell.className = 'crowdfunding-section-card border rounded-3 p-3 p-md-4 bg-light';

    const headerRow = document.createElement('div');
    headerRow.className =
      'd-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-secondary border-opacity-25';
    headerRow.innerHTML = `
      <span class="crowdfunding-section-icon d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" aria-hidden="true">
        <i class="fa fa-bullhorn"></i>
      </span>
      <div class="flex-grow-1 min-w-0">
        <h3 class="crowdfunding-section-title h6 mb-0 fw-semibold text-body">${escapeHtml(clientTranslations.get('crowdfunding_activities'))}</h3>
        <p class="crowdfunding-section-hint small text-muted mb-0 mt-1">${escapeHtml(clientTranslations.get('crowdfunding_card_select_hint'))}</p>
      </div>
    `;
    shell.appendChild(headerRow);

    const listContainer = document.createElement('div');
    listContainer.className = 'd-flex flex-column gap-3';

    const normalWrap = document.createElement('div');
    normalWrap.className =
      'crowdfunding-option-normal border rounded-3 p-3 bg-white d-flex align-items-start gap-3 shadow-sm';
    const normalPurchaseInput = document.createElement('input');
    normalPurchaseInput.type = 'radio';
    normalPurchaseInput.name = 'crowdfunding-activity';
    normalPurchaseInput.className = 'form-check-input flex-shrink-0 mt-1';
    normalPurchaseInput.id = 'crowdfunding-none';
    normalPurchaseInput.value = 'none';

    if (!ctx.getSelectedActivity()) {
      normalPurchaseInput.checked = true;
    }

    normalPurchaseInput.addEventListener('change', () => {
      if (normalPurchaseInput.checked) {
        ctx.setSelectedActivity(null);
        ctx.setMatchedReward(null);
        hideCrowdfundingDeliveryTime();
        ctx.updatePriceAndStock(ctx.getCurrentVariant());
      }
    });

    const normalBody = document.createElement('div');
    normalBody.className = 'flex-grow-1 min-w-0';
    const normalLabel = document.createElement('label');
    normalLabel.className = 'mb-0 w-100';
    normalLabel.htmlFor = normalPurchaseInput.id;
    normalLabel.innerHTML = `<span class="fw-semibold text-body">${escapeHtml(clientTranslations.get('group_buying_normal_purchase'))}</span>`;
    normalBody.appendChild(normalLabel);

    normalWrap.appendChild(normalPurchaseInput);
    normalWrap.appendChild(normalBody);
    listContainer.appendChild(normalWrap);

    activeActivities.forEach((activity) => {
      const activityName = getCrowdfundingDisplayName(activity, locale);
      const pct = getCrowdfundingProgressPercent(activity);
      const currentAmt = activity.funding_config?.current_amount ?? 0;
      const targetAmt = activity.funding_config?.target_amount ?? 0;
      const moneyLine = guestHidesProductPrices()
        ? clientTranslations.get('price_login_to_view' as any)
        : clientTranslations
            .get('crowdfunding_card_money_line')
            .replace('{current}', formatFundingAmount(currentAmt, locale))
            .replace('{target}', formatFundingAmount(targetAmt, locale));
      const endDate = new Date(activity.time_config.end_time).toLocaleDateString(locale.replace('_', '-'), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const endBadge = clientTranslations.get('crowdfunding_card_end_badge').replace('{date}', endDate);
      const supporters = clientTranslations
        .get('crowdfunding_supporter_count')
        .replace('{supporterCount}', String(activity.statistics?.supporter_count ?? 0));
      const progressLabel = clientTranslations.get('crowdfunding_ui_progress_label');
      const viewDetailsText = clientTranslations.get('crowdfunding_view_details');

      const card = document.createElement('div');
      card.className =
        'crowdfunding-activity-card card border-0 shadow-sm overflow-hidden bg-white';

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body p-3 p-md-4';

      const row = document.createElement('div');
      row.className = 'd-flex align-items-start gap-3';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'crowdfunding-activity';
      input.className = 'form-check-input flex-shrink-0 mt-2';
      input.id = `crowdfunding-${activity.id}`;
      input.value = activity.id;
      input.setAttribute('aria-describedby', `crowdfunding-desc-${activity.id}`);

      if (ctx.getSelectedActivity()?.id === activity.id) {
        input.checked = true;
      }

      input.addEventListener('change', () => {
        if (input.checked) {
          ctx.setSelectedActivity(activity);
          matchCrowdfundingRewardAndUpdate();
        }
      });

      const main = document.createElement('div');
      main.className = 'flex-grow-1 min-w-0';
      main.id = `crowdfunding-desc-${activity.id}`;

      const topRow = document.createElement('div');
      topRow.className = 'd-flex flex-wrap justify-content-between align-items-start gap-2 mb-2';
      const titleEl = document.createElement('div');
      titleEl.className = 'fw-semibold text-body pe-2';
      titleEl.textContent = activityName;
      const detailBtn = document.createElement('a');
      detailBtn.href = '#';
      detailBtn.className = 'btn btn-sm btn-outline-secondary flex-shrink-0 view-crowdfunding-detail';
      detailBtn.textContent = viewDetailsText;
      detailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCrowdfundingModal(activity, locale);
      });
      topRow.appendChild(titleEl);
      topRow.appendChild(detailBtn);

      const metaRow = document.createElement('div');
      metaRow.className = 'd-flex flex-wrap align-items-center gap-2 mb-2 small';
      const endSpan = document.createElement('span');
      endSpan.className = 'badge rounded-pill crowdfunding-end-badge';
      endSpan.textContent = endBadge;
      const moneySpan = document.createElement('span');
      moneySpan.className = 'text-muted';
      moneySpan.textContent = moneyLine;
      metaRow.appendChild(endSpan);
      metaRow.appendChild(moneySpan);

      const progWrap = document.createElement('div');
      progWrap.className = 'mb-1';
      const progLabel = document.createElement('div');
      progLabel.className = 'd-flex justify-content-between align-items-center small mb-1';
      const pl = document.createElement('span');
      pl.className = 'text-muted';
      pl.textContent = progressLabel;
      const pr = document.createElement('span');
      pr.className = 'fw-semibold crowdfunding-pct-text';
      pr.textContent = `${pct.toFixed(1)}%`;
      progLabel.appendChild(pl);
      progLabel.appendChild(pr);

      const progress = document.createElement('div');
      progress.className = 'progress crowdfunding-progress';
      progress.style.height = '10px';
      progress.setAttribute('role', 'progressbar');
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', '100');
      progress.setAttribute('aria-valuenow', String(Math.round(pct)));
      progress.setAttribute('aria-label', `${progressLabel} ${pct.toFixed(1)}%`);

      const bar = document.createElement('div');
      bar.className = 'progress-bar crowdfunding-progress-fill';
      bar.style.width = `${pct}%`;

      progress.appendChild(bar);
      progWrap.appendChild(progLabel);
      progWrap.appendChild(progress);

      const foot = document.createElement('div');
      foot.className = 'small text-muted mt-2 d-flex align-items-center gap-2';
      const footIcon = document.createElement('i');
      footIcon.className = 'fa fa-users';
      footIcon.setAttribute('aria-hidden', 'true');
      const footSpan = document.createElement('span');
      footSpan.textContent = supporters;
      foot.appendChild(footIcon);
      foot.appendChild(footSpan);

      main.appendChild(topRow);
      main.appendChild(metaRow);
      main.appendChild(progWrap);
      main.appendChild(foot);

      row.appendChild(input);
      row.appendChild(main);
      cardBody.appendChild(row);
      card.appendChild(cardBody);

      listContainer.appendChild(card);
    });

    shell.appendChild(listContainer);
    crowdfundingListContainer.appendChild(shell);

    bindCrowdfundingCardSelectionHighlight(crowdfundingListContainer);
  }

  function matchCrowdfundingRewardAndUpdate(): void {
    const gpd = ctx.getGlobalProductData();
    const selected = ctx.getSelectedActivity();
    if (!gpd || !selected) return;

    if (!matchesCrowdfundingUserRestrictions(selected, ctx.getDiscountViewerContext())) {
      ctx.setSelectedActivity(null);
      ctx.setMatchedReward(null);
      hideCrowdfundingDeliveryTime();
      ctx.updatePriceAndStock(ctx.getCurrentVariant());
      return;
    }

    const variant = ctx.getCurrentVariant();
    if (!variant) {
      hideCrowdfundingDeliveryTime();
      return;
    }

    const matchedReward =
      selected.rewards.find((reward) => reward.variant_id === variant.id && reward.status === 'active') ||
      null;

    ctx.setMatchedReward(matchedReward);

    if (matchedReward) {
      updatePriceAndStockWithCrowdfunding();
      renderCrowdfundingDeliveryTime();
    } else {
      hideCrowdfundingDeliveryTime();
      if (ctx.getCurrentVariant() && ctx.getGlobalProductData()) {
        const v = ctx.getCurrentVariant()!;
        ctx.updatePriceWithVariant(v, gpd.discountRules, gpd.config as Record<string, unknown>);
        ctx.updateStockWithVariant(v);
      }
    }
  }

  function updatePriceAndStockWithCrowdfunding(): void {
    const gpd = ctx.getGlobalProductData();
    const selected = ctx.getSelectedActivity();
    const reward = ctx.getMatchedReward();
    if (!gpd || !selected || !reward) return;

    if (!matchesCrowdfundingUserRestrictions(selected, ctx.getDiscountViewerContext())) {
      ctx.setSelectedActivity(null);
      ctx.setMatchedReward(null);
      hideCrowdfundingDeliveryTime();
      ctx.updatePriceAndStock(ctx.getCurrentVariant());
      return;
    }

    const { discountRules, config } = gpd;
    const quantity = ctx.getCurrentQuantity();
    const basePrice = reward.crowdfunding_price || 0;
    const convertedPrice = clientPricing.convertCurrency(basePrice, config.exchangeRate);

    const discountResult = clientPricing.applyDiscountWithDetails(
      convertedPrice,
      quantity,
      discountRules.data.discounts,
      ctx.getDiscountViewerContext()
    );

    const finalPrice = discountResult.finalPrice;
    ctx.setCurrentDiscountedPrice(finalPrice);
    ctx.setCurrentPriceInfo({
      originalPrice: convertedPrice,
      discountedPrice: finalPrice,
      discountAmount: discountResult.discountAmount,
      discountResult,
    });

    ctx.renderPriceDisplay(convertedPrice, finalPrice, discountResult.discountAmount > 0, config.currentCurrency);

    const v = ctx.getCurrentVariant();
    if (v) ctx.updateStockWithVariant(v);

    if (ctx.getSelectedAddress() && ctx.getGlobalProductData()) {
      ctx.calculateShippingAndTax();
    }
  }

  return {
    getCrowdfundingDisplayName,
    renderCrowdfundingList,
    matchCrowdfundingRewardAndUpdate,
    updatePriceAndStockWithCrowdfunding,
    openCrowdfundingModal,
  };
}
