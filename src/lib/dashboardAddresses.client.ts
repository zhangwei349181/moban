/**
 * Dashboard 地址面板
 */

import { getCurrentMembershipId, getAuthTenantId } from './auth';
import { clientAddress, type Address } from './address';
import { clientProduct, type Region } from './product';
import { clientTranslations } from './translations';
import { openDashboardModal, closeDashboardModal } from './dashboardModal.client';
import { getDashboardRoot, onPanelActivate } from './dashboardPanelUtils.client';

let editingAddressId: string | null = null;
let regionsFlat: { id: string; label: string }[] = [];

function flattenRegions(regions: Region[], prefix = ''): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const r of regions) {
    const name = r.region_name || r.region_code || r.id;
    const label = prefix ? `${prefix} / ${name}` : name;
    out.push({ id: r.id, label });
    const children = (r as any).children as Region[] | undefined;
    if (Array.isArray(children) && children.length) {
      out.push(...flattenRegions(children, label));
    }
  }
  return out;
}

async function ensureRegions(root: HTMLElement) {
  if (regionsFlat.length) return;
  const select = root.querySelector('[data-dashboard-region-select]') as HTMLSelectElement | null;
  if (!select) return;
  try {
    const tenantId = getAuthTenantId();
    const data = await clientProduct.fetchRegions(tenantId || undefined);
    const regions = data.data?.regions || [];
    regionsFlat = flattenRegions(regions);
    select.innerHTML = `<option value="">${clientTranslations.get('please_select_region')}</option>`;
    regionsFlat.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.label;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

function renderAddressCard(addr: Address): string {
  const typeLabel =
    addr.address_type === 'billing'
      ? clientTranslations.get('billing_address')
      : clientTranslations.get('shipping_address');
  const defaultBadge = addr.is_default
    ? `<span class="dashboard-address-card__badge">${clientTranslations.get('default')}</span>`
    : '';
  return `
    <article class="dashboard-address-card${addr.is_default ? ' dashboard-address-card--default' : ''}" data-address-id="${addr.id}">
      ${defaultBadge}
      <h4 class="dashboard-address-card__title">${addr.address_name || typeLabel}</h4>
      <div class="dashboard-address-card__body">
        <div>${addr.recipient_name}</div>
        <div>${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}</div>
        <div>${addr.phone_number}</div>
        ${addr.postal_code ? `<div>${addr.postal_code}</div>` : ''}
      </div>
      <div class="dashboard-address-card__actions">
        <button type="button" class="dashboard-section__btn" data-dashboard-address-edit="${addr.id}">${clientTranslations.get('edit')}</button>
        <button type="button" class="dashboard-section__btn" data-dashboard-address-delete="${addr.id}">${clientTranslations.get('delete')}</button>
      </div>
    </article>
  `;
}

async function loadAddresses(root: HTMLElement) {
  const loading = root.querySelector('[data-dashboard-loading]') as HTMLElement | null;
  const error = root.querySelector('[data-dashboard-error]') as HTMLElement | null;
  const empty = root.querySelector('[data-dashboard-empty]') as HTMLElement | null;
  const list = root.querySelector('[data-dashboard-address-list]') as HTMLElement | null;

  loading?.classList.remove('dashboard-section__hidden');
  error?.classList.add('dashboard-section__hidden');
  empty?.classList.add('dashboard-section__hidden');
  if (list) list.innerHTML = '';

  try {
    const membershipId = getCurrentMembershipId();
    if (!membershipId) throw new Error(clientTranslations.get('please_login_first'));

    const res = await clientAddress.getAddresses({ membership_id: membershipId });
    const addresses = res.data?.addresses || [];
    loading?.classList.add('dashboard-section__hidden');

    if (!addresses.length) {
      empty?.classList.remove('dashboard-section__hidden');
      return;
    }

    if (list) {
      list.innerHTML = addresses.map(renderAddressCard).join('');
      bindAddressCardActions(root);
    }
  } catch (err) {
    loading?.classList.add('dashboard-section__hidden');
    if (error) {
      error.textContent = err instanceof Error ? err.message : clientTranslations.get('failed_to_load_addresses');
      error.classList.remove('dashboard-section__hidden');
    }
  }
}

function bindAddressCardActions(root: HTMLElement) {
  root.querySelectorAll('[data-dashboard-address-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.dashboardAddressEdit;
      if (id) void openAddressForm(root, id);
    });
  });
  root.querySelectorAll('[data-dashboard-address-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.dashboardAddressDelete;
      if (!id) return;
      if (!confirm(clientTranslations.get('confirm_delete_address'))) return;
      try {
        await clientAddress.deleteAddress(id);
        await loadAddresses(root);
      } catch (err) {
        alert(err instanceof Error ? err.message : clientTranslations.get('failed_to_delete_address'));
      }
    });
  });
}

