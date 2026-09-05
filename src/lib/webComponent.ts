/**
 * Web 组件静态 JSON（CDN）加载
 */

import { APP_CONFIG } from '../config/app';

export interface WebComponentRecord {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  components_code: string;
  /** 组件独立字段，默认 static；layout 主题为 `layout`。不在 metadata 里。 */
  type?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WebComponentResponse {
  success: boolean;
  data: {
    component: WebComponentRecord;
    children: Array<{ id: string; components_code: string }>;
  };
}

/**
 * 从 CDN 拉取单组件详情（服务端 SSR / 构建时）
 */
export async function fetchWebComponent(
  componentsCode: string,
  tenantId: string = APP_CONFIG.tenantId,
  options?: { optional?: boolean }
): Promise<WebComponentRecord | null> {
  const url = `${APP_CONFIG.apiBaseUrl}/tenant_${tenantId}/web_components/${componentsCode}.json`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      if (options?.optional && response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch web component "${componentsCode}": ${response.statusText}`);
    }

    const json = (await response.json()) as WebComponentResponse;
    if (!json.success || !json.data?.component) {
      throw new Error(`Invalid web component response: ${componentsCode}`);
    }

    return json.data.component;
  } catch (error) {
    console.error(`[webComponent] ${componentsCode}:`, error);
    return null;
  }
}
