/**
 * 支付方式数据获取函数库
 * 用于从静态JSON文件获取支付方式相关数据
 */

import { APP_CONFIG } from '../config/app';

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

/**
 * 客户端配置接口
 */
interface ClientConfig {
  tenantId: string;
  locale: string;
  apiBaseUrl: string;
}

/**
 * 获取客户端配置
 */
function getClientConfig(): ClientConfig {
  const win = window as any;
  return {
    tenantId: win.__ASTRO_TENANT_ID__ || APP_CONFIG.tenantId,
    locale: win.__ASTRO_LOCALE__ || 'zh-CN',
    apiBaseUrl: APP_CONFIG.apiBaseUrl,
  };
}

/**
 * 支付方式翻译接口
 */
export interface PaymentMethodTranslation {
  language_code: string;
  method_name: string;
  description?: string;
  is_primary: boolean;
}

/**
 * 支付方式字段翻译接口
 */
export interface PaymentMethodFieldTranslation {
  language_code: string;
  field_name: string;
  field_label: string;
  field_description?: string;
  placeholder?: string;
  is_primary: boolean;
}

/**
 * 支付方式字段接口
 */
export interface PaymentMethodField {
  id: string;
  tenant_id: string;
  method_id: string;
  field_name: string;
  field_code: string;
  field_type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea' | 'image' | 'display' | 'file';
  field_label: string;
  field_description?: string;
  translations: PaymentMethodFieldTranslation[] | null;
  is_required: boolean;
  is_visible: boolean;
  validation_rules?: Record<string, any>;
  default_value?: string | null;
  placeholder?: string;
  options?: Record<string, any>;
  sort_order: number;
  status: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * 支付方式接口
 */
export interface PaymentMethod {
  id: string;
  tenant_id: string;
  method_name: string;
  method_code: string;
  method_type: 'online' | 'offline' | 'wallet' | 'credit';
  supported_currencies?: string[];
  /** 后端可能返回 null，无翻译时回退到 method_name */
  translations: PaymentMethodTranslation[] | null;
  is_enabled: boolean;
  is_default: boolean;
  sort_order: number;
  description?: string;
  icon_url?: string;
  fee_type: 'none' | 'percentage' | 'fixed';
  fee_value: string;
  min_amount?: string | null;
  max_amount?: string | null;
  status: string;
  metadata?: Record<string, any>;
  fields: PaymentMethodField[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * 支付方式数据响应接口
 */
export interface PaymentMethodsData {
  payment_methods: PaymentMethod[];
}

/**
 * 获取支付方式数据
 */
export async function fetchPaymentMethods(
  tenantId?: string
): Promise<PaymentMethodsData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/payments/payment-methods-${finalTenantId}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
  }
  
  return await response.json();
}

function listTranslations(method: PaymentMethod): PaymentMethodTranslation[] {
  return method.translations ?? [];
}

function fieldTranslationList(field: PaymentMethodField): PaymentMethodFieldTranslation[] {
  return field.translations ?? [];
}

/**
 * 获取支付方式的本地化名称
 */
export function getPaymentMethodDisplayName(
  method: PaymentMethod,
  locale: string
): string {
  const tr = listTranslations(method);
  const translation = tr.find(t => t.language_code === locale);
  if (translation) {
    return translation.method_name;
  }
  const primaryTranslation = tr.find(t => t.is_primary);
  return primaryTranslation?.method_name || method.method_name;
}

/**
 * 获取支付方式的本地化描述
 */
export function getPaymentMethodDescription(
  method: PaymentMethod,
  locale: string
): string | undefined {
  const tr = listTranslations(method);
  const translation = tr.find(t => t.language_code === locale);
  if (translation && translation.description) {
    return translation.description;
  }
  const primaryTranslation = tr.find(t => t.is_primary);
  return primaryTranslation?.description || method.description;
}

/**
 * 获取支付方式字段的本地化标签
 */
export function getPaymentFieldLabel(
  field: PaymentMethodField,
  locale: string
): string {
  const tr = fieldTranslationList(field);
  const translation = tr.find(t => t.language_code === locale);
  if (translation) {
    return translation.field_label;
  }
  const primaryTranslation = tr.find(t => t.is_primary);
  return primaryTranslation?.field_label || field.field_label;
}

/**
 * 获取支付方式字段的本地化描述
 */
export function getPaymentFieldDescription(
  field: PaymentMethodField,
  locale: string
): string | undefined {
  const tr = fieldTranslationList(field);
  const translation = tr.find(t => t.language_code === locale);
  if (translation && translation.field_description) {
    return translation.field_description;
  }
  const primaryTranslation = tr.find(t => t.is_primary);
  return primaryTranslation?.field_description || field.field_description;
}

/**
 * 获取支付方式字段的本地化占位符
 */
export function getPaymentFieldPlaceholder(
  field: PaymentMethodField,
  locale: string
): string | undefined {
  const tr = fieldTranslationList(field);
  const translation = tr.find(t => t.language_code === locale);
  if (translation && translation.placeholder) {
    return translation.placeholder;
  }
  const primaryTranslation = tr.find(t => t.is_primary);
  return primaryTranslation?.placeholder || field.placeholder;
}

/**
 * 客户端导出
 */
export const clientPayment = {
  fetchPaymentMethods,
  getPaymentMethodDisplayName,
  getPaymentMethodDescription,
  getPaymentFieldLabel,
  getPaymentFieldDescription,
  getPaymentFieldPlaceholder,
};

