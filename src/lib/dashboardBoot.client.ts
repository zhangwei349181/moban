/**
 * Dashboard 引导
 */

import { isAuthenticated } from './auth';
import { initDashboardShell } from './dashboardShell.client';
import { initDashboardProfilePanel } from './dashboardProfile.client';
import { initDashboardPasswordPanel } from './dashboardPassword.client';
import { initDashboardAddressesPanel } from './dashboardAddresses.client';
import { initDashboardOrdersPanel } from './dashboardOrders.client';
import { initDashboardSubscriptionOrdersPanel } from './dashboardSubscriptionOrders.client';
import { initDashboardPaymentsPanel } from './dashboardPayments.client';
import { initDashboardSubscriptionPaymentsPanel } from './dashboardSubscriptionPayments.client';

export function bootDashboard(): void {
  const run = () => {
    const ok = initDashboardShell();
    if (!ok) return;
    initDashboardProfilePanel();
    initDashboardPasswordPanel();
    initDashboardAddressesPanel();
    initDashboardOrdersPanel();
    initDashboardSubscriptionOrdersPanel();
    initDashboardPaymentsPanel();
    initDashboardSubscriptionPaymentsPanel();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  document.addEventListener('astro:page-load', run);
}

export function bootDashboardPanel(panelId: string): void {
  const run = () => {
    if (!isAuthenticated()) {
      window.location.href = '/login?return=' + encodeURIComponent(window.location.pathname);
      return;
    }
    switch (panelId) {
      case 'profile':
        initDashboardProfilePanel();
        break;
      case 'addresses':
        initDashboardAddressesPanel();
        break;
      case 'password':
        initDashboardPasswordPanel();
        break;
      case 'orders':
        initDashboardOrdersPanel();
        break;
      case 'subscription_orders':
        initDashboardSubscriptionOrdersPanel();
        break;
      case 'payments':
        initDashboardPaymentsPanel();
        break;
      case 'subscription_payments':
        initDashboardSubscriptionPaymentsPanel();
        break;
      default:
        break;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
