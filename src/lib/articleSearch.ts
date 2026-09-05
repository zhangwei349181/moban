/**
 * 文章/产品查询 API 服务
 */

import { APP_CONFIG } from '../config/app.js';

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

/**
 * 获取客户端配置
 */
function getClientConfig(): {
  tenantId: string;
  apiBaseUrl: string;
  apiBaseUrl01: string;
} {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  return {
    tenantId: win?.__ASTRO_TENANT_ID__ || APP_CONFIG.tenantId,
    apiBaseUrl: API_BASE_URL,
    apiBaseUrl01: APP_CONFIG.apiBaseUrl01,
  };
}

/**
 * 查询文章ID列表的请求参数
 */
export interface SearchArticlesParams {
  page?: number;
  page_size?: number;
  article_type?: string;
  status?: string;
  publish_status?: string;
  content_title?: string; // 标题模糊查询
  category_ids?: string[];
  tag_ids?: string[];
  attribute_codes?: string[];
  attribute_value_ids?: string[];
  metadata_template_field_key?: string;
  metadata_template_field_value_min?: string;
  metadata_template_field_value_max?: string;
  sort_by_template_field_key?: string; // 排序字段（如 "price"）
  sort_order?: 'asc' | 'desc'; // 排序方向：asc（升序）或 desc（降序）
  /** 内容模板 ID，逗号分隔多个；也可为 `null` */
  template_id?: string;
  [key: string]: any; // 允许其他查询参数
}

/**
 * 查询文章ID列表的响应
 */
export interface SearchArticlesResponse {
  success: boolean;
  data: {
    ids: string[];
    total: number;
    page: number;
    page_size: number;
  };
  metadata?: {
    timestamp: string;
    request_id?: string;
    version?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 查询文章ID列表
 * @param tenantId 服务端须传入 middleware / getTenantId 的租户；客户端可省略（用 window.__ASTRO_TENANT_ID__）
 */
export async function searchArticleIds(
  params: SearchArticlesParams,
  tenantId?: string
): Promise<SearchArticlesResponse> {
  const config = getClientConfig();
  const finalTenantId = tenantId?.trim() || config.tenantId;

  // 构建查询字符串
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.page_size) queryParams.append('page_size', params.page_size.toString());
  if (params.article_type) queryParams.append('article_type', params.article_type);
  if (params.status) queryParams.append('status', params.status);
  if (params.publish_status) queryParams.append('publish_status', params.publish_status);
  if (params.content_title) queryParams.append('content_title', params.content_title);
  
  if (params.category_ids && params.category_ids.length > 0) {
    queryParams.append('category_ids', params.category_ids.join(','));
  }
  
  if (params.tag_ids && params.tag_ids.length > 0) {
    queryParams.append('tag_ids', params.tag_ids.join(','));
  }
  
  if (params.attribute_codes && params.attribute_codes.length > 0) {
    queryParams.append('attribute_codes', params.attribute_codes.join(','));
  }
  
  if (params.attribute_value_ids && params.attribute_value_ids.length > 0) {
    queryParams.append('attribute_value_ids', params.attribute_value_ids.join(','));
  }
  
  if (params.metadata_template_field_key) {
    queryParams.append('metadata_template_field_key', params.metadata_template_field_key);
    if (params.metadata_template_field_value_min) {
      queryParams.append('metadata_template_field_value_min', params.metadata_template_field_value_min);
    }
    if (params.metadata_template_field_value_max) {
      queryParams.append('metadata_template_field_value_max', params.metadata_template_field_value_max);
    }
  }
  
  if (params.sort_by_template_field_key) {
    queryParams.append('sort_by_template_field_key', params.sort_by_template_field_key);
  }
  
  if (params.sort_order) {
    queryParams.append('sort_order', params.sort_order);
  }

  if (params.template_id) {
    queryParams.append('template_id', params.template_id);
  }

  // 处理其他查询参数
  Object.keys(params).forEach(key => {
    if (!['page', 'page_size', 'article_type', 'status', 'publish_status', 'content_title',
          'category_ids', 'tag_ids', 'attribute_codes', 'attribute_value_ids',
          'metadata_template_field_key', 'metadata_template_field_value_min', 'metadata_template_field_value_max',
          'sort_by_template_field_key', 'sort_order', 'template_id'].includes(key)) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    }
  });
  
