/**
 * 运费和税费计算函数库
 * 用于处理运费计算、税费计算、区域匹配等
 */

import type {
  ShippingTemplateData,
  ShippingRule,
  TaxTemplateData,
  TaxRule,
  Region,
  Address,
  ArticleMainData,
  Variant,
} from './product';

/**
 * 运费计算结果
 */
export interface ShippingCalculationResult {
  shippingFee: number;
  templateName: string;
  ruleName: string;
  error?: string;
}

/**
 * 税费计算结果
 */
export interface TaxCalculationResult {
  taxFee: number;
  taxRate: number;
  templateName: string;
  ruleName: string;
  error?: string;
}

/**
 * 查找匹配的运费规则（支持层级匹配）
 * @param rules 运费规则数组
 * @param addressRegionId 地址区域ID
 * @param regions 区域数据数组
 * @returns 匹配的运费规则，如果没有找到则返回 null
 */
export function findMatchingShippingRule(
  rules: ShippingRule[],
  addressRegionId: string,
  regions: Region[]
): ShippingRule | null {
  if (!rules || rules.length === 0) {
    return null;
  }

  // 1. 直接匹配
  let matchedRule = rules.find(r => r.region_id === addressRegionId && r.status === 'active');
  if (matchedRule) {
    return matchedRule;
  }

  // 2. 层级匹配（向上查找父级区域）
  const regionMap = new Map<string, Region>(regions.map(r => [r.id, r]));
  let currentRegion: Region | undefined = regionMap.get(addressRegionId);

  while (currentRegion && currentRegion.parent_id) {
    currentRegion = regionMap.get(currentRegion.parent_id);
    if (currentRegion) {
      matchedRule = rules.find(r => r.region_id === currentRegion!.id && r.status === 'active');
      if (matchedRule) {
        return matchedRule;
      }
    }
  }

  return null;
}

/**
 * 查找匹配的税费规则（支持层级匹配）
 * @param rules 税费规则数组
 * @param addressRegionId 地址区域ID
 * @param regions 区域数据数组
 * @returns 匹配的税费规则，如果没有找到则返回 null
 */
export function findMatchingTaxRule(
  rules: TaxRule[],
  addressRegionId: string,
  regions: Region[]
): TaxRule | null {
  if (!rules || rules.length === 0) {
    return null;
  }

  // 1. 直接匹配
  let matchedRule = rules.find(r => r.region_id === addressRegionId && r.status === 'active');
  if (matchedRule) {
    return matchedRule;
  }

  // 2. 层级匹配（向上查找父级区域）
  const regionMap = new Map<string, Region>(regions.map(r => [r.id, r]));
  let currentRegion: Region | undefined = regionMap.get(addressRegionId);

  while (currentRegion && currentRegion.parent_id) {
    currentRegion = regionMap.get(currentRegion.parent_id);
    if (currentRegion) {
      matchedRule = rules.find(r => r.region_id === currentRegion!.id && r.status === 'active');
      if (matchedRule) {
        return matchedRule;
      }
    }
  }

  return null;
}

/**
 * 计算运费
 * @param shippingTemplate 运费模板数据
 * @param selectedAddress 选择的收货地址
 * @param regionsData 区域数据数组
 * @param quantity 数量
 * @param basePrice 基础价格（用于按金额计算运费）
 * @param variant 变体数据（可选，用于获取体积、重量等）
 * @param articleMainData 产品主数据（可选，用于获取体积、重量等）
 * @returns 运费计算结果
 */
