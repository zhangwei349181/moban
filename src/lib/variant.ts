/**
 * 变体匹配函数库
 * 用于处理产品变体的匹配、属性值的显示等
 */

import type {
  Attribute,
  AttributeValue,
  Variant,
  Translation,
} from './product';

/**
 * 用户选择的属性值映射
 * key: attributeId, value: attributeValueId
 */
export interface SelectedAttributes {
  [attributeId: string]: string;
}

/**
 * 根据选择的属性值查找匹配的变体
 * @param selectedAttributes 用户选择的属性值映射
 * @param variants 变体数组
 * @param attributes 属性数组（用于验证必需属性）
 * @returns 匹配的变体，如果没有找到则返回 null
 */
export function findVariantByAttributes(
  selectedAttributes: SelectedAttributes,
  variants: Variant[],
  attributes: Attribute[]
): Variant | null {
  if (!variants || variants.length === 0) {
    return null;
  }

  // 确保所有必需属性（is_variant_creator = true）都已选择
  const requiredAttributes = attributes.filter(a => a.is_variant_creator);
  for (const attr of requiredAttributes) {
    if (!selectedAttributes[attr.id]) {
      return null; // 缺少必需属性
    }
  }

  // 匹配变体：检查变体的 attribute_value_ids 是否完全匹配用户选择的属性值
  for (const variant of variants) {
    if (variant.status !== 'active') {
      continue; // 跳过非激活状态的变体
    }

    const variantValueIds = new Set(variant.attribute_value_ids);
    const selectedValueIds = new Set(Object.values(selectedAttributes));

    // 检查是否完全匹配
    if (variantValueIds.size === selectedValueIds.size &&
        [...variantValueIds].every(id => selectedValueIds.has(id))) {
      return variant;
    }
  }

  return null; // 未找到匹配的变体
}

/**
 * 根据属性值ID获取属性值对象
 * @param attributeValueId 属性值ID
 * @param attributes 属性数组
 * @returns 属性值对象，如果没有找到则返回 null
 */
export function getAttributeValueById(
  attributeValueId: string,
  attributes: Attribute[]
): AttributeValue | null {
  for (const attr of attributes) {
    const value = attr.values.find(v => v.id === attributeValueId);
    if (value) {
      return value;
    }
  }
  return null;
}

/**
 * 根据属性ID和属性值ID获取属性值对象
 * @param attributeId 属性ID
 * @param attributeValueId 属性值ID
 * @param attributes 属性数组
 * @returns 属性值对象，如果没有找到则返回 null
 */
export function getAttributeValue(
  attributeId: string,
  attributeValueId: string,
  attributes: Attribute[]
): AttributeValue | null {
  const attribute = attributes.find(a => a.id === attributeId);
  if (!attribute) {
    return null;
  }

  return attribute.values.find(v => v.id === attributeValueId) || null;
}

/**
 * 获取属性值的显示名称（支持多语言）
 * @param value 属性值对象
 * @param locale 语言代码（可选，默认使用当前语言）
 * @returns 显示名称
 */
export function getAttributeValueDisplayName(
  value: AttributeValue,
  locale?: string
): string {
  if (!value) {
    return '';
  }

  // 如果指定了语言，查找翻译
  if (locale && value.translations && value.translations.length > 0) {
    const translation = value.translations.find(t => t.language_code === locale);
    if (translation) {
      // 优先使用 display_name，如果没有则使用 value_name
      return (translation as any).display_name || (translation as any).value_name || value.display_name;
    }
  }

  // 返回默认显示名称
  return value.display_name || value.value_name || value.value_code || '';
}

/**
 * 获取属性的显示名称（支持多语言）
 * @param attribute 属性对象
 * @param locale 语言代码（可选，默认使用当前语言）
 * @returns 显示名称
 */
export function getAttributeDisplayName(
  attribute: Attribute,
  locale?: string
): string {
  if (!attribute) {
    return '';
  }

  // 如果指定了语言，查找翻译
  if (locale && attribute.translations && attribute.translations.length > 0) {
    const translation = attribute.translations.find(t => t.language_code === locale);
    if (translation) {
      // 优先使用 display_name，如果没有则使用 attribute_name
      return (translation as any).display_name || (translation as any).attribute_name || attribute.display_name;
    }
  }

  // 返回默认显示名称
  return attribute.display_name || attribute.attribute_name || attribute.attribute_code || '';
}

/**
 * 获取所有必需的属性（is_variant_creator = true）
 * @param attributes 属性数组
 * @returns 必需的属性数组
 */
export function getRequiredAttributes(attributes: Attribute[]): Attribute[] {
  return attributes.filter(a => a.is_variant_creator);
}

/**
 * 检查是否所有必需属性都已选择
 * @param selectedAttributes 用户选择的属性值映射
 * @param attributes 属性数组
 * @returns 是否所有必需属性都已选择
 */
export function areAllRequiredAttributesSelected(
  selectedAttributes: SelectedAttributes,
  attributes: Attribute[]
): boolean {
  const requiredAttributes = getRequiredAttributes(attributes);
  
  for (const attr of requiredAttributes) {
    if (!selectedAttributes[attr.id]) {
      return false;
    }
  }

  return true;
}

/**
 * 根据变体获取其属性值的显示信息
 * @param variant 变体对象
 * @param attributes 属性数组
 * @param locale 语言代码（可选）
 * @returns 属性值的显示信息数组
 */
export function getVariantAttributesDisplay(
  variant: Variant,
  attributes: Attribute[],
  locale?: string
): Array<{ attributeName: string; valueName: string; valueCode?: string; colorCode?: string }> {
  const result: Array<{ attributeName: string; valueName: string; valueCode?: string; colorCode?: string }> = [];

  for (const valueId of variant.attribute_value_ids) {
    const value = getAttributeValueById(valueId, attributes);
    if (value) {
      const attribute = attributes.find(a => a.values.some(v => v.id === valueId));
      if (attribute) {
        result.push({
          attributeName: getAttributeDisplayName(attribute, locale),
          valueName: getAttributeValueDisplayName(value, locale),
          valueCode: value.value_code,
          colorCode: value.color_code,
        });
      }
    }
  }

  return result;
}

/**
 * 从全局变量获取当前语言
 */
function getCurrentLocale(): string {
  if (typeof window === 'undefined') {
    return 'zh-CN';
  }
  const win = window as any;
  return win.__ASTRO_LOCALE__ || 'zh-CN';
}

/**
 * 获取属性值的显示名称（使用当前语言）
 * @param value 属性值对象
 * @returns 显示名称
 */
export function getAttributeValueDisplayNameCurrentLocale(
  value: AttributeValue
): string {
  return getAttributeValueDisplayName(value, getCurrentLocale());
}

/**
 * 获取属性的显示名称（使用当前语言）
 * @param attribute 属性对象
 * @returns 显示名称
 */
export function getAttributeDisplayNameCurrentLocale(
  attribute: Attribute
): string {
  return getAttributeDisplayName(attribute, getCurrentLocale());
}

/**
 * 客户端专用的变体匹配函数
 */
export const clientVariant = {
  findVariantByAttributes,
  getAttributeValueById,
  getAttributeValue,
  getAttributeValueDisplayName,
  getAttributeDisplayName,
  getRequiredAttributes,
  areAllRequiredAttributesSelected,
  getVariantAttributesDisplay,
  getAttributeValueDisplayNameCurrentLocale,
  getAttributeDisplayNameCurrentLocale,
};

