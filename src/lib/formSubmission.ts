/**
 * 表单提交服务
 */

import { APP_CONFIG } from '../config/app';
import { getCurrentMembershipId } from './auth';

/**
 * 创建表单提交请求
 */
export interface CreateFormSubmissionRequest {
  template_id: string;
  type: string;
  membership_id?: string | null;
  metadata: Record<string, any>;
  related_article_id?: string | null;
  related_order_id?: string | null;
}

/**
 * 表单提交响应
 */
export interface FormSubmissionResponse {
  success: boolean;
  data: {
    form_submission: {
      id: string;
      tenant_id: string;
      template_id: string;
      type: string;
      membership_id: string | null;
      metadata: Record<string, any>;
      related_article_id: string | null;
      related_order_id: string | null;
      created_at: string;
      updated_at: string;
    };
  };
  metadata?: {
    timestamp: string;
    request_id: string;
    version: string;
  };
}

/**
 * 表单提交错误响应
 */
export interface FormSubmissionError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
  metadata?: {
    timestamp: string;
    request_id: string;
    version: string;
  };
}

/**
 * 获取客户端配置
 */
function getClientConfig() {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  return {
    tenantId: win?.__ASTRO_TENANT_ID__ || APP_CONFIG.tenantId,
    apiBaseUrl: APP_CONFIG.apiBaseUrl01,
  };
}

/**
 * 创建表单提交
 * @param request 表单提交请求
 */
export async function createFormSubmission(
  request: CreateFormSubmissionRequest
): Promise<FormSubmissionResponse> {
  const config = getClientConfig();
  
  // 如果没有提供 membership_id，尝试从当前用户获取
  let membershipId = request.membership_id;
  if (!membershipId) {
    try {
      membershipId = getCurrentMembershipId() || undefined;
    } catch (error) {
      // 如果获取失败，保持为 undefined（允许匿名提交）
      membershipId = undefined;
    }
  }
  
  const url = `${config.apiBaseUrl}/form-submissions`;
  
  const requestBody: CreateFormSubmissionRequest = {
    ...request,
    membership_id: membershipId || null,
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': config.tenantId,
    },
    body: JSON.stringify(requestBody),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const error = data as FormSubmissionError;
    throw new Error(error.error?.message || `Failed to submit form: ${response.statusText}`);
  }
  
  return data as FormSubmissionResponse;
}

/**
 * 导出客户端对象
 */
export const clientFormSubmission = {
  createFormSubmission,
};

