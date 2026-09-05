/**
 * 订单相关的API服务
 * 用于处理订单创建、支付记录创建、订单支付状态更新等
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getCurrentMembershipId } from './auth';
import type { CartItem } from './cart';

const API_BASE_URL = APP_CONFIG.apiBaseUrl01;

/**
 * 创建订单请求参数
 */
export interface CreateOrderRequest {
  key?: string;
  buyer_id: string;
  seller_id?: string;
  order_type?: string;
  shipping_address_id?: string;
  billing_address_id?: string;
  shipping_amount?: number;
  tax_amount?: number;
  currency_code?: string;
  exchange_rate_id?: string;
  exchange_rate?: number;
  order_notes?: string;
  customer_notes?: string;
  metadata?: Record<string, any>;
  items: CreateOrderItemRequest[];
}

/**
 * 创建订单明细请求参数
 */
export interface CreateOrderItemRequest {
  article_id: string;
  variant_id?: string;
  article_type: string;
  product_name: string;
  product_sku?: string;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  discount_rule_ids?: string[];
  discount_amount?: number;
  discount_reason?: string;
  group_buying_id?: string;
  group_buying_price?: number;
  crowdfunding_activity_id?: string;
  crowdfunding_reward_id?: string;
  shipping_template_id?: string;
  tax_template_id?: string;
  shipping_address_id?: string;
  shipping_amount?: number;
  tax_amount?: number;
  metadata?: Record<string, any>;
}

/**
 * 创建订单响应
 */
export interface CreateOrderResponse {
  success: boolean;
  data: {
    order: {
      id: string;
      order_number: string;
      order_type: string;
      buyer_id: string;
      seller_id?: string;
      order_status: string;
      payment_status: string;
      payment_method_type?: string;
      payment_record_id?: string;
      fund_transaction_id?: string;
      subtotal_amount: number;
      shipping_amount: number;
      tax_amount: number;
      discount_amount: number;
      total_amount: number;
      paid_amount: number;
      refunded_amount: number;
      shipping_address_id?: string;
      billing_address_id?: string;
      order_date: string;
      payment_date?: string;
      shipped_date?: string;
      delivered_date?: string;
      cancelled_date?: string;
      order_notes?: string;
      customer_notes?: string;
      metadata?: Record<string, any>;
      created_at: string;
      updated_at: string;
    };
  };
}

/**
 * 创建支付记录请求参数
 */
export interface CreatePaymentRecordRequest {
  key?: string;
  membership_id?: string;
  order_id?: string; // 可选，充值等场景下可以为空
  payment_method_id: string;
  payment_number?: string;
  payment_amount: number;
  payment_status?: string;
  currency_code?: string;
  exchange_rate_id?: string;
  exchange_rate?: number;
  payment_date?: string;
  completed_date?: string;
  third_party_reference?: string;
  third_party_response?: Record<string, any>;
  field_data?: Record<string, any>;
  payment_notes?: string;
  metadata?: Record<string, any>;
}

/**
 * 创建支付记录响应
 */
export interface CreatePaymentRecordResponse {
  success: boolean;
  data: {
    payment_record: {
      id: string;
      tenant_id: string;
      membership_id?: string;
      order_id?: string;
      payment_method_id: string;
      payment_number: string;
      payment_amount: number;
      payment_status: string;
      payment_date: string;
      completed_date?: string;
      third_party_reference?: string;
      third_party_response?: Record<string, any>;
      field_data?: Record<string, any>;
      payment_notes?: string;
      metadata?: Record<string, any>;
      created_at: string;
      updated_at: string;
    };
  };
}

/**
 * 更新订单支付状态请求参数
 */
export interface UpdateOrderPaymentStatusRequest {
  key?: string;
  payment_status?: string;
  paid_amount?: number;
  payment_date?: string;
  payment_method_type?: string;
  payment_record_id?: string;
  fund_transaction_id?: string;
  metadata?: Record<string, any>;
}

/**
 * 更新订单支付状态响应
 */
export interface UpdateOrderPaymentStatusResponse {
  success: boolean;
  data: {
    order: {
      id: string;
      order_number: string;
      payment_status: string;
      paid_amount: number;
      payment_date?: string;
      payment_method_type?: string;
      payment_record_id?: string;
      fund_transaction_id?: string;
      order_status: string;
      updated_at: string;
    };
  };
}

/**
 * 获取客户端配置
 */