  const url = `${config.apiBaseUrl01}/articles/ids?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Tenant-ID': finalTenantId,
    },
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(errorData.error?.message || `Failed to search articles: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 产品简略信息
 */
export interface ArticleSimpleContent {
  data: {
    article_id: string;
    id: string;
    article_type?: string;
    language_code: string;
    title: string;
    summary?: string;
    publish_status: string;
    metadata?: {
      template_fields?: {
        [key: string]: any;
        thumbnails?: string[];
        price?: string;
      };
      [key: string]: any;
    };
    created_at: string;
    updated_at: string;
    is_primary?: boolean;
  };
  success: boolean;
}

/**
 * 获取产品简略信息
 */
export async function fetchArticleSimpleContent(
  articleId: string,
  languageCode: string,
  tenantId?: string
): Promise<ArticleSimpleContent> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  
  // 路径：tenant_{tenantID}/articles/posts/{languageCode}/article-content-simple-{articleID}-{languageCode}.json
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/posts/${languageCode}/article-content-simple-${articleId}-${languageCode}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch article simple content: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 并行获取多个产品的简略信息
 */
export async function fetchArticlesSimpleContent(
  articleIds: string[],
  languageCode: string,
  tenantId?: string
): Promise<ArticleSimpleContent[]> {
  const promises = articleIds.map(id => 
    fetchArticleSimpleContent(id, languageCode, tenantId).catch(error => {
      console.error(`Failed to fetch article ${id}:`, error);
      return null;
    })
  );
  
  const results = await Promise.all(promises);
  return results.filter((result): result is ArticleSimpleContent => result !== null);
}

/**
 * 分类数据
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  category_type: string;
  parent_id?: string;
  level: number;
  path: string;
  status: string;
  translations?: Array<{
    language_code: string;
    name: string;
    description?: string;
    is_primary: boolean;
  }>;
  children?: Category[];
  [key: string]: any;
}

export interface CategoriesData {
  data: {
    categories: Category[];
    total_count: number;
    tenant_id: string;
  };
  success: boolean;
}

/**
 * 获取分类数据
 */
export async function fetchCategories(tenantId?: string): Promise<CategoriesData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/categories/categories-${finalTenantId}.json?_=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 标签数据
 */
export interface Tag {
  id: string;
  name: string;
  description?: string;
  tag_type: string;
  status: string;
  translations?: Array<{
    language_code: string;
    name: string;
    description?: string;
    is_primary: boolean;
  }>;
  [key: string]: any;
}

export interface TagsData {
  data: {
    tags: Tag[];
    total_count: number;
    tenant_id: string;
  };
  success: boolean;
}

/**
 * 获取标签数据
 */
export async function fetchTags(tenantId?: string): Promise<TagsData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/tags/tags-${finalTenantId}.json?_=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 属性值
 */
export interface AttributeValue {
  id: string;
  attribute_id: string;
  value_name: string;
  value_code: string;
  value_data?: string;
  display_name?: string;
  description?: string;
  color_code?: string;
  status: string;
  translations?: Array<{
    language_code: string;
    value_name: string;
    display_name?: string;
    description?: string;
    is_primary: boolean;
  }>;
  [key: string]: any;
}

/**
 * 属性
 */
export interface Attribute {
  id: string;
  attribute_name: string;
  attribute_code: string;
  attribute_type: string;
  display_name?: string;
  description?: string;
  is_searchable: boolean;
  is_filterable: boolean;
  status: string;
  values: AttributeValue[];
  translations?: Array<{
    language_code: string;
    attribute_name: string;
    display_name?: string;
    description?: string;
    is_primary: boolean;
  }>;
  [key: string]: any;
}

export interface AttributesData {
  data: {
    attributes: Attribute[];
    total_count: number;
    tenant_id: string;
  };
  success: boolean;
}

/**
 * 获取属性与属性值数据
 */
export async function fetchAttributes(tenantId?: string): Promise<AttributesData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/attributes/product-attributes-${finalTenantId}.json?_=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch attributes: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 导出客户端对象
 */
export const clientArticleSearch = {
  searchArticleIds,
  fetchArticleSimpleContent,
  fetchArticlesSimpleContent,
  fetchCategories,
  fetchTags,
  fetchAttributes,
};

