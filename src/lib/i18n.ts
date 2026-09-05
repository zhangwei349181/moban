/**
 * 全局 i18n 工具函数
 * 在服务端和客户端都可以使用
 */

import { APP_CONFIG } from '../config/app';
import type { Language } from './languages';

/**
 * 在 Astro 组件中获取当前语言代码
 * 使用方式：const locale = getCurrentLocale(Astro);
 */
export function getCurrentLocale(astro?: any): string {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.locale) {
      return astro.locals.locale;
    }
    return APP_CONFIG.defaultLocale;
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_LOCALE__ || APP_CONFIG.defaultLocale;
  }
}

/**
 * 在 Astro 组件中获取当前 tenant_id
 * 使用方式：const tenantId = getTenantId(Astro);
 */
export function getTenantId(astro?: any): string {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.tenantId) {
      return astro.locals.tenantId;
    }
    return APP_CONFIG.tenantId;
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_TENANT_ID__ || '';
  }
}

/**
 * 在 Astro 组件中获取所有可用语言列表
 * 使用方式：const languages = getAvailableLanguages(Astro);
 */
export function getAvailableLanguages(astro?: any): Language[] {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.languages) {
      return astro.locals.languages;
    }
    return [];
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_LANGUAGES__ || [];
  }
}

/**
 * 在 Astro 组件中获取 API 基础路径（v1）
 * 使用方式：const apiBaseUrl01 = getApiBaseUrl01(Astro);
 */
export function getApiBaseUrl01(astro?: any): string {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.apiBaseUrl01) {
      return astro.locals.apiBaseUrl01;
    }
    return '';
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_API_BASE_URL_01__ || '';
  }
}

/**
 * 在 Astro 组件中获取 API Key
 * 使用方式：const key = getApiKey(Astro);
 */
export function getApiKey(astro?: any): string {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.key) {
      return astro.locals.key;
    }
    return '';
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_KEY__ || '';
  }
}

/**
 * 客户端专用的获取函数（用于客户端 JavaScript）
 */
export const clientI18n = {
  getCurrentLocale(): string {
    return (window as any).__ASTRO_LOCALE__ || APP_CONFIG.defaultLocale;
  },
  getTenantId(): string {
    return (window as any).__ASTRO_TENANT_ID__ || '';
  },
  getAvailableLanguages(): Language[] {
    return (window as any).__ASTRO_LANGUAGES__ || [];
  },
  getApiBaseUrl01(): string {
    return (window as any).__ASTRO_API_BASE_URL_01__ || '';
  },
  getApiKey(): string {
    return (window as any).__ASTRO_KEY__ || '';
  }
};

