/**
 * 产品数据获取函数库
 * 用于从静态JSON文件获取产品相关数据
 */

import { APP_CONFIG } from '../config/app';

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

/**
 * 翻译接口
 */
export interface Translation {
  language_code: string;
  is_primary?: boolean;
  [key: string]: any;
}

/**
 * 用户地址数据结构
 */
export interface Address {
  id: string;
  membership_id?: string; // 可选，JSON数据中可能不包含
  address_name: string;
  recipient_name: string;
  address_line1: string;
  address_line2?: string | null;
  phone_number: string;
  postal_code?: string | null;
  region_id: string;
  address_type: 'shipping' | 'billing' | string;
  is_default: boolean;
  is_verified: boolean;
  status: 'active' | 'inactive' | string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * 用户数据响应
 */
export interface UserProfileData {
  data: {
    user: {
      id: string;
      display_name: string;
      email: string;
      username?: string;
      phone?: string;
      avatar_url?: string;
      locale?: string;
      currency?: string;
      [key: string]: any;
    };
    membership: {
      id: string;
      tenant_id: string;
      [key: string]: any;
    };
    addresses: Address[];
    [key: string]: any;
  };
  success: boolean;
}

/**
 * 产品主数据响应
 */
export interface ArticleMainData {
  data: {
    article: {
      id: string;
      article_type: string;
      status: string;
      tenant_id: string;
      template_id?: string | null;
      parent_id?: string | null;
      has_children?: boolean;
      child_article_ids?: string[];
      metadata: {
        template_fields: {
          "Showcase Gallery"?: string[];
          "Showcase video"?: string[];
          Keywords?: string | string[];
          Keyword?: string | string[];
          "price"?: string;
          "Original price"?: string;
          "in stock"?: string;
          "volume"?: string;
          "Weight"?: string;
          [key: string]: any;
        };
        [key: string]: any;
      };
      [key: string]: any;
    };
    categories: string[];
    regions: string[];
    shipping_template_ids: string[];
    tax_template_ids: string[];
    tags: string[];
    parent_id?: string | null;
    has_children?: boolean;
    child_article_ids?: string[];
  };
  success: boolean;
}

/**
 * 文章正文 JSON 内嵌 SEO（有则优先用于 meta，无则整段不存在）
 */
export interface ArticleContentSeo {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string | string[];
}

/**
 * 产品完整内容数据响应
 */
export interface ArticleContentData {
  data: {
    article_id: string;
    title: string;
    content: string;
    summary?: string;
    seo?: ArticleContentSeo;
    metadata: Record<string, string>;
    language_code: string;
    status: string;
    [key: string]: any;
  };
  success: boolean;
}

/**
 * 属性值数据结构
 */
export interface AttributeValue {
  id: string;
  attribute_id: string;
  value_code: string;
  value_name: string;
  display_name: string;
  color_code?: string;
  /** 主语言文案在根字段；translations 仅含其它语言 */
  primary_language?: string;
  translations: Translation[];
  [key: string]: any;
}

/**
 * 属性数据结构
 */
export interface Attribute {
  id: string;
  attribute_code: string;
  attribute_name: string;
  display_name: string;
  attribute_type: string;
  is_variant_creator: boolean;
  values: AttributeValue[];
  translations: Translation[];
  [key: string]: any;
}

/**
 * 变体数据结构
 */
export interface Variant {
  id: string;
  article_id: string;
  variant_name: string;
  sku: string;
  attribute_value_ids: string[];
  pricing: {
    base_price: number;
    currency: string;
  };
  inventory: {
    available_quantity: number;
    inventory_quantity: number;
    reserved_quantity: number;
    track_inventory: boolean;
  };
  status: string;
  /** 订阅等：physical.dimensions（sort_order、is_recommended、subscription…） */
  physical?: Record<string, unknown>;
  created_at?: string;
  [key: string]: any;
}

/**
 * 产品变体数据响应
 */
export interface ArticleVariantsData {
  data: {
    attributes: Attribute[];
    variants: Variant[];
  };
  success: boolean;
}

/**
 * 梯度价格数据结构
 */
export interface TierPrice {
  id: string;
  discount_rule_id: string;
  tier_name: string;
  min_quantity: number;
  max_quantity?: number | null;
  price_type: string; // percentage（百分比折扣）, fixed_amount（固定金额折扣）, absolute_price（绝对价格）
  price_value: number;
  display_name?: string;
  description?: string;
  sort_order: number;
  status: string; // active, inactive
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

/**
 * 折扣规则所有者信息
 */
export interface DiscountOwner {
  owner_type: string; // platform（平台级）, supplier（供应商级）, user（用户级）
  owner_id?: string | null;
}

/**
 * 数量限制
 */
export interface QuantityRestrictions {
  min_quantity?: number | null;
  max_quantity?: number | null;
}

/**
 * 金额限制
 */
export interface AmountRestrictions {
  min_amount?: number | null;
  max_amount?: number | null;
}

/**
 * 用户限制（与静态 JSON user_restrictions 一致）
 * - user_level_restriction：allow / interdict 为会员等级，逗号分隔；优先 allow；匹配当前 membership.level（空视为无等级）
 * - membership_restriction：allow / interdict 为用户 User.id，逗号分隔；优先 allow
 */
export interface UserRestrictions {
  user_level_restriction?: Record<string, any> | null;
  membership_restriction?: Record<string, any> | null;
}

/**
 * 时间限制
 */
export interface TimeRestrictions {
  valid_from?: string | null; // ISO 8601
  valid_until?: string | null; // ISO 8601
}

/**
 * 使用限制
 */
export interface UsageRestrictions {
  usage_limit?: number | null;
  usage_count: number;
  per_user_limit?: number | null;
}

/**
 * 折扣使用记录
 */
export interface UsageLog {
  id: string;
  discount_rule_id: string;
  membership_id?: string | null;
  order_id?: string | null;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  quantity: number;
  used_at: string; // ISO 8601
  [key: string]: any;
}

/**
 * 折扣规则数据结构
 */
export interface Discount {
  id: string;
  tenant_id: string;
  rule_name: string;
  rule_code: string;
  rule_type: string; // quantity（数量折扣）, user_level（用户等级折扣）, time_based（时间折扣）, product_based（产品折扣）, combo（组合折扣）
  primary_language: string;
  owner: DiscountOwner;
  article_id?: string | null;
  variant_id?: string | null;
  trigger_conditions: Record<string, any>;
  discount_type: string; // percentage（百分比折扣）, fixed_amount（固定金额折扣）, tier_price（阶梯价格）
  discount_value: number;
  quantity_restrictions?: QuantityRestrictions;
  amount_restrictions?: AmountRestrictions;
  user_restrictions?: UserRestrictions;
  time_restrictions?: TimeRestrictions;
  usage_restrictions?: UsageRestrictions;
  is_public: boolean;
  status: string; // active, inactive
  priority: number;
  tier_prices?: TierPrice[];
  translations?: Translation[];
  usage_logs?: UsageLog[];
  metadata?: Record<string, any>;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  created_by: string;
  [key: string]: any;
}

/**
 * 折扣规则数据响应
 */
export interface DiscountRulesData {
  data: {
    discounts: Discount[];
  };
  success: boolean;
}

/**
 * 运费规则数据结构
 */
export interface ShippingRule {
  id: string;
  template_id: string;
  rule_name: string;
  region_id: string;
  rule_type: string;
  base_price: number;
  unit_price: number;
  unit_increment: number;
  min_value: number;
  status: string;
  [key: string]: any;
}

/**
 * 运费模板数据响应
 */
export interface ShippingTemplateData {
  data: {
    template: {
      id: string;
      template_name: string;
      template_code: string;
      description: string;
      status: string;
      translations?: Translation[];
      [key: string]: any;
    };
    rules: ShippingRule[];
    translations?: Translation[];
  };
  success: boolean;
}

/**
 * 税费规则数据结构
 */
export interface TaxRule {
  id: string;
  template_id: string;
  rule_name: string;
  region_id: string;
  tax_rate: number;
  status: string;
  [key: string]: any;
}

/**
 * 税费模板数据响应
 */
export interface TaxTemplateData {
  data: {
    template: {
      id: string;
      template_name: string;
      template_code: string;
      description: string;
      tax_type: string;
      status: string;
      translations?: Translation[];
      [key: string]: any;
    };
    rules: TaxRule[];
    translations?: Translation[];
  };
  success: boolean;
}

/**
 * 区域数据结构
 */
export interface Region {
  id: string;
  region_name: string;
  region_code: string;
  region_type: string;
  parent_id: string | null;
  path: string;
  level?: number;
  sort_order?: number;
  translations: Translation[];
  [key: string]: any;
}

/**
 * 区域数据响应
 */
export interface RegionsData {
  data: {
    regions: Region[];
    tenant_id: string;
    total_count: number;
  };
  success: boolean;
}

/**
 * 面包屑项数据结构
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
  level: number;
  path: string;
  translations: Translation[];
}

/**
 * 分类数据响应
 */
export interface CategoryData {
  data: {
    category: {
      id: string;
      name: string;
      description: string;
      level: number;
      parent_id: string | null;
      translations: Translation[];
      [key: string]: any;
    };
    breadcrumb: BreadcrumbItem[];
    translations: Translation[];
  };
  success: boolean;
}

/**
 * 标签数据响应
 */
export interface TagData {
  data: {
    tag: {
      id: string;
      name: string;
      description: string;
      tag_type: string;
      translations: Translation[];
      [key: string]: any;
    };
    translations: Translation[];
  };
  success: boolean;
}

/**
 * 团购活动所有者信息
 */
export interface GroupBuyingOwner {
  owner_type: string; // platform（平台级）, supplier（供应商级）
  owner_id?: string | null;
}

/**
 * 团购成团配置
 */
export interface GroupBuyingGroupConfig {
  group_size: number;
  min_group_size: number;
  max_group_size?: number | null;
}

/**
 * 团购价格配置
 */
export interface GroupBuyingPriceConfig {
  original_price: number;
  group_price: number;
}

/**
 * 团购库存配置
 */
export interface GroupBuyingInventoryConfig {
  total_inventory?: number | null;
  reserved_inventory: number;
  available_inventory: number;
}

/**
 * 团购时间配置
 */
export interface GroupBuyingTimeConfig {
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  auto_close_hours?: number | null;
}

/**
 * 团购统计信息
 */
export interface GroupBuyingStatistics {
  current_participants: number;
  successful_groups: number;
  total_sales: number;
}

/**
 * 团购限制条件
 * - user_level_restriction / membership_restriction：与折扣 user_restrictions 相同语义（allow / interdict，allow 优先）
 */
export interface GroupBuyingRestrictions {
  per_user_limit?: number | null;
  user_level_restriction?: Record<string, any> | null;
  membership_restriction?: Record<string, any> | null;
}

/**
 * 团购活动数据结构
 */
export interface GroupBuyingActivity {
  id: string;
  tenant_id: string;
  activity_name: string;
  activity_code: string;
  description?: string;
  primary_language: string;
  owner: GroupBuyingOwner;
  article_id: string;
  variant_id?: string | null;
  group_config: GroupBuyingGroupConfig;
  price_config: GroupBuyingPriceConfig;
  inventory_config: GroupBuyingInventoryConfig;
  time_config: GroupBuyingTimeConfig;
  status: string; // draft（草稿）, active（进行中）, success（成功）, failed（失败）, cancelled（取消）
  statistics: GroupBuyingStatistics;
  restrictions: GroupBuyingRestrictions;
  is_public: boolean;
  translations?: Translation[];
  groups?: any[] | null;
  participants?: any[] | null;
  metadata?: Record<string, any>;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  created_by: string;
  [key: string]: any;
}

/**
 * 团购数据响应
 */
export interface GroupBuyingData {
  data: {
    group_buying: GroupBuyingActivity[];
  };
  success: boolean;
}

/**
 * 获取客户端全局配置
 */
function getClientConfig(): {
  tenantId: string;
  locale: string;
  apiBaseUrl: string;
} {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  return {
    tenantId: win?.__ASTRO_TENANT_ID__ || APP_CONFIG.tenantId,
    locale: win?.__ASTRO_LOCALE__ || 'zh-CN',
    apiBaseUrl: API_BASE_URL,
  };
}

/**
 * 获取产品主数据
 */
export async function fetchArticleMain(
  articleId: string,
  tenantId?: string
): Promise<ArticleMainData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/posts/article-${articleId}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch article main data: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取产品完整内容数据
 */
export async function fetchArticleContent(
  articleId: string,
  locale?: string,
  tenantId?: string
): Promise<ArticleContentData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const finalLocale = locale || config.locale;
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/posts/${finalLocale}/article-content-${articleId}-${finalLocale}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch article content: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取产品变体数据
 */
export async function fetchArticleVariants(
  articleId: string,
  tenantId?: string
): Promise<ArticleVariantsData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const base = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/posts/article-variants-${articleId}.json`;
  const sep = base.includes('?') ? '&' : '?';
  const url = `${base}${sep}_=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch article variants: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取折扣规则数据
 */
export async function fetchDiscountRules(
  articleId: string,
  tenantId?: string
): Promise<DiscountRulesData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const base = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/posts/discount-rule-${articleId}.json`;
  const sep = base.includes('?') ? '&' : '?';
  const url = `${base}${sep}_=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    // 折扣规则可能不存在，返回空数组
    return {
      data: { discounts: [] },
      success: true,
    };
  }
  