function getClientConfig() {
  const win = window as any;
  return {
    tenantId: win.__ASTRO_TENANT_ID__ || APP_CONFIG.tenantId,
    apiBaseUrl: API_BASE_URL,
    key: APP_CONFIG.key,
  };
}

/**
 * 从购物车项转换为订单明细项
 * 
 * 注意：根据API文档，订单明细中的 unit_price 应该是原价（折扣前的价格），
 * 而 total_price 由服务端自动计算 = unit_price × quantity - discount_amount
 * 
 * 购物车项中的字段：
 * - unit_price: 折扣后的单价（用于显示和计算）
 * - original_unit_price: 原价（折扣前的单价）
 * - discount_amount: 单件折扣金额（基础货币）
 * 
 * 订单明细中的字段：
 * - unit_price: 原价（折扣前的单价）
 * - discount_amount: 该明细项的总折扣金额（单件折扣金额 × 数量）
 */
export function cartItemToOrderItem(cartItem: CartItem): CreateOrderItemRequest {
  return {
    article_id: cartItem.article_id,
    variant_id: cartItem.variant_id,
    article_type: cartItem.article_type,
    product_name: cartItem.product_name,
    product_sku: cartItem.product_sku,
    product_image_url: cartItem.product_image_url,
    quantity: cartItem.quantity,
    // unit_price 使用原价（折扣前的价格），符合API文档要求
    // 服务端会根据 unit_price × quantity - discount_amount 计算 total_price
    unit_price: cartItem.original_unit_price,
    discount_rule_ids: cartItem.discount_rule_ids,
    // discount_amount 应该是该明细项的总折扣金额（单件折扣金额 × 数量）
    discount_amount: cartItem.discount_amount * cartItem.quantity,
    group_buying_id: cartItem.group_buying_id,
    crowdfunding_activity_id: cartItem.crowdfunding_activity_id,
    crowdfunding_reward_id: cartItem.crowdfunding_reward_id,
    shipping_template_id: cartItem.shipping_template_id,
    tax_template_id: cartItem.tax_template_id,
    shipping_address_id: cartItem.shipping_address_id,
    shipping_amount: cartItem.shipping_fee,
    tax_amount: cartItem.tax_fee,
  };
}

/**
 * 创建订单
 */
export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const config = getClientConfig();
  const sessionToken = getSessionToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': config.tenantId,
  };

  // 如果提供了key，添加到请求头（优先级更高）
  if (request.key || config.key) {
    headers['X-Key'] = request.key || config.key;
  }

  // 如果有session token，添加到Authorization头
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  // 如果请求中有key，需要从请求中移除（因为已经加到header中了）
  const requestBody = { ...request };
  if (request.key) {
    delete requestBody.key;
  }

  const response = await fetch(`${config.apiBaseUrl}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to create order: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to create order');
  }

  return data;
}

/**
 * 创建支付记录
 */
export async function createPaymentRecord(request: CreatePaymentRecordRequest): Promise<CreatePaymentRecordResponse> {
  const config = getClientConfig();
  const sessionToken = getSessionToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': config.tenantId,
  };

  // 如果提供了key，添加到请求头（优先级更高）
  if (request.key || config.key) {
    headers['X-Key'] = request.key || config.key;
  }

  // 如果有session token，添加到Authorization头
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  // 如果请求中有key，需要从请求中移除（因为已经加到header中了）
  const requestBody = { ...request };
  if (request.key) {
    delete requestBody.key;
  }

  const response = await fetch(`${config.apiBaseUrl}/payment-records`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to create payment record: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to create payment record');
  }

  return data;
}

/**
 * 更新订单支付状态
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  request: UpdateOrderPaymentStatusRequest
): Promise<UpdateOrderPaymentStatusResponse> {
  const config = getClientConfig();
  const sessionToken = getSessionToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': config.tenantId,
  };

  // 如果提供了key，添加到请求头（优先级更高）
  if (request.key || config.key) {
    headers['X-Key'] = request.key || config.key;
  }

  // 如果有session token，添加到Authorization头
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  // 如果请求中有key，需要从请求中移除（因为已经加到header中了）
  const requestBody = { ...request };
  if (request.key) {
    delete requestBody.key;
  }

  const response = await fetch(`${config.apiBaseUrl}/orders/${orderId}/payment-status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to update order payment status: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to update order payment status');
  }

  return data;
}

/**
 * 提交订单（完整流程：创建订单 -> 创建支付记录 -> 更新订单支付状态）
 */
