import { defineMiddleware } from 'astro:middleware';
import { APP_CONFIG, GT6_TENANT_ID_FALLBACK_WARN, GT6_TENANT_ID_HEADER, getFallbackTenantId } from './config/app';
import { fetchTenantStaticJson } from './lib/tenant';
import { fetchLanguages, getDefaultLanguageCode, normalizeLocale, type Language } from './lib/languages';
import { 
  fetchCurrencies, 
  fetchExchangeRates, 
  getDefaultCurrency, 
  findCurrencyByCode,
  calculateExchangeRate,
  type Currency 
} from './lib/currencies';

function resolveTenantIdFromRequest(request: Request): { tenantId: string; headerMissing: boolean } {
  const fromHeader = request.headers.get(GT6_TENANT_ID_HEADER)?.trim();
  if (fromHeader) {
    return { tenantId: fromHeader, headerMissing: false };
  }

  console.warn(GT6_TENANT_ID_FALLBACK_WARN);
  return { tenantId: getFallbackTenantId(), headerMissing: true };
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies: cookieStore } = context;
  const cookies = cookieStore ?? (context as { cookies?: typeof cookieStore }).cookies;
  
  const { tenantId, headerMissing } = resolveTenantIdFromRequest(context.request);
  (locals as any).tenantId = tenantId;
  (locals as any).gt6TenantHeaderMissing = headerMissing;
  (locals as any).apiBaseUrl01 = APP_CONFIG.apiBaseUrl01;
  (locals as any).salesApiV1Base = APP_CONFIG.salesApiV1Base;
  (locals as any).key = APP_CONFIG.key;

  if ((locals as any).tenant === undefined) {
    (locals as any).tenant = await fetchTenantStaticJson((locals as any).tenantId);
  }
  
  // 获取语言列表（缓存到 locals，避免重复请求）
  if (!(locals as any).languages) {
    (locals as any).languages = await fetchLanguages((locals as any).tenantId);
  }
  
  const languages = (locals as any).languages as Language[];
  
  // 从 Cookie 获取语言，如果没有则使用默认语言
  const cookieLocale = cookies?.get('locale')?.value;
  let currentLocale: string;
  
  if (cookieLocale) {
    // 验证 Cookie 中的语言是否在可用语言列表中
    const matchingLang = languages.find(
      (lang: Language) => normalizeLocale(lang.language_code) === normalizeLocale(cookieLocale)
    );
    if (matchingLang) {
      currentLocale = matchingLang.language_code;
    } else {
      // Cookie 中的语言无效，使用默认语言并更新 Cookie
      currentLocale = getDefaultLanguageCode(languages);
      cookies?.set('locale', currentLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1年
        sameSite: 'lax'
      });
    }
  } else {
    // 没有 Cookie，使用默认语言并设置 Cookie
    currentLocale = getDefaultLanguageCode(languages);
    cookies?.set('locale', currentLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1年
      sameSite: 'lax'
    });
  }
  
  // 设置当前语言到 locals（全局可用）
  (locals as any).locale = currentLocale;
  
  // ===== 货币相关逻辑 =====
  // 获取货币列表（缓存到 locals，避免重复请求）
  if (!(locals as any).currencies) {
    (locals as any).currencies = await fetchCurrencies((locals as any).tenantId);
  }
  
  const currencies = (locals as any).currencies as Currency[];
  
  // 获取汇率列表（缓存到 locals，避免重复请求）
  if (!(locals as any).exchangeRates) {
    (locals as any).exchangeRates = await fetchExchangeRates((locals as any).tenantId);
  }
  
  const exchangeRates = (locals as any).exchangeRates;
  
  // 获取默认货币（base currency）
  const defaultCurrency = getDefaultCurrency(currencies);
  if (defaultCurrency) {
    (locals as any).defaultCurrency = defaultCurrency;
  }
  
  // 从 Cookie 获取当前货币，如果没有则使用默认货币
  const cookieCurrency = cookies?.get('currency')?.value;
  let currentCurrency: Currency | null = null;
  let exchangeRate: number = 1;
  
  if (!defaultCurrency) {
    // 如果没有默认货币，无法继续处理
    (locals as any).currentCurrency = null;
    (locals as any).exchangeRate = 1;
    return next();
  }
  
  if (cookieCurrency) {
    // 验证 Cookie 中的货币是否在可用货币列表中
    const matchingCurrency = findCurrencyByCode(currencies, cookieCurrency);
    if (matchingCurrency) {
      currentCurrency = matchingCurrency;
    } else {
      // Cookie 中的货币无效，使用默认货币并更新 Cookie
      currentCurrency = defaultCurrency;
      cookies?.set('currency', currentCurrency.currency_code, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1年
        sameSite: 'lax'
      });
      exchangeRate = 1; // 默认货币汇率为 1
    }
  } else {
    // 没有 Cookie，使用默认货币并设置 Cookie
    currentCurrency = defaultCurrency;
    cookies?.set('currency', currentCurrency.currency_code, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1年
      sameSite: 'lax'
    });
    exchangeRate = 1; // 初始时当前货币就是默认货币，汇率为 1
  }
  
  // 计算汇率（从默认货币到当前货币）
  if (defaultCurrency && currentCurrency) {
    if (currentCurrency.id === defaultCurrency.id) {
      // 如果当前货币就是默认货币，汇率为 1
      exchangeRate = 1;
    } else {
      // 否则计算汇率
      exchangeRate = calculateExchangeRate(defaultCurrency, currentCurrency, exchangeRates);
    }
  }
  
  // 设置货币相关数据到 locals（全局可用）
  if (currentCurrency) {
    (locals as any).currentCurrency = currentCurrency;
  }
  (locals as any).exchangeRate = exchangeRate;
  
  return next();
});