  return await response.json();
}

/**
 * 获取运费模板数据
 */
export async function fetchShippingTemplate(
  templateId: string,
  tenantId?: string
): Promise<ShippingTemplateData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/shipping/shipping-template-${templateId}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch shipping template: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取税费模板数据
 */
export async function fetchTaxTemplate(
  templateId: string,
  tenantId?: string
): Promise<TaxTemplateData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/shipping/tax-template-${templateId}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tax template: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取租户区域数据
 */
export async function fetchRegions(
  tenantId?: string
): Promise<RegionsData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/regions/regions-${finalTenantId}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch regions: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取单个分类数据
 */
export async function fetchCategory(
  categoryId: string,
  tenantId?: string
): Promise<CategoryData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/categories/category-${categoryId}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取单个标签数据
 */
export async function fetchTag(
  tagId: string,
  tenantId?: string
): Promise<TagData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/tags/tag-${tagId}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tag: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取用户数据
 */
export async function fetchUserProfile(
  membershipId: string,
  tenantId?: string
): Promise<UserProfileData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  // 静态 JSON 易被浏览器/CDN 强缓存，追加时间戳避免地址等数据不刷新
  const url = `${config.apiBaseUrl}/tenant_${finalTenantId}/users/user-profile-${membershipId}.json?t=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 获取团购数据
 */
export async function fetchGroupBuying(
  articleId: string,
  tenantId?: string
): Promise<GroupBuyingData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const base = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/posts/group-buying-${articleId}.json`;
  const sep = base.includes('?') ? '&' : '?';
  const url = `${base}${sep}_=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch group buying data: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 众筹活动数据结构
 */
export interface CrowdfundingTranslation {
  language_code: string;
  activity_name: string;
  description?: string;
  is_primary: boolean;
}

export interface CrowdfundingOwner {
  owner_type: string; // platform, supplier
  owner_id?: string | null;
}

export interface CrowdfundingFundingConfig {
  target_amount: number;
  current_amount: number;
  min_support_amount: number;
  allow_over_funding: boolean;
  over_funding_limit?: number | null;
}

export interface CrowdfundingTimeConfig {
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
}

export interface CrowdfundingStatistics {
  supporter_count: number;
  total_supporters: number;
  progress_percentage: number;
}

/** 与折扣 user_restrictions / 团购 restrictions 相同语义（allow / interdict，allow 优先） */
export interface CrowdfundingRestrictions {
  per_user_limit?: number | null;
  user_level_restriction?: Record<string, any> | null;
  membership_restriction?: Record<string, any> | null;
}

export interface CrowdfundingRewardVariant {
  id: string;
  variant_name: string;
  sku: string;
  base_price: number;
}

export interface CrowdfundingReward {
  id: string;
  activity_id: string;
  variant_id: string;
  variant: CrowdfundingRewardVariant;
  crowdfunding_price: number;
  estimated_delivery_time?: string | null; // ISO 8601
  sort_order: number;
  is_featured: boolean;
  status: string; // active, inactive
  metadata?: Record<string, any>;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface CrowdfundingUpdateTranslation {
  language_code: string;
  update_title: string;
  update_content?: string;
  is_primary: boolean;
}

export interface CrowdfundingUpdate {
  id: string;
  activity_id: string;
  update_title: string;
  update_content: string;
  primary_language: string;
  translations?: CrowdfundingUpdateTranslation[];
  update_type: string; // general, milestone, delay, completion
  is_public: boolean;
  is_supporter_only: boolean;
  attachments?: Array<{
    type: string;
    url: string;
    thumbnail_url?: string;
  }>;
  status: string; // active, inactive
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  created_by: string;
}

export interface CrowdfundingFAQTranslation {
  language_code: string;
  question: string;
  answer: string;
  is_primary: boolean;
}

export interface CrowdfundingFAQ {
  id: string;
  activity_id: string;
  question: string;
  answer: string;
  primary_language: string;
  translations?: CrowdfundingFAQTranslation[];
  category?: string | null;
  sort_order: number;
  status: string; // active, inactive
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  created_by: string;
}

export interface CrowdfundingActivity {
  id: string;
  tenant_id: string;
  activity_name: string;
  activity_code: string;
  description?: string;
  translations?: CrowdfundingTranslation[];
  owner: CrowdfundingOwner;
  article_id: string;
  funding_config: CrowdfundingFundingConfig;
  time_config: CrowdfundingTimeConfig;
  status: string; // draft, active, success, failed, cancelled
  statistics: CrowdfundingStatistics;
  restrictions: CrowdfundingRestrictions;
  is_public: boolean;
  rewards: CrowdfundingReward[];
  supports?: any[] | null;
  updates: CrowdfundingUpdate[];
  faqs: CrowdfundingFAQ[];
  metadata?: Record<string, any>;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  created_by: string;
  [key: string]: any;
}

/**
 * 众筹数据响应
 */
export interface CrowdfundingData {
  data: {
    crowdfunding: CrowdfundingActivity[];
  };
  success: boolean;
}

/**
 * 获取众筹数据
 */
export async function fetchCrowdfunding(
  articleId: string,
  tenantId?: string
): Promise<CrowdfundingData> {
  const config = getClientConfig();
  const finalTenantId = tenantId || config.tenantId;
  const base = `${config.apiBaseUrl}/tenant_${finalTenantId}/articles/posts/crowdfunding-${articleId}.json`;
  const sep = base.includes('?') ? '&' : '?';
  const url = `${base}${sep}_=${Date.now()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch crowdfunding data: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * 客户端专用的获取函数
 */
export const clientProduct = {
  fetchArticleMain,
  fetchArticleContent,
  fetchArticleVariants,
  fetchDiscountRules,
  fetchShippingTemplate,
  fetchTaxTemplate,
  fetchRegions,
  fetchCategory,
  fetchTag,
  fetchUserProfile,
  fetchGroupBuying,
  fetchCrowdfunding,
};