export async function submitOrder(params: {
  cartItems: CartItem[];
  buyerId: string;
  sellerId?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  customerNotes?: string;
  paymentMethodId: string;
  paymentMethodType: 'online' | 'offline' | 'wallet' | 'credit';
  paymentFieldData: Record<string, any>;
  paymentAmount: number;
  currencyCode?: string;
  exchangeRateId?: string;
  exchangeRate?: number;
}): Promise<{
  orderId: string;
  orderNumber: string;
  paymentRecordId?: string;
}> {
  const config = getClientConfig();

  // 1. 创建订单
  const orderItems = params.cartItems.map(cartItemToOrderItem);
  
  // 计算订单级别的运费和税费（汇总所有明细项）
  const orderShippingAmount = params.cartItems.reduce((sum, item) => sum + item.shipping_fee, 0);
  const orderTaxAmount = params.cartItems.reduce((sum, item) => sum + item.tax_fee, 0);

  const createOrderRequest: CreateOrderRequest = {
    buyer_id: params.buyerId,
    seller_id: params.sellerId,
    order_type: 'purchase', // 默认类型
    shipping_address_id: params.shippingAddressId,
    billing_address_id: params.billingAddressId,
    shipping_amount: orderShippingAmount > 0 ? orderShippingAmount : undefined,
    tax_amount: orderTaxAmount > 0 ? orderTaxAmount : undefined,
    customer_notes: params.customerNotes,
    items: orderItems,
  };

  // 添加货币相关字段（如果提供了）
  if (params.currencyCode) {
    createOrderRequest.currency_code = params.currencyCode;
  }
  if (params.exchangeRateId) {
    createOrderRequest.exchange_rate_id = params.exchangeRateId;
  }
  if (params.exchangeRate !== undefined && params.exchangeRate !== null) {
    createOrderRequest.exchange_rate = params.exchangeRate;
  }

  // 如果提供了key，添加到请求中
  if (config.key) {
    createOrderRequest.key = config.key;
  }

  const orderResponse = await createOrder(createOrderRequest);
  const orderId = orderResponse.data.order.id;
  const orderNumber = orderResponse.data.order.order_number;
  const totalAmount = orderResponse.data.order.total_amount;

  // 2. 创建支付记录
  const membershipId = getCurrentMembershipId();
  
  const paymentRecordRequest: CreatePaymentRecordRequest = {
    membership_id: membershipId || undefined,
    order_id: orderId,
    payment_method_id: params.paymentMethodId,
    payment_amount: params.paymentAmount || totalAmount,
    payment_status: 'pending',
    field_data: params.paymentFieldData,
    payment_notes: `Order ${orderNumber} payment`,
  };

  // 添加货币相关字段（如果提供了）
  if (params.currencyCode) {
    paymentRecordRequest.currency_code = params.currencyCode;
  }
  if (params.exchangeRateId) {
    paymentRecordRequest.exchange_rate_id = params.exchangeRateId;
  }
  if (params.exchangeRate !== undefined && params.exchangeRate !== null) {
    paymentRecordRequest.exchange_rate = params.exchangeRate;
  }

  // 如果提供了key，添加到请求中
  if (config.key) {
    paymentRecordRequest.key = config.key;
  }

  const paymentRecordResponse = await createPaymentRecord(paymentRecordRequest);
  const paymentRecordId = paymentRecordResponse.data.payment_record.id;

  // 3. 更新订单支付状态
  // 根据支付方式的 method_type 来设置 payment_method_type
  // method_type: 'wallet' -> payment_method_type: 'wallet_payment'
  // method_type: 'online' | 'offline' | 'credit' -> payment_method_type: 'direct_payment'
  const paymentMethodType = params.paymentMethodType === 'wallet' 
    ? 'wallet_payment' 
    : 'direct_payment';

  const updatePaymentStatusRequest: UpdateOrderPaymentStatusRequest = {
    payment_status: 'unpaid',
    paid_amount: params.paymentAmount || totalAmount,
    payment_method_type: paymentMethodType,
    payment_record_id: paymentRecordId,
  };

  // 如果提供了key，添加到请求中
  if (config.key) {
    updatePaymentStatusRequest.key = config.key;
  }

  await updateOrderPaymentStatus(orderId, updatePaymentStatusRequest);

  return {
    orderId,
    orderNumber,
    paymentRecordId,
  };
}

/**
 * 订单明细项接口（完整JSON结构）
 */
