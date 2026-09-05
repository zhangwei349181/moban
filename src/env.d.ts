/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SALES_API_V1_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    tenantId: string;
    locale: string;
    languages: import('./lib/languages').Language[];
    currencies: import('./lib/currencies').Currency[];
    exchangeRates: import('./lib/currencies').ExchangeRate[];
    defaultCurrency: import('./lib/currencies').Currency | null;
    currentCurrency: import('./lib/currencies').Currency | null;
    exchangeRate: number;
    apiBaseUrl01: string;
    salesApiV1Base: string;
    key: string;
  }
}

// 声明全局 window 对象上的属性
declare global {
  interface Window {
    __ASTRO_LOCALE__?: string;
    __ASTRO_TENANT_ID__?: string;
    __ASTRO_EMAIL_VERIFY__?: boolean;
    __ASTRO_LANGUAGES__?: any[];
    __ASTRO_CURRENCIES__?: any[];
    __ASTRO_DEFAULT_CURRENCY__?: any;
    __ASTRO_CURRENT_CURRENCY__?: any;
    __ASTRO_EXCHANGE_RATE__?: number;
    __ASTRO_API_BASE_URL_01__?: string;
    __ASTRO_SALES_API_V1_BASE__?: string;
    __ASTRO_KEY__?: string;
    updateCartCount?: () => void;
  }
}

