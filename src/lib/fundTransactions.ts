/**
 * 资金流水相关的API服务
 * 用于处理资金流水的查询等操作
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken as getAuthSessionToken, getUser } from './auth';

const API_BASE_URL = APP_CONFIG.apiBaseUrl01;

/**
 * 资金流水数据结构
 */
export interface FundTransaction {
  id: string;
  tenant_id: string;
  user_id: string;
  fund_account_id: string;
  sub_account_id?: string;
  transaction_number: string;
  transaction_type: 'deposit' | 'withdraw' | 'payment' | 'refund' | 'transfer' | 'freeze' | 'unfreeze' | 'adjustment';
  transaction_category: string;
  amount: number; // 交易金额，正数为收入，负数为支出
  balance_before: number;
  balance_after: number;
  related_order_id?: string;
  related_transaction_id?: string;
  transaction_status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_title: string;
  transaction_desc?: string;
  payment_method?: string;
  payment_reference?: string;
  transaction_date: string;
  completed_date?: string;
  operator_id?: string;
  operator_type?: 'system' | 'user' | 'admin';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * 获取资金流水列表请求参数
 */
export interface GetFundTransactionsParams {
  user_id?: string;
  fund_account_id?: string;
  transaction_type?: 'deposit' | 'withdraw' | 'payment' | 'refund' | 'transfer' | 'freeze' | 'unfreeze' | 'adjustment';
  page?: number;
  page_size?: number;
  key?: string;
}

/**
 * 获取资金流水列表响应
 */
export interface GetFundTransactionsResponse {
  success: boolean;
  data: {
    transactions: FundTransaction[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
    };
  };
}

/**
 * 获取客户端配置
 */
function getClientConfig(): {
  tenantId: string;
  apiBaseUrl: string;
  key: string;
} {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  return {
    tenantId: win?.__ASTRO_TENANT_ID__ || APP_CONFIG.tenantId,
    apiBaseUrl: API_BASE_URL,
    key: win?.__ASTRO_KEY__ || APP_CONFIG.key,
  };
}

/**
 * 获取资金流水列表
 */
export async function getFundTransactions(params: GetFundTransactionsParams): Promise<GetFundTransactionsResponse> {
  const config = getClientConfig();
  
  // 构建查询参数
  const queryParams = new URLSearchParams();
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.fund_account_id) queryParams.append('fund_account_id', params.fund_account_id);
  if (params.transaction_type) queryParams.append('transaction_type', params.transaction_type);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.page_size) queryParams.append('page_size', params.page_size.toString());
  
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
  
  const sessionToken = getAuthSessionToken();
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  
  const response = await fetch(`${config.apiBaseUrl}/fund-transactions?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to get fund transactions: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to get fund transactions');
  }
  
  return data;
}

/**
 * 客户端专用的资金流水函数
 */
export const clientFundTransactions = {
  getFundTransactions,
};

