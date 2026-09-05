/**
 * 翻译工具函数
 * 用于获取多语言文本
 */

import translations from '../i18n/translations.json';

export type TranslationKey = keyof typeof translations['zh-CN'];

/**
 * 在服务端获取翻译文本
 * 使用方式：const text = getTranslation(Astro, 'language_code');
 */
export function getTranslation(astro: any, key: TranslationKey): string {
  if (import.meta.env.SSR) {
    // 服务端：从 Astro.locals.locale 获取当前语言
    const locale = astro?.locals?.locale || 'zh-CN';
    return getTranslationByLocale(locale, key);
  } else {
    // 客户端：从全局变量获取当前语言
    const locale = (window as any).__ASTRO_LOCALE__ || 'zh-CN';
    return getTranslationByLocale(locale, key);
  }
}

/**
 * 根据语言代码获取翻译文本
 */
export function getTranslationByLocale(locale: string, key: TranslationKey): string {
  const localeTranslations = (translations as any)[locale];
  if (localeTranslations && localeTranslations[key]) {
    return localeTranslations[key];
  }
  
  // 如果没有找到对应语言的翻译，尝试使用中文作为后备
  const fallbackTranslations = (translations as any)['zh-CN'];
  if (fallbackTranslations && fallbackTranslations[key]) {
    return fallbackTranslations[key];
  }
  
  // 如果还是没有，返回 key 本身
  return key;
}

/**
 * 获取多个翻译文本，返回翻译对象
 * 使用方式：const t = getTranslations(Astro);
 */
export function getTranslations(astro?: any): Record<TranslationKey, string> {
  const locale = import.meta.env.SSR 
    ? (astro?.locals?.locale || 'zh-CN')
    : ((window as any).__ASTRO_LOCALE__ || 'zh-CN');
  
  const localeTranslations = (translations as any)[locale] || (translations as any)['zh-CN'];
  const result: Record<string, string> = {};
  
  // 获取所有翻译键
  const keys = Object.keys((translations as any)['zh-CN']) as TranslationKey[];
  
  // 为每个键获取翻译
  keys.forEach(key => {
    result[key] = getTranslationByLocale(locale, key);
  });
  
  return result as Record<TranslationKey, string>;
}

/**
 * 获取常用翻译对象（示例页面使用）
 * 使用方式：const t = getCommonTranslations(Astro);
 */
export function getCommonTranslations(astro?: any) {
  return {
    languageCode: getTranslation(astro, 'language_code'),
    tenantId: getTranslation(astro, 'tenant_id'),
    currentLanguageInfo: getTranslation(astro, 'current_language_info'),
    apiParams: getTranslation(astro, 'api_params'),
    usageExamples: getTranslation(astro, 'usage_examples'),
    apiUsageExample: getTranslation(astro, 'api_usage_example'),
    wishlist: getTranslation(astro, 'Wishlist'),
  };
}

/**
 * 客户端专用的翻译函数
 */
export const clientTranslations = {
  get(key: TranslationKey): string {
    const locale = (window as any).__ASTRO_LOCALE__ || 'zh-CN';
    return getTranslationByLocale(locale, key);
  },
  
  /**
   * 获取所有翻译（客户端）
   */
  getAll(): Record<TranslationKey, string> {
    const locale = (window as any).__ASTRO_LOCALE__ || 'zh-CN';
    const localeTranslations = (translations as any)[locale] || (translations as any)['zh-CN'];
    const result: Record<string, string> = {};
    
    const keys = Object.keys((translations as any)['zh-CN']) as TranslationKey[];
    keys.forEach(key => {
      result[key] = getTranslationByLocale(locale, key);
    });
    
    return result as Record<TranslationKey, string>;
  }
};

