/**
 * 货币相关的类型定义和服务
 */

export interface Currency {
  id: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  decimal_places: number;
  is_active: boolean;
  is_base_currency: boolean;
  metadata: Record<string, any>;
  primary_language: string;
  sort_order: number;
  status: string;
  tenant_id: string;
  translations: Array<{
    currency_name: string;
    is_primary: boolean;
    language_code: string;
  }> | null;
  created_at: string;
  updated_at: string;
}

export interface CurrenciesResponse {
  currencies: Currency[];
}

export interface ExchangeRate {
  id: string;
  from_currency_id: string;
  to_currency_id: string;
  exchange_rate: string;
  inverse_rate: string;
  rate_date: string;
  rate_source: string;
  status: string;
  tenant_id: string;
  metadata: Record<string, any>;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRatesResponse {
  exchange_rates: ExchangeRate[];
}

/**
 * 从 API 获取货币列表
 */
export async function fetchCurrencies(tenantId: string): Promise<Currency[]> {
  const url = `https://gt6json.shopasb.io/tenant_${tenantId}/currencies/currencies-${tenantId}.json`;
  
  try {
    const response = await fetch(url, {
      // 在 SSR 中禁用缓存，确保获取最新数据
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch currencies: ${response.statusText}`);
    }
    
    const data: CurrenciesResponse = await response.json();
    
    if (!data.currencies || !Array.isArray(data.currencies)) {
      throw new Error('Invalid currencies response');
    }
    
    // 只返回已启用且状态为 active 的货币
    return data.currencies
      .filter(currency => currency.is_active && currency.status === 'active')
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    // 返回默认货币作为后备
    return [
      {
        id: 'default-usd',
        currency_code: 'USD',
        currency_name: 'USD',
        currency_symbol: '$',
        decimal_places: 2,
        is_active: true,
        is_base_currency: true,
        metadata: {},
        primary_language: 'en-US',
        sort_order: 1,
        status: 'active',
        tenant_id: tenantId,
        translations: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
  }
}

/**
 * 从 API 获取汇率列表
 */
export async function fetchExchangeRates(tenantId: string): Promise<ExchangeRate[]> {
  const url = `https://gt6json.shopasb.io/tenant_${tenantId}/currencies/exchange-rates-${tenantId}.json`;
  
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    
    const data: ExchangeRatesResponse = await response.json();
    
    if (!data.exchange_rates || !Array.isArray(data.exchange_rates)) {
      throw new Error('Invalid exchange rates response');
    }
    
    // 只返回状态为 active 的汇率
    return data.exchange_rates.filter(rate => rate.status === 'active');
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // 返回空数组作为后备
    return [];
  }
}

/**
 * 获取默认货币（base currency）
 */
export function getDefaultCurrency(currencies: Currency[]): Currency | null {
  const baseCurrency = currencies.find(currency => currency.is_base_currency);
  return baseCurrency || currencies[0] || null;
}

/**
 * 根据货币代码查找货币
 */
export function findCurrencyByCode(currencies: Currency[], currencyCode: string): Currency | null {
  return currencies.find(currency => currency.currency_code === currencyCode) || null;
}

/**
 * 计算汇率：从默认货币到当前货币的汇率
 * 如果默认货币和当前货币相同，返回 1
 * 如果当前货币是默认货币，返回 1
 * 如果默认货币是当前货币，返回 1
 */
export function calculateExchangeRate(
  defaultCurrency: Currency,
  currentCurrency: Currency,
  exchangeRates: ExchangeRate[]
): number {
  // 如果默认货币和当前货币相同，汇率为 1
  if (defaultCurrency.id === currentCurrency.id) {
    return 1;
  }

  // 查找从默认货币到当前货币的汇率
  const rate = exchangeRates.find(
    r => r.from_currency_id === defaultCurrency.id && r.to_currency_id === currentCurrency.id
  );

  if (rate) {
    return parseFloat(rate.exchange_rate);
  }

  // 如果没有找到直接汇率，尝试查找反向汇率并使用 inverse_rate
  const inverseRate = exchangeRates.find(
    r => r.from_currency_id === currentCurrency.id && r.to_currency_id === defaultCurrency.id
  );

  if (inverseRate) {
    return parseFloat(inverseRate.inverse_rate);
  }

  // 如果都找不到，返回 1（默认）
  console.warn(
    `Exchange rate not found from ${defaultCurrency.currency_code} to ${currentCurrency.currency_code}, using 1.0`
  );
  return 1;
}

