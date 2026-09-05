/**
 * CMS 静态 HTML 组件（components01–components99）共用规则。
 * - 编号 1–99，CMS 编码如 components12 / component12
 * - 动态 post 使用 components_code: post 或 post01–post99（均走 post.astro）
 */

export const CMS_HTML_SLOT_MIN = 1;
export const CMS_HTML_SLOT_MAX = 99;

const CMS_SLOT_CODE_RE = /^(components|component)(\d{1,2})$/;
const CMS_HTML_FILENAME_RE = /^components(\d{1,2})_(en|cn)\.html$/i;

export function parseCmsHtmlSlotNumber(code: string): number | null {
  const match = CMS_SLOT_CODE_RE.exec(String(code || '').trim().toLowerCase());
  if (!match) return null;
  const n = parseInt(match[2], 10);
  if (!Number.isFinite(n) || n < CMS_HTML_SLOT_MIN || n > CMS_HTML_SLOT_MAX) return null;
  return n;
}

export function formatCmsHtmlSlotCode(index: number, prefix: 'components' | 'component' = 'components'): string {
  if (index < CMS_HTML_SLOT_MIN || index > CMS_HTML_SLOT_MAX) {
    throw new RangeError(`CMS HTML slot index must be ${CMS_HTML_SLOT_MIN}–${CMS_HTML_SLOT_MAX}`);
  }
  return `${prefix}${String(index).padStart(2, '0')}`;
}

/** CMS components_code 是否为静态 HTML 插槽（01–99） */
export function isCmsHtmlSlotCode(code: string): boolean {
  return parseCmsHtmlSlotNumber(code) !== null;
}

/** 是否为静态 HTML 插槽且应走 _ComponentsHtmlSection */
export function isCmsHtmlStaticSlotCode(code: string): boolean {
  return parseCmsHtmlSlotNumber(code) !== null;
}

export function isCmsHtmlComponentFilename(name: string): boolean {
  const match = CMS_HTML_FILENAME_RE.exec(name);
  if (!match) return false;
  const n = parseInt(match[1], 10);
  return n >= CMS_HTML_SLOT_MIN && n <= CMS_HTML_SLOT_MAX;
}

/** CMS 组件 HTML 路径适配 Astro 站点 */
export function normalizeCmsComponentHtml(html: string): string {
  return html
    .replace(/src="\.\/images\//g, 'src="/images/')
    .replace(/src='\.\/images\//g, "src='/images/")
    .replace(/href="\.\/images\//g, 'href="/images/')
    .replace(/src="\.\.\/images\//g, 'src="/images/')
    .replace(/href="\.\.\/images\//g, 'href="/images/')
    .replace(/url\(\.\/images\//g, 'url(/images/')
    .replace(/url\(\.\.\/images\//g, 'url(/images/')
    .replace(/href="\.\/"/g, 'href="/"')
    .replace(/href="\.\/([a-z0-9-]+)\.html"/gi, 'href="/$1"')
    .replace(/href='\.\/([a-z0-9-]+)\.html'/gi, "href='/$1'");
}
