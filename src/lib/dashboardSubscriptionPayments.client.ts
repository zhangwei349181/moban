/**
 * Dashboard 订阅支付记录面板
 */

import { listMyGt6SubscriptionPayments, fetchGt6SubscriptionPaymentStaticJson } from './gt6-subscription-payments-api';
import { clientTranslations } from './translations';
import { formatDashboardDate, initDashboardGt6ListPanel, statusClass } from './dashboardGt6List.client';
import { onPanelActivate } from './dashboardPanelUtils.client';

interface SubPaymentRow {
  id: string;
  payment_number: string;
  amount: string;
  currency_code: string;
  payment_status: string;
  subscription_number: string;
  created_at: string;
}

function mapRow(j: Record<string, unknown>): SubPaymentRow {
  return {
    id: String(j.id ?? ''),
    payment_number: String(j.payment_number ?? ''),
    amount: String(j.payment_amount ?? j.amount ?? j.total_amount ?? '0'),
    currency_code: String(j.currency_code ?? ''),
    payment_status: String(j.payment_status ?? j.status ?? 'pending'),
    subscription_number: String(j.subscription_number ?? ''),
    created_at: String(j.created_at ?? ''),
  };
}

function money(row: SubPaymentRow): string {
  return row.currency_code ? `${row.currency_code} ${row.amount}` : row.amount;
}

function detailRow(label: string, value: string): string {
  return `<div class="dashboard-detail-row"><span class="dashboard-detail-label">${label}</span><span class="dashboard-detail-value">${value}</span></div>`;
}

export function initDashboardSubscriptionPaymentsPanel(): void {
  onPanelActivate('subscription_payments', () => {
    initDashboardGt6ListPanel<SubPaymentRow>({
      panelId: 'subscription_payments',
      loadPage: listMyGt6SubscriptionPayments,
      fetchDetail: fetchGt6SubscriptionPaymentStaticJson,
      mapRow,
      modalId: 'subscription-payment-detail',
      loadErrorKey: 'failed_to_load_subscription_payments',
      renderTableRow: (row) => `
        <tr>
          <td>${row.payment_number}</td>
          <td>${row.subscription_number || '—'}</td>
          <td>${money(row)}</td>
          <td>${row.currency_code || '—'}</td>
          <td><span class="dashboard-status ${statusClass(row.payment_status)}">${row.payment_status}</span></td>
          <td>${formatDashboardDate(row.created_at)}</td>
          <td><button type="button" class="dashboard-section__btn" data-dashboard-view-id="${row.id}">${clientTranslations.get('view')}</button></td>
        </tr>`,
      renderCard: (row) => `
        <article class="dashboard-list-card">
          <div class="dashboard-list-card__header">
            <div><strong>${row.payment_number}</strong><div class="dashboard-list-card__meta">${formatDashboardDate(row.created_at)}</div></div>
            <span class="dashboard-status ${statusClass(row.payment_status)}">${row.payment_status}</span>
          </div>
          <div class="dashboard-list-card__body">${money(row)} · ${row.subscription_number || '—'}</div>
          <button type="button" class="dashboard-section__btn" data-dashboard-view-id="${row.id}">${clientTranslations.get('view')}</button>
        </article>`,
      renderDetail: (row) => `
        <div class="dashboard-detail">
          ${detailRow(clientTranslations.get('payment_number'), row.payment_number)}
          ${detailRow(clientTranslations.get('subscription_number'), row.subscription_number || '—')}
          ${detailRow(clientTranslations.get('total'), money(row))}
          ${detailRow(clientTranslations.get('status'), row.payment_status)}
          ${detailRow(clientTranslations.get('payment_date'), formatDashboardDate(row.created_at))}
        </div>`,
    });
  });
}
