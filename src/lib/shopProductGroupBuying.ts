/**
 * 产品单页：团购列表、详情弹窗、团购价与库存展示（由 ShopProductRuntime 注入宿主上下文）
 */

import type { GroupBuyingData, GroupBuyingActivity, Variant, DiscountRulesData } from './product';
import type { DiscountViewerContext, DiscountResult } from './pricing';
import { clientPricing, matchesGroupBuyingUserRestrictions } from './pricing';
import { clientTranslations } from './translations';
import { isUnregisteredPriceUiHidden } from './globalDiscountPrice';

function guestHidesProductPrices(): boolean {
  const tid = typeof window !== 'undefined' ? String((window as any).__ASTRO_TENANT_ID__ || '') : '';
  return isUnregisteredPriceUiHidden(tid);
}

export interface ShopGroupBuyingGlobalProductData {
  discountRules: DiscountRulesData;
  config: {
    exchangeRate: number;
    currentCurrency: unknown;
  };
}

export interface ShopGroupBuyingCurrentPriceInfo {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountResult: DiscountResult;
}

/** 宿主页面通过 getter/setter 注入的状态与 UI 回调 */
export interface ShopGroupBuyingContext {
  getSelected: () => GroupBuyingActivity | null;
  setSelected: (activity: GroupBuyingActivity | null) => void;
  getGlobalProductData: () => ShopGroupBuyingGlobalProductData | null;
  getCurrentVariant: () => Variant | null;
  getDiscountViewerContext: () => DiscountViewerContext;
  getCurrentQuantity: () => number;
  updatePriceAndStock: (variant: Variant | null) => void;
  renderPriceDisplay: (
    originalPrice: number,
    discountedPrice: number,
    hasDiscount: boolean,
    currency: unknown
  ) => void;
  setCurrentDiscountedPrice: (n: number) => void;
  setCurrentPriceInfo: (info: ShopGroupBuyingCurrentPriceInfo) => void;
  getSelectedAddress: () => unknown | null;
  calculateShippingAndTax: () => void;
}

export interface ShopGroupBuyingController {
  getGroupBuyingDisplayName: (activity: GroupBuyingActivity, locale: string) => string;
  openGroupBuyingModal: (activity: GroupBuyingActivity, locale: string) => void;
  renderGroupBuyingList: (groupBuyingData: GroupBuyingData, locale: string) => void;
  updatePriceAndStockWithGroupBuying: () => void;
}

