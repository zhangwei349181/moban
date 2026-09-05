/**
 * Dashboard 我的订单面板
 */

import { listMyGt6Orders, fetchGt6OrderStaticJson } from './gt6-orders-api';
import { clientTranslations } from './translations';
import { formatDashboardDate, initDashboardGt6ListPanel, statusClass } from './dashboardGt6List.client';
import { onPanelActivate } from './dashboardPanelUtils.client';

interface OrderRow {
  id: string;
  order_number: string;
  created_at: string;
  order_line_status: string;
  product_name: string;
  product_sku?: string;
  product_image_url?: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  line_total: string;
  currency_code: string;
}

function mapOrder(j: Record<string, unknown>): OrderRow {
  const qty = typeof j.quantity === 'number' ? j.quantity : parseInt(String(j.quantity ?? '1'), 10) || 1;
  return {
    id: String(j.id ?? ''),
    order_number: String(j.order_number ?? ''),
    created_at: String(j.created_at ?? ''),
    order_line_status: String(j.order_line_status ?? 'pending'),
    product_name: String(j.product_name ?? ''),
    product_sku: j.product_sku != null ? String(j.product_sku) : undefined,
    product_image_url: j.product_image_url != null ? String(j.product_image_url) : undefined,
    quantity: qty,
    unit_price: String(j.unit_price ?? '0'),
    discount_amount: String(j.discount_amount ?? '0'),
    line_total: String(j.line_total ?? '0'),
    currency_code: String(j.currency_code ?? ''),
  };
}

function money(row: OrderRow, amount: string): string {
  return row.currency_code ? `${row.currency_code} ${amount}` : amount;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending: clientTranslations.get('order_status_pending'),
    paid: clientTranslations.get('order_status_paid'),
    confirmed: clientTranslations.get('order_status_confirmed'),
    shipped: clientTranslations.get('order_status_shipped'),
    delivered: clientTranslations.get('order_status_delivered'),
    cancelled: clientTranslations.get('order_status_cancelled'),
  };
  return map[status.toLowerCase()] || status;
}

function truncate(name: string, max = 48): string {
  const s = name.trim();
  return s.length <= max ? s : s.slice(0, max) + '…';
}

function detailRow(label: string, value: string): string {
  return `<div class="dashboard-detail-row"><span class="dashboard-detail-label">${label}</span><span class="dashboard-detail-value">${value}</span></div>`;
}

export function initDashboardOrdersPanel(): void {
  onPanelActivate('orders', () => {
    initDashboardGt6ListPanel<OrderRow>({
      panelId: 'orders',
      loadPage: listMyGt6Orders,
      fetchDetail: fetchGt6OrderStaticJson,
      mapRow: mapOrder,
      modalId: 'order-detail',
      loadErrorKey: 'failed_to_load_orders',
      renderTableRow: (row) => `
        <tr>
          <td>${row.order_number}</td>
          <td>${truncate(row.product_name)}</td>
          <td>${formatDashboardDate(row.created_at)}</td>
          <td>${money(row, row.line_total)}</td>
          <td><span class="dashboard-status ${statusClass(row.order_line_status)}">${formatStatus(row.order_line_status)}</span></td>
          <td><button type="button" class="dashboard-section__btn" data-dashboard-view-id="${row.id}">${clientTranslations.get('view')}</button></td>
        </tr>`,
      renderCard: (row) => `
        <article class="dashboard-list-card">
          <div class="dashboard-list-card__header">
            <div><strong>${row.order_number}</strong><div class="dashboard-list-card__meta">${formatDashboardDate(row.created_at)}</div></div>
            <span class="dashboard-status ${statusClass(row.order_line_status)}">${formatStatus(row.order_line_status)}</span>
          </div>
          <div class="dashboard-list-card__body">${truncate(row.product_name)} · ${money(row, row.line_total)}</div>
          <button type="button" class="dashboard-section__btn" data-dashboard-view-id="${row.id}">${clientTranslations.get('view')}</button>
        </article>`,
      renderDetail: (row) => `
        <div class="dashboard-detail">
          ${detailRow(clientTranslations.get('order_number'), row.order_number)}
          ${detailRow(clientTranslations.get('product' as any), row.product_name)}
          ${row.product_sku ? detailRow(clientTranslations.get('sku'), row.product_sku) : ''}
          ${detailRow(clientTranslations.get('quantity'), String(row.quantity))}
          ${detailRow(clientTranslations.get('unit_price'), money(row, row.unit_price))}
          ${detailRow(clientTranslations.get('total'), money(row, row.line_total))}
          ${detailRow(clientTranslations.get('order_status'), formatStatus(row.order_line_status))}
          ${detailRow(clientTranslations.get('date'), formatDashboardDate(row.created_at))}
        </div>`,
    });
  });
}
