/**
 * CMS 动态页面：拉取 web_pages/{page_code}.json 并解析组件与 SEO。
 * 正文只来自关联组件；页面 metadata 不再加载 markdown/html。
 */

import { loadPageComponents, type PageComponentSlot } from './pageComponents';
import {
  resolvePageSeoFields,
  type PageSeoDefaults,
  type PageSeoFields,
} from './pageMetadata';
import { fetchWebPage, type WebPageData } from './webPage';
import { resolvePageFrameConfig, type PageFrameConfig } from './pageFrame';

export interface CmsPageViewModel {
  pageCode: string;
  pageData: WebPageData | null;
  pageMeta: Record<string, unknown>;
  pageComponents: PageComponentSlot[];
  seo: PageSeoFields;
  frame: PageFrameConfig;
}

export async function loadCmsPageViewModel(
  pageCode: string,
  locale: string,
  tenantId: string,
  seoDefaults: PageSeoDefaults,
  _baseUrl?: URL,
  options: { mainClassFallback?: string } = {}
): Promise<CmsPageViewModel> {
  const pageData = await fetchWebPage(pageCode, tenantId);
  const pageComponents = await loadPageComponents(pageCode, locale, tenantId);
  const pageMeta = (pageData?.page?.metadata || {}) as Record<string, unknown>;
  const seo = resolvePageSeoFields(pageMeta, seoDefaults, locale);
  const frame = resolvePageFrameConfig(pageMeta, locale, {
    mainClassFallback: options.mainClassFallback,
  });

  return {
    pageCode,
    pageData,
    pageMeta,
    pageComponents,
    seo,
    frame,
  };
}
