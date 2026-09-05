/**
 * 用户资金账户相关的API服务
 * 用于处理用户资金账户的查询等操作
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken as getAuthSessionToken, getUser } from './auth';

const API_BASE_URL = APP_CONFIG.apiBaseUrl01;

/**
 * 用户资金账户数据结构
 */
export interface UserFund {
  id: string;
  tenant_id: string;
  user_id: string;
  fund_type: 'wallet' | 'credit' | 'points' | 'gift_card';
  available_balance: number; // 可用余额（USD）
  frozen_balance: number; // 冻结余额（USD）
  total_balance: number; // 总余额（USD），total_balance = available_balance + frozen_balance
  account_status: 'active' | 'frozen' | 'closed';
  daily_limit?: number | null; // 日限额（USD），NULL表示无限制
  monthly_limit?: number | null; // 月限额（USD），NULL表示无限制
  single_transaction_limit?: number | null; // 单笔交易限额（USD），NULL表示无限制
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * 获取用户资金账户列表请求参数
 */
export interface GetUserFundsParams {
  user_id?: string;
  fund_type?: 'wallet' | 'credit' | 'points' | 'gift_card';
  account_status?: 'active' | 'frozen' | 'closed';
  page?: number;
  page_size?: number;
  key?: string;
}

/**
 * 获取用户资金账户列表响应
 */
export interface GetUserFundsResponse {
  success: boolean;
  data: {
    funds: UserFund[];
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
 * 获取用户资金账户列表
 */
export async function getUserFunds(params: GetUserFundsParams): Promise<GetUserFundsResponse> {
  const config = getClientConfig();
  
  // 构建查询参数
  const queryParams = new URLSearchParams();
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.fund_type) queryParams.append('fund_type', params.fund_type);
  if (params.account_status) queryParams.append('account_status', params.account_status);
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
  
  const response = await fetch(`${config.apiBaseUrl}/user-funds?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Failed to get user funds: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to get user funds');
  }
  
  return data;
}

/**
 * 客户端专用的用户资金账户函数
 */
export const clientUserFunds = {
  getUserFunds,
};