export interface OrderItem {
  id: string;
  order_id: string;
  article_id: string;
  variant_id?: string;
  article_type: string;
  product_name: string;
  product_sku?: string;
  product_image_url?: string;
  quantity: number;
  unit_price: string; // decimal as string
  total_price: string; // decimal as string
  discount_rule_ids?: string[];
  discount_amount: string; // decimal as string
  discount_reason?: string;
  group_buying_id?: string;
  group_buying_price?: string; // decimal as string
  crowdfunding_activity_id?: string;
  crowdfunding_reward_id?: string;
  shipping_template_id?: string;
  tax_template_id?: string;
  shipping_address_id?: string;
  shipping_amount: string; // decimal as string
  tax_amount: string; // decimal as string
  item_status: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * 订单接口（完整JSON结构）
 */
export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  order_type: string;
  buyer_id: string;
  seller_id?: string;
  order_status: string;
  payment_status: string;
  payment_method_type?: string;
  payment_record_id?: string;
  fund_transaction_id?: string;
  subtotal_amount: string; // decimal as string
  shipping_amount: string; // decimal as string
  tax_amount: string; // decimal as string
  discount_amount: string; // decimal as string
  total_amount: string; // decimal as string
  paid_amount: string; // decimal as string
  refunded_amount: string; // decimal as string
  currency_code?: string;
  exchange_rate_id?: string;
  exchange_rate?: string; // decimal as string
  shipping_address_id?: string;
  billing_address_id?: string;
  order_date: string;
  payment_date?: string;
  shipped_date?: string;
  delivered_date?: string;
  cancelled_date?: string;
  order_notes?: string;
  customer_notes?: string;
  metadata?: Record<string, any>;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

/**
 * 获取订单ID列表响应
 */
export interface GetOrderIdsResponse {
  success: boolean;
  data: {
    order_ids: string[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
    };
  };
}

/**
 * 获取订单ID列表请求参数
 */
export interface GetOrderIdsParams {
  buyer_id: string;
  page?: number;
  page_size?: number;
  order_status?: string;
  payment_status?: string;
  order_type?: string;
  order_date_from?: string;
  order_date_to?: string;
  keyword?: string;
}

/**
 * 获取订单ID列表
 */
export async function getOrderIds(params: GetOrderIdsParams): Promise<GetOrderIdsResponse> {
  const config = getClientConfig();
  
  // 构建查询参数
  const queryParams = new URLSearchParams();
  queryParams.append('buyer_id', params.buyer_id);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.page_size) queryParams.append('page_size', params.page_size.toString());
  if (params.order_status) queryParams.append('order_status', params.order_status);
  if (params.payment_status) queryParams.append('payment_status', params.payment_status);
  if (params.order_type) queryParams.append('order_type', params.order_type);
  if (params.order_date_from) queryParams.append('order_date_from', params.order_date_from);
  if (params.order_date_to) queryParams.append('order_date_to', params.order_date_to);
  if (params.keyword) queryParams.append('keyword', params.keyword);
  
  // 添加key到查询参数
  if (config.key) {
    queryParams.append('key', config.key);
  }
  
  const headers: Record<string, string> = {
    'X-Tenant-ID': config.tenantId,
  };
  
  // 如果提供了key，也添加到请求头（优先级更高）
  if (config.key) {
    headers['X-Key'] = config.key;
  }
  
  const sessionToken = getSessionToken();
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  
  const response = await fetch(`${config.apiBaseUrl}/orders/ids?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to get order IDs: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to get order IDs');
  }
  
  return data;
}

/**
 * 获取订单JSON数据（从静态文件路径获取）
 */
export async function getOrderJSON(orderId: string): Promise<Order> {
  const config = getClientConfig();
  
  // 静态JSON文件路径：{tenantID}/orders/order-{orderID}.json
  // 使用 APP_CONFIG.apiBaseUrl 作为JSON数据的基础URL
  const jsonUrl = `${APP_CONFIG.apiBaseUrl}/tenant_${config.tenantId}/orders/order-${orderId}.json`;
  
  const response = await fetch(jsonUrl, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get order JSON: ${response.statusText}`);
  }
  
  const order: Order = await response.json();
  return order;
}

/**
 * 并行获取多个订单的JSON数据
 */
export async function getOrdersJSON(orderIds: string[]): Promise<Order[]> {
  const promises = orderIds.map(id => getOrderJSON(id).catch(error => {
    console.error(`Failed to fetch order ${id}:`, error);
    return null;
  }));
  
  const results = await Promise.all(promises);
  
  // 过滤掉失败的请求
  return results.filter((order): order is Order => order !== null);
}