function fillAddressForm(root: HTMLElement, addr?: Address) {
  (root.querySelector('[name="address_name"]') as HTMLInputElement).value = addr?.address_name || '';
  (root.querySelector('[name="address_type"]') as HTMLSelectElement).value = addr?.address_type || 'shipping';
  (root.querySelector('[name="recipient_name"]') as HTMLInputElement).value = addr?.recipient_name || '';
  (root.querySelector('[name="phone_number"]') as HTMLInputElement).value = addr?.phone_number || '';
  (root.querySelector('[name="address_line1"]') as HTMLInputElement).value = addr?.address_line1 || '';
  (root.querySelector('[name="address_line2"]') as HTMLInputElement).value = addr?.address_line2 || '';
  (root.querySelector('[name="postal_code"]') as HTMLInputElement).value = addr?.postal_code || '';
  (root.querySelector('[name="is_default"]') as HTMLInputElement).checked = addr?.is_default || false;
  const regionSelect = root.querySelector('[data-dashboard-region-select]') as HTMLSelectElement;
  if (regionSelect) regionSelect.value = addr?.region_id || '';
}

async function openAddressForm(panelRoot: HTMLElement, addressId?: string) {
  const modal =
    panelRoot.querySelector('[data-dashboard-modal="address-form"]') ||
    getDashboardRoot()?.querySelector('[data-dashboard-modal="address-form"]');
  if (!(modal instanceof HTMLElement)) return;

  editingAddressId = addressId || null;
  const title = modal.querySelector('[data-dashboard-address-form-title]');
  if (title) {
    title.textContent = addressId
      ? clientTranslations.get('edit_address')
      : clientTranslations.get('add_address');
  }

  await ensureRegions(modal);
  if (addressId) {
    try {
      const res = await clientAddress.getAddress(addressId);
      fillAddressForm(modal, res.data?.address);
    } catch {
      fillAddressForm(modal);
    }
  } else {
    fillAddressForm(modal);
  }

  const sectionRoot = (panelRoot.closest('[data-dashboard-section]') || document.body) as HTMLElement;
  openDashboardModal(sectionRoot, 'address-form');
}

async function saveAddressForm(modal: HTMLElement, panelRoot: HTMLElement) {
  const errorEl = modal.querySelector('[data-dashboard-address-form-error]') as HTMLElement | null;
  errorEl?.classList.add('dashboard-section__hidden');

  const membershipId = getCurrentMembershipId();
  if (!membershipId) return;

  const payload = {
    membership_id: membershipId,
    address_name: (modal.querySelector('[name="address_name"]') as HTMLInputElement).value.trim(),
    address_type: (modal.querySelector('[name="address_type"]') as HTMLSelectElement).value as 'shipping' | 'billing',
    recipient_name: (modal.querySelector('[name="recipient_name"]') as HTMLInputElement).value.trim(),
    phone_number: (modal.querySelector('[name="phone_number"]') as HTMLInputElement).value.trim(),
    region_id: (modal.querySelector('[data-dashboard-region-select]') as HTMLSelectElement).value,
    address_line1: (modal.querySelector('[name="address_line1"]') as HTMLInputElement).value.trim(),
    address_line2: (modal.querySelector('[name="address_line2"]') as HTMLInputElement).value.trim() || null,
    postal_code: (modal.querySelector('[name="postal_code"]') as HTMLInputElement).value.trim() || null,
    is_default: (modal.querySelector('[name="is_default"]') as HTMLInputElement).checked,
  };

  if (!payload.address_name || !payload.recipient_name || !payload.phone_number || !payload.region_id || !payload.address_line1) {
    if (errorEl) {
      errorEl.textContent = clientTranslations.get('please_fill_required_fields');
      errorEl.classList.remove('dashboard-section__hidden');
    }
    return;
  }

  try {
    if (editingAddressId) {
      await clientAddress.updateAddress(editingAddressId, payload);
    } else {
      await clientAddress.createAddress(payload);
    }
    const sectionRoot = (panelRoot.closest('[data-dashboard-section]') || document.body) as HTMLElement;
    closeDashboardModal(sectionRoot, 'address-form');
    await loadAddresses(panelRoot);
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err instanceof Error ? err.message : clientTranslations.get('failed_to_save_address');
      errorEl.classList.remove('dashboard-section__hidden');
    }
  }
}

function bindAddressesPanel(root: HTMLElement) {
  if (root.dataset.dashboardAddressesBound === '1') return;
  root.dataset.dashboardAddressesBound = '1';

  root.querySelector('[data-dashboard-address-add]')?.addEventListener('click', () => {
    void openAddressForm(root);
  });

  const modal = root.querySelector('[data-dashboard-modal="address-form"]') as HTMLElement | null;
  modal?.querySelector('[data-dashboard-address-save]')?.addEventListener('click', () => {
    if (modal) void saveAddressForm(modal, root);
  });

  void loadAddresses(root);
}

export function initDashboardAddressesPanel(): void {
  onPanelActivate('addresses', bindAddressesPanel);
}