export function calculateShippingFee(
  shippingTemplate: ShippingTemplateData,
  selectedAddress: Address,
  regionsData: Region[],
  quantity: number,
  basePrice: number,
  variant?: Variant,
  articleMainData?: ArticleMainData
): ShippingCalculationResult {
  // 1. 查找匹配的运费规则
  const matchedRule = findMatchingShippingRule(
    shippingTemplate.data.rules,
    selectedAddress.region_id,
    regionsData
  );

  if (!matchedRule) {
    return {
      shippingFee: 0,
      templateName: shippingTemplate.data.template.template_name,
      ruleName: '',
      error: '无法运送到该地区',
    };
  }

  // 2. 根据规则类型计算运费
  let shippingFee = matchedRule.base_price;

  switch (matchedRule.rule_type) {
    case 'quantity':
      // 按数量计算：base_price + (quantity - 1) * unit_price
      shippingFee += (quantity - 1) * matchedRule.unit_price;
      break;

    case 'volume':
      // 按体积计算
      let volume = 0;
      if (articleMainData?.data.article.metadata.template_fields.volume) {
        volume = parseFloat(articleMainData.data.article.metadata.template_fields.volume);
      }
      if (volume > 0) {
        const totalVolume = quantity * volume;
        shippingFee += (totalVolume - matchedRule.min_value) * matchedRule.unit_price;
      }
      break;

    case 'weight':
      // 按重量计算
      let weight = 0;
      if (articleMainData?.data.article.metadata.template_fields.Weight) {
        weight = parseFloat(articleMainData.data.article.metadata.template_fields.Weight);
      }
      if (weight > 0) {
        const totalWeight = quantity * weight;
        shippingFee += (totalWeight - matchedRule.min_value) * matchedRule.unit_price;
      }
      break;

    case 'amount':
      // 按金额计算
      const totalAmount = basePrice * quantity;
      shippingFee += (totalAmount - matchedRule.min_value) * matchedRule.unit_price;
      break;

    case 'fixed':
      // 固定运费，无需额外计算
      break;

    default:
      // 未知的规则类型，使用固定运费
      break;
  }

  return {
    shippingFee: Math.max(0, shippingFee), // 确保不为负数
    templateName: shippingTemplate.data.template.template_name,
    ruleName: matchedRule.rule_name,
  };
}

/**
 * 计算税费
 * @param taxTemplate 税费模板数据
 * @param selectedAddress 选择的收货地址
 * @param regionsData 区域数据数组
 * @param quantity 数量
 * @param basePrice 基础价格（单价）
 * @returns 税费计算结果
 */
export function calculateTaxFee(
  taxTemplate: TaxTemplateData,
  selectedAddress: Address,
  regionsData: Region[],
  quantity: number,
  basePrice: number
): TaxCalculationResult {
  // 1. 查找匹配的税费规则
  const matchedRule = findMatchingTaxRule(
    taxTemplate.data.rules,
    selectedAddress.region_id,
    regionsData
  );

  if (!matchedRule) {
    return {
      taxFee: 0,
      taxRate: 0,
      templateName: taxTemplate.data.template.template_name,
      ruleName: '',
      error: '无法计算税费',
    };
  }

  // 2. 计算税费：数量 × 单价 × 税率
  const taxFee = quantity * basePrice * matchedRule.tax_rate;

  return {
    taxFee: Math.max(0, taxFee), // 确保不为负数
    taxRate: matchedRule.tax_rate,
    templateName: taxTemplate.data.template.template_name,
    ruleName: matchedRule.rule_name,
  };
}

/**
 * 验证收货地址是否在产品的可销售区域内
 * @param articleRegions 产品可销售区域ID数组
 * @param addressRegionId 地址区域ID
 * @param regionsData 区域数据数组
 * @returns 是否可销售
 */
export function validateShippingRegion(
  articleRegions: string[],
  addressRegionId: string,
  regionsData: Region[]
): boolean {
  if (!articleRegions || articleRegions.length === 0) {
    // 如果没有指定可销售区域，默认可以销售
    return true;
  }

  // 1. 直接匹配
  if (articleRegions.includes(addressRegionId)) {
    return true;
  }

  // 2. 层级匹配（检查地址区域是否在产品的某个区域的子级）
  const regionMap = new Map<string, Region>(regionsData.map(r => [r.id, r]));
  let currentRegion: Region | undefined = regionMap.get(addressRegionId);

  while (currentRegion && currentRegion.parent_id) {
    if (articleRegions.includes(currentRegion.parent_id)) {
      return true;
    }
    currentRegion = regionMap.get(currentRegion.parent_id);
  }

  return false;
}

/**
 * 从区域数据中获取区域名称（支持多语言）
 * @param regionId 区域ID
 * @param regions 区域数据数组
 * @param locale 语言代码（可选，默认使用当前语言）
 * @returns 区域名称
 */
export function getRegionName(
  regionId: string,
  regions: Region[],
  locale?: string
): string {
  const region = regions.find(r => r.id === regionId);
  if (!region) {
    return '';
  }

  // 如果指定了语言，查找翻译
  if (locale && region.translations) {
    const translation = region.translations.find(t => t.language_code === locale);
    if (translation && translation.region_name) {
      return translation.region_name;
    }
  }

  // 返回默认名称
  return region.region_name || '';
}

/**
 * 客户端专用的运费/税费计算函数
 */
export const clientShipping = {
  findMatchingShippingRule,
  findMatchingTaxRule,
  calculateShippingFee,
  calculateTaxFee,
  validateShippingRegion,
  getRegionName,
};

