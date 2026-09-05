/**
 * 地址管理 API 服务
 */

import { getSessionToken, getAuthTenantId, getCurrentMembershipId } from './auth.js';
import { APP_CONFIG } from '../config/app.js';

const API_BASE_URL = APP_CONFIG.apiBaseUrl01 || 'https://gt6api.goodsoftwarepro.com/api/v1';

/**
 * 地址数据结构
 */
export interface Address {
  id: string;
  membership_id: string;
  address_name: string;
  recipient_name: string;
  address_line1: string;
  address_line2?: string | null;
  phone_number: string;
  postal_code?: string | null;
  region_id: string;
  address_type: 'shipping' | 'billing';
  is_default: boolean;
  is_verified: boolean;
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * 获取地址列表响应
 */
export interface GetAddressesResponse {
  success: boolean;
  data: {
    addresses: Address[];
    pagination?: {
      total: number;
      page: number;
      page_size: number;
    };
  };
}

/**
 * 获取单个地址响应
 */
export interface GetAddressResponse {
  success: boolean;
  data: {
    address: Address;
  };
}

/**
 * 创建地址请求参数
 */
export interface CreateAddressRequest {
  membership_id: string;
  address_type: 'shipping' | 'billing';
  address_name: string;
  recipient_name: string;
  phone_number: string;
  region_id: string;
  address_line1: string;
  address_line2?: string | null;
  postal_code?: string | null;
  is_default?: boolean;
  is_verified?: boolean;
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

/**
 * 更新地址请求参数（允许部分更新）
 */
export interface UpdateAddressRequest {
  address_name?: string;
  recipient_name?: string;
  phone_number?: string;
  region_id?: string;
  address_line1?: string;
  address_line2?: string | null;
  postal_code?: string | null;
  address_type?: 'shipping' | 'billing';
  is_default?: boolean;
  is_verified?: boolean;
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

/**
 * 获取地址列表
 */
export async function getAddresses(params?: {
  membership_id?: string;
  page?: number;
  page_size?: number;
}): Promise<GetAddressesResponse> {
  const sessionToken = getSessionToken();
  const tenantId = getAuthTenantId();
  
  if (!sessionToken || !tenantId) {
    throw new Error('未登录，请先登录');
  }

  const queryParams = new URLSearchParams();
  const membershipId = params?.membership_id ?? getCurrentMembershipId();
  if (membershipId) {
    queryParams.append('membership_id', membershipId);
  }
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }

  const url = `${API_BASE_URL}/addresses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'X-Tenant-ID': tenantId,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.error?.message || errorData.message || '获取地址列表失败');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || result.message || '获取地址列表失败');
  }

  return result;
}

/**
 * 获取单个地址详情
 */
export async function getAddress(addressId: string): Promise<GetAddressResponse> {
  const sessionToken = getSessionToken();
  const tenantId = getAuthTenantId();
  
  if (!sessionToken || !tenantId) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'X-Tenant-ID': tenantId,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.error?.message || errorData.message || '获取地址详情失败');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || result.message || '获取地址详情失败');
  }

  return result;
}

/**
 * 创建地址
 */
export async function createAddress(request: CreateAddressRequest): Promise<GetAddressResponse> {
  const sessionToken = getSessionToken();
  const tenantId = getAuthTenantId();
  
  if (!sessionToken || !tenantId) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_BASE_URL}/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.error?.message || errorData.message || '创建地址失败');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || result.message || '创建地址失败');
  }

  return result;
}

/**
 * 更新地址
 */
export async function updateAddress(
  addressId: string,
  request: UpdateAddressRequest
): Promise<GetAddressResponse> {
  const sessionToken = getSessionToken();
  const tenantId = getAuthTenantId();
  
  if (!sessionToken || !tenantId) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.error?.message || errorData.message || '更新地址失败');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || result.message || '更新地址失败');
  }

  return result;
}

/**
 * 删除地址
 */
export async function deleteAddress(addressId: string): Promise<{ success: boolean }> {
  const sessionToken = getSessionToken();
  const tenantId = getAuthTenantId();
  
  if (!sessionToken || !tenantId) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'X-Tenant-ID': tenantId,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.error?.message || errorData.message || '删除地址失败');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || result.message || '删除地址失败');
  }

  return result;
}

/**
 * 导出客户端对象
 */
export const clientAddress = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};

