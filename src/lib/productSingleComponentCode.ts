/** 动态 ProductSingle 区块：优先看组件 type=productsingle；code 正则仅兼容旧租户 */

export function isProductSingleComponentType(type?: string | null): boolean {
  return String(type ?? '').trim().toLowerCase() === 'productsingle';
}

/** 动态 ProductSingle 区块 components_code：productsingle、productsingle01–productsingle99（兼容旧 shopsingle） */
const PRODUCT_SINGLE_SECTION_CODE_RE = /^productsingle(\d{1,2})?$/;
const LEGACY_SHOPSINGLE_SECTION_CODE_RE = /^shopsingle(\d{1,2})?$/;

function matchesProductSingleCode(normalized: string): boolean {
  for (const re of [PRODUCT_SINGLE_SECTION_CODE_RE, LEGACY_SHOPSINGLE_SECTION_CODE_RE]) {
    const match = re.exec(normalized);
    if (!match) continue;
    if (!match[1]) return true;
    const n = parseInt(match[1], 10);
    return n >= 1 && n <= 99;
  }
  return false;
}

export function isProductSingleSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesProductSingleCode(normalized);
}

export function isProductSingleSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return (
    isProductSingleComponentType(slot.componentType) || isProductSingleSectionCode(slot.normalizedCode)
  );
}