function getGroupBuyingDisplayName(activity: GroupBuyingActivity, locale: string): string {
  if (activity.translations && activity.translations.length > 0) {
    const translation = activity.translations.find((t) => t.language_code === locale);
    const t = translation as unknown as { activity_name?: string };
    if (translation && t.activity_name) {
      return t.activity_name;
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

function formatAmount(n: number, locale: string): string {
  return Number(n).toLocaleString(locale.replace('_', '-'), { maximumFractionDigits: 2 });
}

/** 当前参团人数相对最低成团人数的进度（0–100） */
function getGroupFormationProgress(activity: GroupBuyingActivity): number {
  const min = activity.group_config?.min_group_size ?? 1;
  const cur = activity.statistics?.current_participants ?? 0;
  if (min <= 0) return 100;
  return Math.min(100, Math.max(0, (cur / min) * 100));
}

/** 有总库存时返回可用占比；无限库存返回 null */
function getInventoryProgressPercent(activity: GroupBuyingActivity): number | null {
  const total = activity.inventory_config?.total_inventory;
  if (total === null || total === undefined || total <= 0) return null;
  const avail = activity.inventory_config?.available_inventory ?? 0;
  return Math.min(100, Math.max(0, (avail / total) * 100));
}

function bindGroupBuyingCardSelectionHighlight(root: HTMLElement): void {
  const radios = root.querySelectorAll<HTMLInputElement>('input[name="group-buying-activity"]');
  const sync = () => {
    radios.forEach((r) => {
      const card = r.closest('.group-buying-activity-card, .group-buying-option-normal');
      if (card) {
        card.classList.toggle('group-buying-card--selected', r.checked);
      }
    });
  };
  radios.forEach((r) => r.addEventListener('change', sync));
  sync();
}

function generateGroupBuyingModalContent(activity: GroupBuyingActivity, locale: string): string {
  let html = '';

  const activityName = getGroupBuyingDisplayName(activity, locale);
  const description =
    activity.translations?.find((t) => t.language_code === locale)?.description ||
    activity.description ||
    '';

  html += `<div class="mb-3">`;
  html += `<p class="mb-2"><strong>${clientTranslations.get('group_buying_activity_name')}</strong>${activityName}</p>`;
  if (description) {
    html += `<p class="mb-2"><strong>${clientTranslations.get('group_buying_activity_description')}</strong>${description}</p>`;
  }
  html += `<p class="mb-2"><strong>${clientTranslations.get('group_buying_activity_code')}</strong>${activity.activity_code || ''}</p>`;
  html += `</div>`;

  html += `<div class="mb-3">`;
  html += `<p class="mb-1"><strong>${clientTranslations.get('group_buying_group_config')}</strong></p>`;
  html += `<p class="mb-0">${clientTranslations.get('group_buying_group_size').replace('{groupSize}', activity.group_config.group_size.toString())}</p>`;
  html += `<p class="mb-0">${clientTranslations.get('group_buying_min_group_size').replace('{minGroupSize}', activity.group_config.min_group_size.toString())}</p>`;
  if (activity.group_config.max_group_size) {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_max_group_size').replace('{maxGroupSize}', activity.group_config.max_group_size.toString())}</p>`;
  }
  html += `</div>`;

  html += `<div class="mb-3">`;
  html += `<p class="mb-1"><strong>${clientTranslations.get('group_buying_price_config')}</strong></p>`;
  if (guestHidesProductPrices()) {
    html += `<p class="mb-0 text-muted">${clientTranslations.get('price_login_to_view' as any)}</p>`;
  } else {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_original_price').replace('{originalPrice}', activity.price_config.original_price.toString())}</p>`;
    html += `<p class="mb-0">${clientTranslations.get('group_buying_group_price').replace('{groupPrice}', activity.price_config.group_price.toString())}</p>`;
  }
  html += `</div>`;

  html += `<div class="mb-3">`;
  html += `<p class="mb-1"><strong>${clientTranslations.get('group_buying_inventory_config')}</strong></p>`;
  if (activity.inventory_config.total_inventory !== null && activity.inventory_config.total_inventory !== undefined) {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_total_inventory').replace('{totalInventory}', activity.inventory_config.total_inventory.toString())}</p>`;
  } else {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_total_inventory').replace('{totalInventory}', '∞')}</p>`;
  }
  if (activity.inventory_config.reserved_inventory !== null && activity.inventory_config.reserved_inventory !== undefined) {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_reserved_inventory').replace('{reservedInventory}', activity.inventory_config.reserved_inventory.toString())}</p>`;
  } else {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_reserved_inventory').replace('{reservedInventory}', '0')}</p>`;
  }
  if (activity.inventory_config.available_inventory !== null && activity.inventory_config.available_inventory !== undefined) {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_available_inventory').replace('{availableInventory}', activity.inventory_config.available_inventory.toString())}</p>`;
  } else {
    if (activity.inventory_config.total_inventory === null || activity.inventory_config.total_inventory === undefined) {
      html += `<p class="mb-0">${clientTranslations.get('group_buying_available_inventory').replace('{availableInventory}', '∞')}</p>`;
    } else {
      html += `<p class="mb-0">${clientTranslations.get('group_buying_available_inventory').replace('{availableInventory}', '0')}</p>`;
    }
  }
  html += `</div>`;

  html += `<div class="mb-3">`;
  html += `<p class="mb-1"><strong>${clientTranslations.get('group_buying_time_config')}</strong></p>`;
  const startTime = new Date(activity.time_config.start_time).toLocaleString(locale);
  const endTime = new Date(activity.time_config.end_time).toLocaleString(locale);
  html += `<p class="mb-0">${clientTranslations.get('group_buying_start_time').replace('{startTime}', startTime)}</p>`;
  html += `<p class="mb-0">${clientTranslations.get('group_buying_end_time').replace('{endTime}', endTime)}</p>`;
  if (activity.time_config.auto_close_hours) {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_auto_close_hours').replace('{autoCloseHours}', activity.time_config.auto_close_hours.toString())}</p>`;
  }
  html += `</div>`;

  html += `<div class="mb-3">`;
  html += `<p class="mb-1"><strong>${clientTranslations.get('group_buying_statistics')}</strong></p>`;
  html += `<p class="mb-0">${clientTranslations.get('group_buying_current_participants').replace('{currentParticipants}', activity.statistics.current_participants.toString())}</p>`;
  html += `<p class="mb-0">${clientTranslations.get('group_buying_successful_groups').replace('{successfulGroups}', activity.statistics.successful_groups.toString())}</p>`;
  if (!guestHidesProductPrices()) {
    html += `<p class="mb-0">${clientTranslations.get('group_buying_total_sales').replace('{totalSales}', activity.statistics.total_sales.toString())}</p>`;
  }
  html += `</div>`;

  if (activity.restrictions?.per_user_limit) {
    html += `<div class="mb-3">`;
    html += `<p class="mb-0"><strong>${clientTranslations.get('group_buying_restrictions')}</strong></p>`;
    html += `<p class="mb-0">${clientTranslations.get('group_buying_per_user_limit').replace('{perUserLimit}', activity.restrictions.per_user_limit.toString())}</p>`;
    html += `</div>`;
  }

  return html;
}

function bindGroupBuyingModalCloseEvents(): void {
  const modal = document.getElementById('group-buying-modal');
  const overlay = document.getElementById('group-buying-modal-overlay');
  const closeBtn = document.getElementById('group-buying-modal-close');

  const closeModal = () => {
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (overlay) overlay.onclick = closeModal;
}

export function createShopGroupBuying(ctx: ShopGroupBuyingContext): ShopGroupBuyingController {
  function openGroupBuyingModal(activity: GroupBuyingActivity, locale: string): void {
    const modal = document.getElementById('group-buying-modal');
    const overlay = document.getElementById('group-buying-modal-overlay');
    const modalTitle = document.getElementById('group-buying-modal-title');
    const modalContent = document.getElementById('group-buying-modal-content');

    if (!modal || !overlay || !modalTitle || !modalContent) return;

    modalTitle.textContent = clientTranslations.get('group_buying_modal_title');
    modalContent.innerHTML = generateGroupBuyingModalContent(activity, locale);
    modal.style.display = 'block';
    overlay.style.display = 'block';
    bindGroupBuyingModalCloseEvents();
  }

  function renderGroupBuyingList(groupBuyingData: GroupBuyingData, locale: string): void {
    const groupBuyingListContainer = document.getElementById('group-buying-list');
    if (!groupBuyingListContainer) return;

    const activities = groupBuyingData.data.group_buying || [];
    const viewer = ctx.getDiscountViewerContext();
    const activeActivities = activities.filter(
      (a) => a.status === 'active' && matchesGroupBuyingUserRestrictions(a, viewer)
    );

    let shouldRefreshPriceAfterGroupRestrictions = false;
    const selected = ctx.getSelected();
    if (selected && !activeActivities.some((a) => a.id === selected.id)) {
      ctx.setSelected(null);
      shouldRefreshPriceAfterGroupRestrictions = true;
    }

    if (activeActivities.length === 0) {
      groupBuyingListContainer.style.display = 'none';
      if (shouldRefreshPriceAfterGroupRestrictions) {
        ctx.updatePriceAndStock(ctx.getCurrentVariant());
      }
      return;
    }

    if (shouldRefreshPriceAfterGroupRestrictions) {
      ctx.updatePriceAndStock(ctx.getCurrentVariant());
    }

    groupBuyingListContainer.style.display = 'block';
    groupBuyingListContainer.innerHTML = '';

    const shell = document.createElement('div');
    shell.className = 'group-buying-section-card border rounded-3 p-3 p-md-4 bg-light';

    const headerRow = document.createElement('div');
    headerRow.className =
      'd-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-secondary border-opacity-25';
    headerRow.innerHTML = `
      <span class="group-buying-section-icon d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" aria-hidden="true">
        <i class="fa fa-users"></i>
      </span>
      <div class="flex-grow-1 min-w-0">
        <h3 class="group-buying-section-title h6 mb-0 fw-semibold text-body">${escapeHtml(clientTranslations.get('group_buying_activities'))}</h3>
        <p class="group-buying-section-hint small text-muted mb-0 mt-1">${escapeHtml(clientTranslations.get('group_buying_card_hint'))}</p>
      </div>
    `;
    shell.appendChild(headerRow);

    const listContainer = document.createElement('div');
    listContainer.className = 'd-flex flex-column gap-3';

    const normalWrap = document.createElement('div');
    normalWrap.className =
      'group-buying-option-normal border rounded-3 p-3 bg-white d-flex align-items-start gap-3 shadow-sm';

    const normalPurchaseInput = document.createElement('input');
    normalPurchaseInput.type = 'radio';
    normalPurchaseInput.name = 'group-buying-activity';
    normalPurchaseInput.className = 'form-check-input flex-shrink-0 mt-1';
    normalPurchaseInput.id = 'group-buying-none';
    normalPurchaseInput.value = 'none';

    if (!ctx.getSelected()) {
      normalPurchaseInput.checked = true;
    }

    normalPurchaseInput.addEventListener('change', () => {
      if (normalPurchaseInput.checked) {
        ctx.setSelected(null);
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

    const localeTag = locale.replace('_', '-');
    const viewDetailsText = clientTranslations.get('group_buying_view_details');

    activeActivities.forEach((activity) => {
      const activityName = getGroupBuyingDisplayName(activity, locale);
      const minGroupSize = activity.group_config.min_group_size;
      const origPrice = activity.price_config.original_price;
      const groupPrice = activity.price_config.group_price;
      const formationPct = getGroupFormationProgress(activity);
      const curP = activity.statistics?.current_participants ?? 0;
      const invPct = getInventoryProgressPercent(activity);

      let savePct: number | null = null;
      if (origPrice > 0 && groupPrice < origPrice) {
        savePct = Math.round((1 - groupPrice / origPrice) * 100);
      }

      const priceLine = guestHidesProductPrices()
        ? clientTranslations.get('price_login_to_view' as any)
        : clientTranslations
            .get('group_buying_price_line')
            .replace('{original}', formatAmount(origPrice, locale))
            .replace('{group}', formatAmount(groupPrice, locale));

      const endDate = new Date(activity.time_config.end_time).toLocaleDateString(localeTag, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const endBadge = clientTranslations.get('group_buying_card_end_badge').replace('{date}', endDate);
      const minParticipantsText = clientTranslations
        .get('group_buying_min_participants')
        .replace('{minGroupSize}', minGroupSize.toString());

      const formationCount = clientTranslations
        .get('group_buying_card_formation_count')
        .replace('{current}', String(curP))
        .replace('{min}', String(minGroupSize));

      const formationLabel = clientTranslations.get('group_buying_ui_formation_progress');
      const stockLabel = clientTranslations.get('group_buying_ui_stock_progress');

      const card = document.createElement('div');
      card.className = 'group-buying-activity-card card border-0 shadow-sm overflow-hidden bg-white';

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body p-3 p-md-4';

      const row = document.createElement('div');
      row.className = 'd-flex align-items-start gap-3';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'group-buying-activity';
      input.className = 'form-check-input flex-shrink-0 mt-2';
      input.id = `group-buying-${activity.id}`;
      input.value = activity.id;
      input.setAttribute('aria-describedby', `group-buying-desc-${activity.id}`);

      if (ctx.getSelected()?.id === activity.id) {
        input.checked = true;
      }

      input.addEventListener('change', () => {
        if (input.checked) {
          ctx.setSelected(activity);
          updatePriceAndStockWithGroupBuying();
        }
      });

      const main = document.createElement('div');
      main.className = 'flex-grow-1 min-w-0';
      main.id = `group-buying-desc-${activity.id}`;

      const topRow = document.createElement('div');
      topRow.className = 'd-flex flex-wrap justify-content-between align-items-start gap-2 mb-2';
      const titleEl = document.createElement('div');
      titleEl.className = 'fw-semibold text-body pe-2';
      titleEl.textContent = activityName;
      const detailBtn = document.createElement('a');
      detailBtn.href = '#';
      detailBtn.className = 'btn btn-sm btn-outline-danger flex-shrink-0 view-group-buying-detail';
      detailBtn.dataset.activityId = activity.id;
      detailBtn.textContent = viewDetailsText;
      detailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openGroupBuyingModal(activity, locale);
      });
      topRow.appendChild(titleEl);
      topRow.appendChild(detailBtn);

      const priceRow = document.createElement('div');
      priceRow.className = 'd-flex flex-wrap align-items-center gap-2 mb-2';
      const priceText = document.createElement('span');
      priceText.className = 'small text-body';
      priceText.textContent = priceLine;
      priceRow.appendChild(priceText);
      if (!guestHidesProductPrices() && savePct !== null && savePct > 0) {
        const saveBadge = document.createElement('span');
        saveBadge.className = 'badge rounded-pill group-buying-save-badge';
        saveBadge.textContent = clientTranslations.get('group_buying_card_save_pct').replace('{pct}', String(savePct));
        priceRow.appendChild(saveBadge);
      }

      const metaRow = document.createElement('div');
      metaRow.className = 'd-flex flex-wrap align-items-center gap-2 mb-2 small';
      const endSpan = document.createElement('span');
      endSpan.className = 'badge rounded-pill group-buying-end-badge';
      endSpan.textContent = endBadge;
      const minSpan = document.createElement('span');
      minSpan.className = 'text-muted';
      minSpan.textContent = minParticipantsText;
      metaRow.appendChild(endSpan);
      metaRow.appendChild(minSpan);

      const progFormation = document.createElement('div');
      progFormation.className = 'mb-2';
      const progLabelF = document.createElement('div');
      progLabelF.className = 'd-flex justify-content-between align-items-center small mb-1';
      const plF = document.createElement('span');
      plF.className = 'text-muted';
      plF.textContent = formationLabel;
      const prF = document.createElement('span');
      prF.className = 'fw-semibold group-buying-pct-text';
      prF.textContent = `${formationCount} · ${formationPct.toFixed(1)}%`;
      progLabelF.appendChild(plF);
      progLabelF.appendChild(prF);

      const progressF = document.createElement('div');
      progressF.className = 'progress group-buying-progress';
      progressF.style.height = '10px';
      progressF.setAttribute('role', 'progressbar');
      progressF.setAttribute('aria-valuemin', '0');
      progressF.setAttribute('aria-valuemax', '100');
      progressF.setAttribute('aria-valuenow', String(Math.round(formationPct)));
      const barF = document.createElement('div');
      barF.className = 'progress-bar group-buying-progress-fill';
      barF.style.width = `${formationPct}%`;
      progressF.appendChild(barF);
      progFormation.appendChild(progLabelF);
      progFormation.appendChild(progressF);

      const stockBlock = document.createElement('div');
      stockBlock.className = 'mb-1';
      if (invPct === null) {
        const stockNote = document.createElement('div');
        stockNote.className = 'small text-muted';
        stockNote.textContent = clientTranslations.get('group_buying_stock_unlimited');
        stockBlock.appendChild(stockNote);
      } else {
        const progLabelS = document.createElement('div');
        progLabelS.className = 'd-flex justify-content-between align-items-center small mb-1';
        const plS = document.createElement('span');
        plS.className = 'text-muted';
        plS.textContent = stockLabel;
        const prS = document.createElement('span');
        prS.className = 'fw-semibold group-buying-pct-text';
        prS.textContent = `${invPct.toFixed(1)}%`;
        progLabelS.appendChild(plS);
        progLabelS.appendChild(prS);

        const progressS = document.createElement('div');
        progressS.className = 'progress group-buying-progress group-buying-progress--stock';
        progressS.style.height = '8px';
        progressS.setAttribute('role', 'progressbar');
        progressS.setAttribute('aria-valuemin', '0');
        progressS.setAttribute('aria-valuemax', '100');
        progressS.setAttribute('aria-valuenow', String(Math.round(invPct)));
        const barS = document.createElement('div');
        barS.className = 'progress-bar group-buying-progress-fill group-buying-progress-fill--stock';
        barS.style.width = `${invPct}%`;
        progressS.appendChild(barS);
        stockBlock.appendChild(progLabelS);
        stockBlock.appendChild(progressS);
      }

      const foot = document.createElement('div');
      foot.className = 'small text-muted mt-2 d-flex flex-wrap align-items-center gap-2';
      const pLine = document.createElement('span');
      pLine.textContent = clientTranslations
        .get('group_buying_current_participants')
        .replace('{currentParticipants}', String(activity.statistics?.current_participants ?? 0));
      const gLine = document.createElement('span');
      gLine.textContent = clientTranslations
        .get('group_buying_successful_groups')
        .replace('{successfulGroups}', String(activity.statistics?.successful_groups ?? 0));
      foot.appendChild(pLine);
      foot.appendChild(gLine);

      main.appendChild(topRow);
      main.appendChild(priceRow);
      main.appendChild(metaRow);
      main.appendChild(progFormation);
      main.appendChild(stockBlock);
      main.appendChild(foot);

      row.appendChild(input);
      row.appendChild(main);
      cardBody.appendChild(row);
      card.appendChild(cardBody);
      listContainer.appendChild(card);
    });

    shell.appendChild(listContainer);
    groupBuyingListContainer.appendChild(shell);

    bindGroupBuyingCardSelectionHighlight(groupBuyingListContainer);
  }

  function updatePriceAndStockWithGroupBuying(): void {
    const gpd = ctx.getGlobalProductData();
    const sel = ctx.getSelected();
    if (!gpd || !sel) return;

    if (!matchesGroupBuyingUserRestrictions(sel, ctx.getDiscountViewerContext())) {
      ctx.setSelected(null);
      ctx.updatePriceAndStock(ctx.getCurrentVariant());
      return;
    }

    const { discountRules, config } = gpd;
    const quantity = ctx.getCurrentQuantity();
    const basePrice = sel.price_config.group_price || 0;
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

    const stock = sel.inventory_config.available_inventory || 0;
    const fkStock = document.querySelector('.price-rating .fk-stock-value');
    if (fkStock) fkStock.textContent = stock.toString();

    const stockElement = document.querySelector('.shop-prd-title .stock');
    const stockLabel = document.querySelector('.shop-prd-title .stock-label');
    const stockValueElement = document.querySelector('.shop-prd-title .stock-value');

    if (stockElement && stockValueElement) {
      if (stockLabel) {
        stockLabel.textContent = clientTranslations.get('stock');
      }
      stockValueElement.textContent = stock.toString();
      (stockElement as HTMLElement).style.display = 'inline';
    }

    if (ctx.getSelectedAddress() && ctx.getGlobalProductData()) {
      ctx.calculateShippingAndTax();
    }
  }

  return {
    getGroupBuyingDisplayName,
    openGroupBuyingModal,
    renderGroupBuyingList,
    updatePriceAndStockWithGroupBuying,
  };
}

