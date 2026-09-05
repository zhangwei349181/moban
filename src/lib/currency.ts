/**
 * 货币工具函数
 * 在服务端和客户端都可以使用
 */

import type { Currency } from './currencies';

/**
 * 在 Astro 组件中获取默认货币
 * 使用方式：const defaultCurrency = getDefaultCurrency(Astro);
 */
export function getDefaultCurrency(astro?: any): Currency | null {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.defaultCurrency) {
      return astro.locals.defaultCurrency;
    }
    return null;
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_DEFAULT_CURRENCY__ || null;
  }
}

/**
 * 在 Astro 组件中获取当前货币
 * 使用方式：const currentCurrency = getCurrentCurrency(Astro);
 */
export function getCurrentCurrency(astro?: any): Currency | null {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.currentCurrency) {
      return astro.locals.currentCurrency;
    }
    return null;
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_CURRENT_CURRENCY__ || null;
  }
}

/**
 * 在 Astro 组件中获取汇率（默认货币/当前货币）
 * 使用方式：const rate = getExchangeRate(Astro);
 */
export function getExchangeRate(astro?: any): number {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.exchangeRate !== undefined) {
      return astro.locals.exchangeRate;
    }
    return 1;
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_EXCHANGE_RATE__ || 1;
  }
}

/**
 * 在 Astro 组件中获取所有可用货币列表
 * 使用方式：const currencies = getAvailableCurrencies(Astro);
 */
export function getAvailableCurrencies(astro?: any): Currency[] {
  if (import.meta.env.SSR) {
    // 服务端：从传入的 Astro 对象获取
    if (astro?.locals?.currencies) {
      return astro.locals.currencies;
    }
    return [];
  } else {
    // 客户端：从全局变量获取
    return (window as any).__ASTRO_CURRENCIES__ || [];
  }
}

/**
 * 客户端专用的获取函数（用于客户端 JavaScript）
 */
export const clientCurrency = {
  getDefaultCurrency(): Currency | null {
    return (window as any).__ASTRO_DEFAULT_CURRENCY__ || null;
  },
  getCurrentCurrency(): Currency | null {
    return (window as any).__ASTRO_CURRENT_CURRENCY__ || null;
  },
  getExchangeRate(): number {
    return (window as any).__ASTRO_EXCHANGE_RATE__ || 1;
  },
  getAvailableCurrencies(): Currency[] {
    return (window as any).__ASTRO_CURRENCIES__ || [];
  }
};

