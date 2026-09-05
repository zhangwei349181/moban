/**
 * 页面动态组件：从 web_pages/{page_code}.json 读取关联列表，
 * metadata 优先使用页面关联行，否则回退到 web_components/{code}.json。
 */

import { APP_CONFIG } from '../config/app';
import { fetchWebPage } from './webPage';
import { fetchWebComponent } from './webComponent';
import { isCmsHtmlSlotCode } from './cmsComponentHtml';
import { isPostSectionCode } from './postComponentCode';
import { isPostChildSectionCode } from './postChildComponentCode';
import { isPostListSectionCode } from './postListComponentCode';
import { isPageHeaderSectionCode } from './pageHeaderComponentCode';
import { isMarkdownSectionCode } from './markdownComponentCode';
import { isListFilterSectionCode } from './listFilterComponentCode';
import { isPostSingleSectionCode } from './postSingleComponentCode';
import { isProductSingleSectionCode } from './productSingleComponentCode';
import { isFormSectionCode } from './formComponentCode';
import { isLoginSectionCode } from './loginComponentCode';
import { isSignupSectionCode } from './signupComponentCode';
import { isVerifyEmailSectionCode } from './verifyEmailComponentCode';
import { isCartSectionCode } from './cartComponentCode';
import { isWishlistSectionCode } from './wishlistComponentCode';
import { isCheckoutSectionCode } from './checkoutComponentCode';
import { isSubscriptionCheckoutSectionCode } from './subscriptionCheckoutComponentCode';
import { isPricingSectionCode } from './pricingComponentCode';
import {
  isDashboardPanelSectionCode,
  isDashboardSectionCode,
} from './dashboardComponentCode';
import { isLayoutSectionCode } from './layoutComponentCode';
import { isChromeNestedCode, isChromeShellCode } from './chromeComponentCode';

export type PageComponentMetadataSource = 'page' | 'component';

export const DEFAULT_PAGE_COMPONENT_SORT_ORDER = 100;

export function resolvePageComponentSortOrder(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') {
    return DEFAULT_PAGE_COMPONENT_SORT_ORDER;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_PAGE_COMPONENT_SORT_ORDER;
}

export function comparePageComponentSlots(
  a: PageComponentSlot,
  b: PageComponentSlot
): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  const timeCmp = a.associationCreatedAt.localeCompare(b.associationCreatedAt);
  if (timeCmp !== 0) return timeCmp;
  return a.listIndex - b.listIndex;
}

export function sortPageComponentSlots(
  slots: PageComponentSlot[]
): PageComponentSlot[] {
  return [...slots].sort(comparePageComponentSlots);
}


export interface PageComponentSlot {
  componentId: string;
  componentsCode: string;
  /** 小写编码，用于注册表匹配 */
  normalizedCode: string;
  /** 组件记录上的独立 `type`（关联行没有此字段） */
  componentType: string;
  effectiveMetadata: Record<string, unknown>;
  metadataSource: PageComponentMetadataSource;
  /** 页面-组件关联 sort_order，默认 100 */
  sortOrder: number;
  /** 关联 created_at（同 sort_order 时的次序依据） */
  associationCreatedAt: string;
  /** 原始 JSON 数组下标（最终兜底次序） */
  listIndex: number;
}

/** 页面未关联 CMS 组件时的兜底 slot（仍走 PageComponentSlot 以支持编辑态底栏） */
export function createFallbackPageComponentSlot(
  componentsCode: string,
  effectiveMetadata: Record<string, unknown>,
  componentType = ''
): PageComponentSlot {
  return {
    componentId: '',
    componentsCode,
    normalizedCode: componentsCode.toLowerCase(),
    componentType,
    effectiveMetadata,
    metadataSource: 'component',
    sortOrder: DEFAULT_PAGE_COMPONENT_SORT_ORDER,
    associationCreatedAt: '',
    listIndex: 0,
  };
}

/** 页面关联 metadata 非空对象时视为「有配置」 */
export function hasAssociationMetadata(
  metadata: Record<string, unknown> | undefined | null
): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }
  return Object.keys(metadata).length > 0;
}

/**
 * 解析组件最终使用的 metadata（页面关联优先，否则组件自身）
 */
export function resolveEffectiveMetadata(
  pageAssociationMetadata: Record<string, unknown> | undefined,
  componentMetadata: Record<string, unknown> | undefined
): { metadata: Record<string, unknown>; source: PageComponentMetadataSource } {
  if (hasAssociationMetadata(pageAssociationMetadata)) {
    return {
      metadata: {
        ...(componentMetadata || {}),
        ...(pageAssociationMetadata as Record<string, unknown>),
      },
      source: 'page',
    };
  }
  return {
    metadata: { ...(componentMetadata || {}) },
    source: 'component',
  };
}

