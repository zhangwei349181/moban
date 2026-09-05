/**
 * 语言相关的类型定义和服务
 */

import { APP_CONFIG } from '../config/app';

export interface Language {
  id: string;
  language_code: string;
  name: string;
  native_name: string;
  is_default: boolean;
  is_enabled: boolean;
  sort_order: number;
  status: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface LanguagesResponse {
  success: boolean;
  data: {
    languages: Language[];
  };
}

/**
 * 从 API 获取语言列表
 */
export async function fetchLanguages(tenantId: string): Promise<Language[]> {
  const url = `https://gt6json.shopasb.io/tenant_${tenantId}/languages/languages-${tenantId}.json`;
  
  try {
    const response = await fetch(url, {
      // 在 SSR 中禁用缓存，确保获取最新数据
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch languages: ${response.statusText}`);
    }
    
    const data: LanguagesResponse = await response.json();
    
    if (!data.success || !data.data?.languages) {
      throw new Error('Invalid languages response');
    }
    
    // 只返回已启用且状态为 active 的语言
    return data.data.languages
      .filter(lang => lang.is_enabled && lang.status === 'active')
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch (error) {
    console.error('Error fetching languages:', error);
    // 与 APP_CONFIG.defaultLocale 一致，避免 API 失败时误用中文
    const code = APP_CONFIG.defaultLocale;
    return [
      {
        id: 'default-fallback',
        language_code: code,
        name: code,
        native_name: code,
        is_default: true,
        is_enabled: true,
        sort_order: 1,
        status: 'active',
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
  }
}

/**
 * 获取默认语言代码
 */
export function getDefaultLanguageCode(languages: Language[]): string {
  const defaultLang = languages.find(lang => lang.is_default);
  return defaultLang?.language_code || languages[0]?.language_code || APP_CONFIG.defaultLocale;
}

/**
 * 将 language_code 转换为 Astro 的 locale 格式
 * 例如: zh-CN -> zh-CN, en-US -> en-US
 */
export function normalizeLocale(languageCode: string): string {
  return languageCode.toLowerCase();
}

