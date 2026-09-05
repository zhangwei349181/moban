/**
 * Dashboard 订阅订单面板
 */

import { listMyGt6SubscriptionOrders, fetchGt6SubscriptionOrderStaticJson } from './gt6-subscription-orders-api';
import { clientTranslations } from './translations';
import { formatDashboardDate, initDashboardGt6ListPanel, statusClass } from './dashboardGt6List.client';
import { onPanelActivate } from './dashboardPanelUtils.client';

interface SubOrderRow {
  id: string;
  subscription_number: string;
  product_name: string;
  variant_name: string;
  billing_cycle: string;
  current_period_end: string;
  subscription_status: string;
  created_at: string;
  currency_code: string;
  amount: string;
}

function pickStr(j: Record<string, unknown>, key: string, fallback = ''): string {
  const v = j[key];
  return typeof v === 'string' ? v : fallback;
}

function pickSnapshotStr(j: Record<string, unknown>, key: string): string {
  const snap = j.subscription_snapshot;
  if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
    const v = (snap as Record<string, unknown>)[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

function mapRow(j: Record<string, unknown>): SubOrderRow {
  const id = String(j.id ?? '');
  return {
    id,
    subscription_number: pickStr(j, 'subscription_order_number', pickStr(j, 'subscription_number', pickStr(j, 'order_number', id))),
    product_name: pickStr(j, 'product_name'),
    variant_name: pickStr(j, 'variant_name', pickSnapshotStr(j, 'variant_name')),
    billing_cycle: pickStr(j, 'payment_period', pickStr(j, 'billing_cycle', pickStr(j, 'billing_interval'))),
    current_period_end: pickStr(j, 'current_period_end', pickSnapshotStr(j, 'expires_at')),
    subscription_status: pickStr(j, 'status', pickStr(j, 'subscription_status', 'pending')),
    created_at: pickStr(j, 'created_at'),
    currency_code: pickStr(j, 'currency_code'),
    amount: String(j.paid_price ?? j.amount ?? j.line_total ?? '0'),
  };
}

function detailRow(label: string, value: string): string {
  return `<div class="dashboard-detail-row"><span class="dashboard-detail-label">${label}</span><span class="dashboard-detail-value">${value}</span></div>`;
}

export function initDashboardSubscriptionOrdersPanel(): void {
  onPanelActivate('subscription_orders', () => {
    initDashboardGt6ListPanel<SubOrderRow>({
      panelId: 'subscription_orders',
      pageSize: 10,
      loadPage: listMyGt6SubscriptionOrders,
      fetchDetail: fetchGt6SubscriptionOrderStaticJson,
      mapRow,
      modalId: 'subscription-order-detail',
      loadErrorKey: 'failed_to_load_subscription_orders',
      renderTableRow: (row) => {
        const subNo = row.subscription_number || row.id;
        const billing = row.billing_cycle || '—';
        const project = row.variant_name || '—';
        const expires = row.current_period_end ? formatDashboardDate(row.current_period_end) : '—';
        return `
        <tr>
          <td>${subNo}</td>
          <td>${row.product_name || '—'}</td>
          <td>${project}</td>
          <td>${billing}</td>
          <td>${expires}</td>
          <td><span class="dashboard-status ${statusClass(row.subscription_status)}">${row.subscription_status}</span></td>
          <td>${formatDashboardDate(row.created_at)}</td>
          <td><button type="button" class="dashboard-section__btn" data-dashboard-view-id="${row.id}">${clientTranslations.get('view')}</button></td>
        </tr>`;
      },
      renderCard: (row) => {
        const subNo = row.subscription_number || row.id;
        const billing = row.billing_cycle || '—';
        const project = row.variant_name || '—';
        const expires = row.current_period_end ? formatDashboardDate(row.current_period_end) : '—';
        return `
        <article class="dashboard-list-card">
          <div class="dashboard-list-card__header">
            <div><strong>${subNo}</strong><div class="dashboard-list-card__meta">${formatDashboardDate(row.created_at)}</div></div>
            <span class="dashboard-status ${statusClass(row.subscription_status)}">${row.subscription_status}</span>
          </div>
          <div class="dashboard-list-card__body">${row.product_name || '—'} · ${project} · ${billing} · ${clientTranslations.get('current_period_end' as any)} ${expires}</div>
          <button type="button" class="dashboard-section__btn" data-dashboard-view-id="${row.id}">${clientTranslations.get('view')}</button>
        </article>`;
      },
      renderDetail: (row) => {
        const subNo = row.subscription_number || row.id;
        const billing = row.billing_cycle || '—';
        const project = row.variant_name || '—';
        const expires = row.current_period_end ? formatDashboardDate(row.current_period_end) : '—';
        return `
        <div class="dashboard-detail">
          ${detailRow(clientTranslations.get('subscription_number'), subNo)}
          ${detailRow(clientTranslations.get('product' as any), row.product_name || '—')}
          ${detailRow(clientTranslations.get('project_name' as any), project)}
          ${detailRow(clientTranslations.get('billing_cycle'), billing)}
          ${detailRow(clientTranslations.get('current_period_end' as any), expires)}
          ${detailRow(clientTranslations.get('status'), row.subscription_status)}
          ${detailRow(clientTranslations.get('date'), formatDashboardDate(row.created_at))}
        </div>`;
      },
    });
  });
}