export function normalizeComponentCode(componentsCode: string): string {
  const raw = String(componentsCode || '')
    .trim()
    .toLowerCase();
  if (KNOWN_PAGE_COMPONENT_CODES.has(raw)) return raw;
  const hyphenated = raw.replace(/[\s_]+/g, '-');
  if (KNOWN_PAGE_COMPONENT_CODES.has(hyphenated)) return hyphenated;
  const compact = raw.replace(/[\s_]+/g, '');
  if (KNOWN_PAGE_COMPONENT_CODES.has(compact)) return compact;
  return raw;
}

/** 可在页面中渲染的 components_code（小写） */
export const KNOWN_PAGE_COMPONENT_CODES = new Set([
  'post',
  'postchild',
  'postlist',
  'bloglist',
  'pageheader',
  'listfilter',
  'postsingle',
  'blogsingle',
  'productsingle',
  'shopsingle',
  'form',
  'contactform',
  'dynamicform',
  'login',
  'loginform',
  'authlogin',
  'signup',
  'signupform',
  'authsignup',
  'verifyemail',
  'emailverify',
  'verifymail',
  'cart',
  'shopcart',
  'shoppingcart',
  'wishlist',
  'wishlistpage',
  'checkout',
  'checkoutpage',
  'subscriptioncheckout',
  'subscriptioncheckoutpage',
  'pricing',
  'subscriptionpricing',
  'dashboard',
  'userdashboard',
  'accountdashboard',
  'dashboardnav',
  'dashboardprofile',
  'dashboardeditprofile',
  'dashboardaddresses',
  'dashboardpassword',
  'dashboardorders',
  'dashboardsubscriptionorders',
  'dashboardpayments',
  'dashboardsubscriptionpayments',
  'dashboardlogout',
  'headerhtml',
  'footerhtml',
  'layout',
]);

export function isKnownPageComponentCode(normalizedCode: string): boolean {
  return (
    KNOWN_PAGE_COMPONENT_CODES.has(normalizedCode) ||
    isCmsHtmlSlotCode(normalizedCode) ||
    isPostSectionCode(normalizedCode) ||
    isPostChildSectionCode(normalizedCode) ||
    isPostListSectionCode(normalizedCode) ||
    isPageHeaderSectionCode(normalizedCode) ||
    isMarkdownSectionCode(normalizedCode) ||
    isListFilterSectionCode(normalizedCode) ||
    isPostSingleSectionCode(normalizedCode) ||
    isProductSingleSectionCode(normalizedCode) ||
    isFormSectionCode(normalizedCode) ||
    isLoginSectionCode(normalizedCode) ||
    isSignupSectionCode(normalizedCode) ||
    isVerifyEmailSectionCode(normalizedCode) ||
    isCartSectionCode(normalizedCode) ||
    isWishlistSectionCode(normalizedCode) ||
    isCheckoutSectionCode(normalizedCode) ||
    isSubscriptionCheckoutSectionCode(normalizedCode) ||
    isDashboardSectionCode(normalizedCode) ||
    isDashboardPanelSectionCode(normalizedCode) ||
    isPricingSectionCode(normalizedCode) ||
    isLayoutSectionCode(normalizedCode) ||
    isChromeShellCode(normalizedCode) ||
    isChromeNestedCode(normalizedCode)
  );
}

/**
 * 加载页面关联的组件槽位（含已解析的 effectiveMetadata）
 */
export async function loadPageComponents(
  pageCode: string,
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<PageComponentSlot[]> {
  const pageData = await fetchWebPage(pageCode, tenantId);
  if (!pageData?.components?.length) {
    return [];
  }

  const slots: PageComponentSlot[] = [];

  for (let listIndex = 0; listIndex < pageData.components.length; listIndex++) {
    const association = pageData.components[listIndex];
    const componentsCode = String(association.components_code || '').trim();
    if (!componentsCode) continue;

    const componentRecord = await fetchWebComponent(componentsCode, tenantId);
    const componentMetadata = componentRecord?.metadata;
    const componentType = String(componentRecord?.type ?? '').trim();

    const { metadata: effectiveMetadata, source: metadataSource } = resolveEffectiveMetadata(
      association.metadata,
      componentMetadata
    );

    slots.push({
      componentId: association.component_id,
      componentsCode,
      normalizedCode: normalizeComponentCode(componentsCode),
      componentType,
      effectiveMetadata,
      metadataSource,
      sortOrder: resolvePageComponentSortOrder(association.sort_order),
      associationCreatedAt: String(association.created_at || ''),
      listIndex,
    });
  }

  return sortPageComponentSlots(slots);
}
