/**
 * 产品详情页（productsingle / productsingle*）共用数据加载
 */

import type { PageComponentSlot } from './pageComponents';
import { loadCmsPageViewModel, type CmsPageViewModel } from './cmsPage';
import { loadProductDetailViewModel, type ProductDetailViewModel } from './productDetail';
import { getSystemPageSeoDefaults } from './pageMetadata';
import { isPageHeaderSlot } from './pageHeaderComponentCode';
import { isCmsHtmlStaticSlotCode } from './cmsComponentHtml';
import {
  isProductSingleDetailSlot,
  metadataUsesSectionTemplateShell,
} from './sectionTemplateShell';
import { isPostSingleSectionCode } from './postSingleComponentCode';
import { isProductSingleComponentType } from './productSingleComponentCode';
import { normalizeDetailPageCode } from './detailPageRoute';
import { isLayoutSectionCode } from './layoutComponentCode';
import { filterPageBodySlots } from './pageBodySlots';
import { isPageFooterChromeSlot, isPageHeaderChromeSlot } from './pageChromeSlots';

export const DEFAULT_PRODUCT_PAGEHEADER_METADATA = {
  bare: true,
  context: 'productsingle',
  list_path: '/product',
  breadcrumb: {
    items: [
      { label_key: 'breadcrumb_home', href: '/' },
      { label_key: 'our_products_section_title', href: '/product' },
    ],
  },
};

export const DEFAULT_PRODUCTSINGLE_METADATA = {
  bare: true,
  list_path: '/product',
};

export interface ProductSingleDetailPageModel {
  pageCode: string;
  articleId: string;
  locale: string;
  view: ProductDetailViewModel;
  cms: CmsPageViewModel;
  headerSlots: PageComponentSlot[];
  pageheaderSlots: PageComponentSlot[];
  productsingleSlots: PageComponentSlot[];
  bodySlots: PageComponentSlot[];
  footerSlots: PageComponentSlot[];
  pageHeaderSeoFallback: { title: string; description: string; keywords: string };
}

export async function loadProductSingleDetailPageModel(
  pageCodeInput: string,
  articleId: string,
  locale: string,
  tenantId: string,
  url: URL
): Promise<ProductSingleDetailPageModel | null> {
  const pageCode = normalizeDetailPageCode(pageCodeInput);
  if (!pageCode) return null;

  const id = String(articleId || '').trim();
  if (!id) return null;

  const view = await loadProductDetailViewModel(id, locale, tenantId);
  if (!view) return null;

  const cms = await loadCmsPageViewModel(
    pageCode,
    locale,
    tenantId,
    getSystemPageSeoDefaults(locale, 'product'),
    url,
    { mainClassFallback: '' }
  );

  const headerSlots = cms.pageComponents.filter(isPageHeaderChromeSlot);
  const pageheaderSlots = cms.pageComponents.filter(isPageHeaderSlot);
  const productsingleSlots = cms.pageComponents.filter(
    (s) =>
      isProductSingleComponentType(s.componentType) ||
      isProductSingleDetailSlot(s.normalizedCode, s.effectiveMetadata, locale)
  );
  const bodySlots = filterPageBodySlots(
    cms.pageComponents.filter((s) => {
      if (isPageHeaderChromeSlot(s) || isPageFooterChromeSlot(s)) return false;
      if (
        isProductSingleComponentType(s.componentType) ||
        isProductSingleDetailSlot(s.normalizedCode, s.effectiveMetadata, locale)
      ) {
        return false;
      }
      if (isPageHeaderSlot(s)) return false;
      if (isLayoutSectionCode(s.normalizedCode)) return false;
      if (
        isCmsHtmlStaticSlotCode(s.normalizedCode) &&
        metadataUsesSectionTemplateShell(s.effectiveMetadata, locale, 'productsingle')
      ) {
        if (import.meta.env.DEV) {
          console.warn(
            `[prefix]-[id] 跳过静态 HTML 插槽 ${s.componentsCode}：html_url 指向 productsingle 模板壳，应由 productsingle 组件渲染`
          );
        }
        return false;
      }
      return true;
    })
  );
  const footerSlots = cms.pageComponents.filter(isPageFooterChromeSlot);

  if (import.meta.env.DEV) {
    for (const slot of cms.pageComponents) {
      if (
        isPostSingleSectionCode(slot.normalizedCode) &&
        metadataUsesSectionTemplateShell(slot.effectiveMetadata, locale, 'productsingle')
      ) {
        console.warn(
          `[prefix]-[id] 组件 ${slot.componentsCode} 使用了 postsingle 编码但 html 指向 productsingle 模板，请在 CMS 改为 components_code: productsingle`
        );
      }
    }
  }

  return {
    pageCode,
    articleId: id,
    locale,
    view,
    cms,
    headerSlots,
    pageheaderSlots,
    productsingleSlots,
    bodySlots,
    footerSlots,
    pageHeaderSeoFallback: {
      title: view.title,
      description: view.description,
      keywords: view.keywords ?? view.title,
    },
  };
}
