/**
 * 页面框架 layout 组件（仅注入 CSS/JS，不在正文中渲染）
 *
 * 加载规则（无第三档回退）：
 * 1. 本页关联了组件记录 type=layout 的组件 → 用该关联（多份时取 sort_order 最先的一份）
 * 2. 否则加载 components_code 为 `layout` 的组件
 * 3. 都没有 → 不注入任何 layout CSS/JS
 */

export const LAYOUT_COMPONENT_CODE = 'layout';

const LAYOUT_SECTION_CODE_RE = /^layout(\d{1,2})?$/;

/** 旧编码约定：code 为 layout / layout01–99（无 type 时的兼容） */
export function isLayoutSectionCode(code: string): boolean {
  return LAYOUT_SECTION_CODE_RE.test(String(code || '').trim().toLowerCase());
}

/** 组件记录上的独立字段 `type`（不是 metadata.type） */
export function isLayoutComponentType(type: unknown): boolean {
  return String(type ?? '').trim().toLowerCase() === 'layout';
}