/**
 * 支付记录接口定义
 */
export interface PaymentRecord {
  id: string;
  tenant_id: string;
  membership_id?: string;
  order_id?: string;
  payment_method_id: string;
  payment_number: string;
  payment_amount: string; // DECIMAL format as string
  payment_status: string;
  currency_code?: string;
  exchange_rate_id?: string;
  exchange_rate?: string; // DECIMAL format as string
  payment_date: string;
  completed_date?: string;
  third_party_reference?: string;
  third_party_response?: Record<string, any>;
  field_data: Record<string, any>;
  payment_notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * 获取支付记录ID列表响应
 */
export interface PaymentRecordIdsResponse {
  success: boolean;
  data: {
    payment_record_ids: string[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
    };
  };
}

/**
 * 获取支付记录ID列表参数
 */
export interface GetPaymentRecordIdsParams {
  membership_id: string;
  page?: number;
  page_size?: number;
  order_id?: string;
  payment_method_id?: string;
  payment_status?: string;
  payment_date_from?: string;
  payment_date_to?: string;
  keyword?: string;
  key?: string;
}

/**
 * 获取支付记录ID列表
 */
export async function getPaymentRecordIds(params: GetPaymentRecordIdsParams): Promise<PaymentRecordIdsResponse> {
  const config = getClientConfig();
  
  // 构建查询参数
  const queryParams = new URLSearchParams();
  queryParams.append('membership_id', params.membership_id);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.page_size) queryParams.append('page_size', params.page_size.toString());
  if (params.order_id) queryParams.append('order_id', params.order_id);
  if (params.payment_method_id) queryParams.append('payment_method_id', params.payment_method_id);
  if (params.payment_status) queryParams.append('payment_status', params.payment_status);
  if (params.payment_date_from) queryParams.append('payment_date_from', params.payment_date_from);
  if (params.payment_date_to) queryParams.append('payment_date_to', params.payment_date_to);
  if (params.keyword) queryParams.append('keyword', params.keyword);
  
  // 添加key到查询参数
  const keyToUse = params.key || config.key;
  if (keyToUse) {
    queryParams.append('key', keyToUse);
  }
  
  const headers: Record<string, string> = {
    'X-Tenant-ID': config.tenantId,
  };
  
  // 如果提供了key，也添加到请求头（优先级更高）
  if (keyToUse) {
    headers['X-Key'] = keyToUse;
  }
  
  const sessionToken = getSessionToken();
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  
  const response = await fetch(`${config.apiBaseUrl}/payment-records/ids?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to get payment record IDs: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to get payment record IDs');
  }
  
  return data;
}

/**
 * 获取支付记录JSON数据（从静态文件路径获取）
 */
export async function getPaymentRecordJSON(paymentRecordId: string): Promise<PaymentRecord> {
  const config = getClientConfig();
  
  // 静态JSON文件路径：{tenantID}/payments/payment-record-{paymentRecordID}.json
  // 使用 APP_CONFIG.apiBaseUrl 作为JSON数据的基础URL
  const jsonUrl = `${APP_CONFIG.apiBaseUrl}/tenant_${config.tenantId}/payments/payment-record-${paymentRecordId}.json`;
  
  const response = await fetch(jsonUrl, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get payment record JSON: ${response.statusText}`);
  }
  
  const paymentRecord: PaymentRecord = await response.json();
  return paymentRecord;
}

/**
 * 并行获取多个支付记录的JSON数据
 */
export async function getPaymentRecordsJSON(paymentRecordIds: string[]): Promise<PaymentRecord[]> {
  const promises = paymentRecordIds.map(id => getPaymentRecordJSON(id).catch(error => {
    console.error(`Failed to fetch payment record ${id}:`, error);
    return null;
  }));
  
  const results = await Promise.all(promises);
  
  // 过滤掉失败的请求
  return results.filter((record): record is PaymentRecord => record !== null);
}

/**
 * 客户端导出
 */
export const clientOrder = {
  createOrder,
  createPaymentRecord,
  updateOrderPaymentStatus,
  submitOrder,
  cartItemToOrderItem,
  getOrderIds,
  getOrderJSON,
  getOrdersJSON,
  getPaymentRecordIds,
  getPaymentRecordJSON,
  getPaymentRecordsJSON,
};

