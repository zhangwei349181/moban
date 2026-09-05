/**
 * Dashboard 密码面板
 */

import { changePassword } from './auth';
import { clientTranslations } from './translations';
import { getPanelRoot, onPanelActivate } from './dashboardPanelUtils.client';

function bindPasswordForm(root: HTMLElement) {
  if (root.dataset.dashboardPasswordBound === '1') return;
  root.dataset.dashboardPasswordBound = '1';

  const form = root.querySelector('[data-dashboard-password-form]') as HTMLFormElement | null;
  const errorEl = root.querySelector('[data-dashboard-password-error]') as HTMLElement | null;
  const successEl = root.querySelector('[data-dashboard-password-success]') as HTMLElement | null;
  const submitBtn = root.querySelector('[data-dashboard-password-submit]') as HTMLButtonElement | null;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hide(errorEl);
    hide(successEl);

    const current = (root.querySelector('[name="current_password"]') as HTMLInputElement)?.value || '';
    const next = (root.querySelector('[name="new_password"]') as HTMLInputElement)?.value || '';
    const confirm = (root.querySelector('[name="confirm_password"]') as HTMLInputElement)?.value || '';

    if (!current || !next || !confirm) {
      showError(errorEl, clientTranslations.get('please_enter_current_password'));
      return;
    }
    if (next.length < 8) {
      showError(errorEl, clientTranslations.get('password_min_length'));
      return;
    }
    if (next !== confirm) {
      showError(errorEl, clientTranslations.get('passwords_not_match'));
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
      const result = await changePassword({
        current_password: current,
        new_password: next,
        confirm_password: confirm,
      });
      if (successEl) {
        successEl.textContent = result.data?.message || clientTranslations.get('password_updated_successfully');
        successEl.classList.remove('dashboard-section__hidden');
      }
      form.reset();
    } catch (err) {
      showError(errorEl, err instanceof Error ? err.message : clientTranslations.get('failed_to_update_password'));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function showError(el: HTMLElement | null, msg: string) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('dashboard-section__hidden');
}

function hide(el: HTMLElement | null) {
  el?.classList.add('dashboard-section__hidden');
}

export function initDashboardPasswordPanel(): void {
  onPanelActivate('password', bindPasswordForm);
}
