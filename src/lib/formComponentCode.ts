/** 动态表单区块：优先看组件 type=form；code 正则仅兼容旧租户 */

export function isFormComponentType(type?: string | null): boolean {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'form' || t === 'contactform' || t === 'dynamicform';
}

/** 动态表单 components_code：form、form01–form99（兼容旧 contactform / dynamicform） */
const FORM_SECTION_CODE_RE = /^form(\d{1,2})?$/;
const LEGACY_FORM_SECTION_CODE_RE = /^(contactform|dynamicform)(\d{1,2})?$/;

function matchesFormCode(normalized: string): boolean {
  const formMatch = FORM_SECTION_CODE_RE.exec(normalized);
  if (formMatch) {
    if (!formMatch[1]) return true;
    const n = parseInt(formMatch[1], 10);
    return n >= 1 && n <= 99;
  }
  const legacy = LEGACY_FORM_SECTION_CODE_RE.exec(normalized);
  if (!legacy) return false;
  if (!legacy[2]) return true;
  const n = parseInt(legacy[2], 10);
  return n >= 1 && n <= 99;
}

export function isFormSectionCode(code: string): boolean {
  const normalized = String(code || '').trim().toLowerCase();
  return matchesFormCode(normalized);
}

export function isFormSlot(slot: {
  componentType?: string | null;
  normalizedCode: string;
}): boolean {
  return isFormComponentType(slot.componentType) || isFormSectionCode(slot.normalizedCode);
}
