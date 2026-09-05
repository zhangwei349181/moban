/**
 * 模板数据获取函数库
 */

import { APP_CONFIG } from '../config/app';

/**
 * 翻译接口
 */
export interface Translation {
  language_code: string;
  is_primary?: boolean;
  [key: string]: any;
}

/**
 * 模板字段翻译
 */
export interface FieldTranslation {
  language_code: string;
  field_name: string;
  display_name?: string;
  description?: string;
  placeholder?: string;
  group_name?: string;
  is_primary: boolean;
}

/**
 * 模板字段
 */
export interface TemplateField {
  id: string;
  template_id: string;
  field_name: string;
  field_key: string;
  field_type: 'text' | 'textarea' | 'rich_text' | 'image' | 'file' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect';
  is_required: boolean;
  is_multilingual: boolean;
  default_value?: string | null;
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min?: number;
    max?: number;
    min_date?: string;
    max_date?: string;
    options?: string[]; // 用于 select 和 multiselect
    allowed_formats?: string[];
    max_size?: number;
    dimensions?: {
      min_width?: number;
      min_height?: number;
    };
    [key: string]: any;
  };
  display_name?: string;
  description?: string;
  placeholder?: string;
  group_name?: string;
  primary_language: string;
  sort_order: number;
  status: string;
  translations: FieldTranslation[];
  created_at: string;
  updated_at: string;
}

/**
 * 模板基本信息
 */
export interface Template {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  primary_language: string;
  template_type: string;
  is_system: boolean;
  is_public: boolean;
  template_structure: Record<string, any>;
  default_settings: Record<string, any>;
  usage_count: number;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * 模板数据响应
 */
export interface TemplateData {
  template: Template;
  translations: Translation[];
  fields: TemplateField[];
  statistics?: {
    fields_count: number;
    active_fields_count: number;
    multilingual_fields_count: number;
    usage_count: number;
  };
}

/**
 * 模板响应
 */
export interface TemplateResponse {
  success: boolean;
  data: TemplateData;
}

/**
 * 获取客户端配置
 */
function getClientConfig() {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  return {
    tenantId: win?.__ASTRO_TENANT_ID__ || APP_CONFIG.tenantId,
    locale: win?.__ASTRO_LOCALE__ || 'zh-CN',
    apiBaseUrl: APP_CONFIG.apiBaseUrl,
  };
}

/**
 * 获取模板数据（客户端，使用 window 或 APP_CONFIG 中的 tenantId）
 * @param templateId 模板ID
 */
export async function fetchTemplate(templateId: string): Promise<TemplateData> {
  const config = getClientConfig();
  const data = await fetchTemplateForTenant(templateId, config.tenantId);
  if (!data) {
    throw new Error(`Failed to fetch template: ${templateId}`);
  }
  return data;
}

/**
 * 服务端 / 显式 tenant 拉取模板；失败返回 null，不抛错
 */
export async function fetchTemplateForTenant(
  templateId: string,
  tenantId: string
): Promise<TemplateData | null> {
  const id = String(templateId || '').trim();
  const tenant = String(tenantId || '').trim();
  if (!id || !tenant) return null;

  try {
    const url = `${APP_CONFIG.apiBaseUrl}/tenant_${tenant}/articles/templates/template-${id}.json`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const result = (await response.json()) as TemplateResponse;
    if (!result.success || !result.data?.fields) return null;
    return result.data;
  } catch (error) {
    console.error('[template] fetchTemplateForTenant failed:', error);
    return null;
  }
}

/**
 * 根据语言代码从translations数组中获取对应的翻译
 */
export function getTranslationByLocale(
  translations: Array<{ language_code: string; is_primary?: boolean; [key: string]: any }>,
  locale: string,
  fallback?: any
): any {
  if (!translations || translations.length === 0) return fallback || null;
  
  // 精确匹配
  const exactMatch = translations.find(t => t.language_code === locale);
  if (exactMatch) return exactMatch;

  // 大小写不敏感精确匹配（避免 en-us vs en-US 这类差异）
  const target = (locale || '').toLowerCase();
  const ciExact = translations.find(t => (t.language_code || '').toLowerCase() === target);
  if (ciExact) return ciExact;
  
  // 匹配主语言（is_primary = true）
  const primaryMatch = translations.find(t => t.is_primary);
  if (primaryMatch) return primaryMatch;
  
  // 匹配语言部分（如 zh-CN 匹配 zh）
  const langPart = target.split('-')[0];
  const langMatch = translations.find(t => (t.language_code || '').toLowerCase().startsWith(`${langPart}-`));
  if (langMatch) return langMatch;
  
  // 无匹配时：优先使用 fallback（通常是字段本体/默认语言内容），避免被 translations[0]（例如 zh-CN）覆盖
  return fallback || translations[0] || null;
}

/**
 * 导出客户端对象
 */
export const clientTemplate = {
  fetchTemplate,
  getTranslationByLocale,
};

