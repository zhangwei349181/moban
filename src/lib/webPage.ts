/**
 * Web 页面静态 JSON（CDN）加载
 */

import { APP_CONFIG } from '../config/app';
import { getTranslationByLocale } from './menu';

export interface WebPageRecord {
  id: string;
  tenant_id: string;
  page_code: string;
  /** 页面表字段：general / list / postsingle / productsingle */
  type?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WebPageData {
  page: WebPageRecord;
  components: Array<{
    component_id: string;
    components_code: string;
    metadata: Record<string, unknown>;
    /** 页面-组件关联排序，默认 100 */
    sort_order?: number | string;
    created_at?: string;
  }>;
}

interface WebPageResponse {
  success: boolean;
  data: WebPageData;
}

interface PageLocalizedField {
  language_code: string;
  is_primary?: boolean;
  title?: string;
  text?: string;
  link_text?: string;
  label?: string;
  question?: string;
  answer?: string;
  text_before_link?: string;
}

type PageLocalizedKey =
  | 'title'
  | 'text'
  | 'link_text'
  | 'label'
  | 'question'
  | 'answer'
  | 'text_before_link';

function pickPageLocalized(
  translations: PageLocalizedField[] | undefined,
  locale: string,
  keys: PageLocalizedKey[]
): Partial<Pick<PageLocalizedField, PageLocalizedKey>> {
  const row = getTranslationByLocale(translations || [], locale) as PageLocalizedField | null;
  const out: Partial<Pick<PageLocalizedField, PageLocalizedKey>> = {};
  for (const key of keys) {
    const val = row?.[key];
    if (typeof val === 'string' && val) {
      out[key] = val;
    }
  }
  return out;
}

/**
 * 从 CDN 拉取单页详情（服务端 SSR / 构建时）
 */
export async function fetchWebPage(
  pageCode: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<WebPageData | null> {
  const url = `${APP_CONFIG.apiBaseUrl}/tenant_${tenantId}/web_pages/${pageCode}.json`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch web page "${pageCode}": ${response.statusText}`);
    }

    const json = (await response.json()) as WebPageResponse;
    if (!json.success || !json.data?.page) {
      throw new Error(`Invalid web page response: ${pageCode}`);
    }

    return json.data;
  } catch (error) {
    console.error(`[webPage] ${pageCode}:`, error);
    return null;
  }
}

// --- 页面索引 web_pages.json ---

export interface WebPageIndexItem {
  id: string;
  page_code: string;
  type?: string;
  created_at: string;
}

export interface WebPagesIndexData {
  tenant_id: string;
  pages: WebPageIndexItem[];
}

interface WebPagesIndexResponse {
  success: boolean;
  data: WebPagesIndexData;
}

/**
 * 从 CDN 拉取页面索引 tenant_{tenantId}/web_pages.json
 */
export async function fetchWebPagesIndex(
  tenantId: string = APP_CONFIG.tenantId
): Promise<WebPagesIndexData | null> {
  const url = `${APP_CONFIG.apiBaseUrl}/tenant_${tenantId}/web_pages.json`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch web pages index: ${response.statusText}`);
    }

    const json = (await response.json()) as WebPagesIndexResponse;
    if (!json.success || !Array.isArray(json.data?.pages)) {
      throw new Error('Invalid web pages index response');
    }

    return json.data;
  } catch (error) {
    console.error('[webPage] index:', error);
    return null;
  }
}

/** 页面索引中是否存在指定 page_code（精确匹配，区分大小写） */
export function hasPageCodeInIndex(
  index: WebPagesIndexData | null | undefined,
  pageCode: string
): boolean {
  return Boolean(findPageIndexItem(index, pageCode));
}

export function findPageIndexItem(
  index: WebPagesIndexData | null | undefined,
  pageCode: string
): WebPageIndexItem | null {
  if (!index?.pages?.length || !pageCode) return null;
  return index.pages.find((item) => item.page_code === pageCode) || null;
}

/** 拉取索引并判断 page_code 是否已注册 */
export async function isKnownWebPageCode(
  pageCode: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<boolean> {
  const index = await fetchWebPagesIndex(tenantId);
  return hasPageCodeInIndex(index, pageCode);
}

// --- FAQ page ---

interface FaqCategoryMeta {
  image?: string;
  alt?: string;
  translations?: PageLocalizedField[];
}

interface FaqSidebarMeta {
  contact_href?: string;
  translations?: PageLocalizedField[];
}

interface FaqItemMeta {
  heading_id?: string;
  collapse_id?: string;
  open_by_default?: boolean;
  translations?: PageLocalizedField[];
}

export interface FaqCategoryDisplay {
  image: string;
  alt: string;
  title: string;
  description: string;
}

export interface FaqItemDisplay {
  headingId: string;
  collapseId: string;
  openByDefault: boolean;
  question: string;
  answerHtml: string;
}

export interface FaqPageDisplay {
  seoTitle: string;
  breadcrumbTitle: string;
  breadcrumbText: string;
  categories: FaqCategoryDisplay[];
  sectionTitle: string;
  sectionTextBeforeLink: string;
  sectionLinkHref: string;
  sectionLinkText: string;
  items: FaqItemDisplay[];
}

const FAQ_DELIVERY_ANSWER_EN = `<p>Based on Google Maps distance calculation, delivery service is available within <strong>0-30km</strong> for orders totaling <strong>CAD 500 or more</strong> (inclusive).</p>
<div class="table-responsive">
  <table class="table">
    <thead>
      <tr>
        <th>Min Delivery Order (0-30km)</th>
        <th>Min Delivery Order (30-50km)</th>
        <th>Delivery &gt;50km</th>
        <th>Geography Scope</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>500</td>
        <td>1500</td>
        <td>Custom Quote</td>
        <td>Greater Vancouver</td>
      </tr>
    </tbody>
  </table>
</div>`;

const FAQ_DELIVERY_ANSWER_ZH = `<p>根据 Google 地图定位距离计算，若在 <strong>30 公里以内</strong>，且订单总金额 <strong>≥ 500 加币</strong>（含 500），可提供送货服务。</p>
<div class="table-responsive">
  <table class="table">
    <thead>
      <tr>
        <th>最低配送订单（0-30公里）</th>
        <th>最低配送订单（30-50公里）</th>
        <th>配送范围 &gt;50公里</th>
        <th>配送范围</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>500</td>
        <td>1500</td>
        <td>定制报价</td>
        <td>大温哥华地区</td>
      </tr>
    </tbody>
  </table>
</div>`;

const FAQ_FALLBACK: FaqPageDisplay = {
  seoTitle: 'FAQ',
  breadcrumbTitle: 'Frequently Asked Questions',
  breadcrumbText:
    'Welcome to the NEW WORLD IMPORTS FAQ page. Here you can find answers to common questions about our products, quotes, delivery services, and contact information. If you need more help, please contact our team directly.',
  categories: [
    {
      image: '/assets/images/inner-page/faq/start.png',
      alt: '',
      title: 'Products',
      description: 'Learn more about our Asian food product categories.',
    },
    {
      image: '/assets/images/inner-page/faq/help.png',
      alt: '',
      title: 'Quotes',
      description: 'Find information about quotes and business inquiries.',
    },
    {
      image: '/assets/images/inner-page/faq/price.png',
      alt: '',
      title: 'Delivery',
      description: 'Learn about our delivery services and service area.',
    },
    {
      image: '/assets/images/inner-page/faq/contact.png',
      alt: '',
      title: 'Contact',
      description: 'Quickly find our phone number, email, and address.',
    },
  ],
  sectionTitle: 'Frequently Asked Questions',
  sectionTextBeforeLink:
    'Here are answers to some of the questions we receive most often. If you do not find what you need, please ',
  sectionLinkHref: '/contact',
  sectionLinkText: 'contact us directly.',
  items: [
    {
      headingId: 'headingOne',
      collapseId: 'collapseOne',
      openByDefault: true,
      question: 'What does NEW WORLD IMPORTS do?',
      answerHtml:
        '<p>NEW WORLD IMPORTS is a family-owned company established in 1986, focused on supplying top quality Asian foods to Western Canada. We source products from reputable overseas brands and support retailers, grocery stores, and food-related businesses with dependable supply.</p>',
    },
    {
      headingId: 'headingTwo',
      collapseId: 'collapseTwo',
      openByDefault: false,
      question: 'What product categories do you offer?',
      answerHtml:
        '<p>We currently offer Thailand Products, Chinese Products, Vietnamese Products. Categories shown on our website include canned tropics, coconut products, curries, cooking ingredients, rice, drinks, noodles, household products, tea, spices, snacks, and groceries.</p>',
    },
    {
      headingId: 'headingFour',
      collapseId: 'collapseFour',
      openByDefault: false,
      question: 'What areas do you serve?',
      answerHtml:
        '<p>We primarily serve Greater Vancouver and Western Canada. If you are not sure whether your location is within our service area, please contact us to confirm.</p>',
    },
    {
      headingId: 'headingFive',
      collapseId: 'collapseFive',
      openByDefault: false,
      question: 'Do you offer delivery services?',
      answerHtml: FAQ_DELIVERY_ANSWER_EN,
    },
    {
      headingId: 'headingSix',
      collapseId: 'collapseSix',
      openByDefault: false,
      question: 'Where do your products come from?',
      answerHtml:
        '<p>We focus on sourcing Asian food products from reputable overseas brands. Our website currently highlights product categories from Thailand, China, and Vietnam.</p>',
    },
    {
      headingId: 'headingSeven',
      collapseId: 'collapseSeven',
      openByDefault: false,
      question: 'Who do you primarily serve?',
      answerHtml:
        '<p>We primarily serve grocery stores, retailers, and food-related businesses looking for reliable Asian food products.</p>',
    },
    {
      headingId: 'headingEight',
      collapseId: 'collapseEight',
      openByDefault: false,
      question: 'How can I contact NEW WORLD IMPORTS?',
      answerHtml:
        '<p>You can contact us by phone at 604-270-0036, by email at nwimports.newworld@gmail.com, or visit us at 578 E Kent Ave S, Vancouver BC V5X 4V6.</p>',
    },
    {
      headingId: 'headingNine',
      collapseId: 'collapseNine',
      openByDefault: false,
      question: 'Why choose NEW WORLD IMPORTS?',
      answerHtml:
        '<p>Because we have been dedicated to top quality Asian foods since 1986, with a strong focus on product quality, dependable service, and long-term customer relationships.</p>',
    },
  ],
};

const FAQ_FALLBACK_ZH: FaqPageDisplay = {
  seoTitle: '常见问题',
  breadcrumbTitle: '常见问题',
  breadcrumbText:
    '欢迎来到 NEW WORLD IMPORTS 常见问题页面。这里整理了关于产品、报价、配送和联系我们的常见问题。如果你需要更多帮助，请直接联系我们。',
  categories: [
    {
      image: '/assets/images/inner-page/faq/start.png',
      alt: '',
      title: '产品',
      description: '了解我们的亚洲食品产品类别。',
    },
    {
      image: '/assets/images/inner-page/faq/help.png',
      alt: '',
      title: '报价',
      description: '获取报价与业务咨询相关信息。',
    },
    {
      image: '/assets/images/inner-page/faq/price.png',
      alt: '',
      title: '配送',
      description: '了解配送服务与覆盖区域。',
    },
    {
      image: '/assets/images/inner-page/faq/contact.png',
      alt: '',
      title: '联系我们',
      description: '快速找到电话、邮箱和地址。',
    },
  ],
  sectionTitle: '常见问题',
  sectionTextBeforeLink: '这里整理了客户最常咨询的问题。如果你没有找到需要的答案，欢迎直接',
  sectionLinkHref: '/contact',
  sectionLinkText: '联系我们。',
  items: [
    {
      headingId: 'headingOne',
      collapseId: 'collapseOne',
      openByDefault: true,
      question: 'NEW WORLD IMPORTS 是做什么的？',
      answerHtml:
        '<p>NEW WORLD IMPORTS 是一家自 1986 年起经营的家族企业，专注于向加拿大西部市场供应高品质亚洲食品。我们从信誉良好的海外品牌采购产品，为零售商、杂货店和食品相关业务提供稳定可靠的产品供应。</p>',
    },
    {
      headingId: 'headingTwo',
      collapseId: 'collapseTwo',
      openByDefault: false,
      question: '你们提供哪些产品类别？',
      answerHtml:
        '<p>我们目前主要提供 Thailand Products、Chinese Products、Vietnamese Products 。具体类别包括泰国罐头食品、椰子制品、咖喱、烹饪配料、大米、饮品、面类、家居用品，以及中国茶、香料、零食、杂货和越南食品等。</p>',
    },
    {
      headingId: 'headingFour',
      collapseId: 'collapseFour',
      openByDefault: false,
      question: '你们服务哪些地区？',
      answerHtml:
        '<p>我们主要服务 Greater Vancouver 及加拿大西部市场。若你不确定是否在服务范围内，欢迎联系我们确认。</p>',
    },
    {
      headingId: 'headingFive',
      collapseId: 'collapseFive',
      openByDefault: false,
      question: '你们提供配送服务吗？',
      answerHtml: FAQ_DELIVERY_ANSWER_ZH,
    },
    {
      headingId: 'headingSix',
      collapseId: 'collapseSix',
      openByDefault: false,
      question: '你们的产品来自哪里？',
      answerHtml:
        '<p>我们致力于从信誉良好的海外品牌采购亚洲食品。官网目前重点展示了来自泰国、中国和越南的产品类别。</p>',
    },
    {
      headingId: 'headingSeven',
      collapseId: 'collapseSeven',
      openByDefault: false,
      question: '你们主要服务哪些客户？',
      answerHtml:
        '<p>我们主要服务杂货店、零售商以及食品相关业务客户。</p>',
    },
    {
      headingId: 'headingEight',
      collapseId: 'collapseEight',
      openByDefault: false,
      question: '如何联系 NEW WORLD IMPORTS？',
      answerHtml:
        '<p>你可以通过电话 604-270-0036，邮箱 nwimports.newworld@gmail.com 联系我们，也可以前往地址 578 E Kent Ave S, Vancouver BC V5X 4V6。</p>',
    },
    {
      headingId: 'headingNine',
      collapseId: 'collapseNine',
      openByDefault: false,
      question: '为什么选择 NEW WORLD IMPORTS？',
      answerHtml:
        '<p>因为我们自 1986 年起持续专注于高品质亚洲食品供应，重视产品质量、稳定服务以及长期合作关系。</p>',
    },
  ],
};

function getFaqFallback(locale: string): FaqPageDisplay {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? FAQ_FALLBACK_ZH : FAQ_FALLBACK;
}

function resolveFaqCategories(
  items: FaqCategoryMeta[] | undefined,
  locale: string,
  fallback: FaqCategoryDisplay[]
): FaqCategoryDisplay[] {
  if (!Array.isArray(items) || items.length === 0) return fallback;

  return items.map((item, index) => {
    const fb = fallback[index] || fallback[fallback.length - 1];
    const t = pickPageLocalized(item.translations, locale, ['label', 'text']);
    return {
      image:
        typeof item.image === 'string' && item.image ? item.image : fb.image,
      alt: typeof item.alt === 'string' ? item.alt : fb.alt,
      title: t.label || fb.title,
      description: t.text || fb.description,
    };
  });
}

function resolveFaqItems(
  items: FaqItemMeta[] | undefined,
  locale: string,
  fallback: FaqItemDisplay[]
): FaqItemDisplay[] {
  if (!Array.isArray(items) || items.length === 0) return fallback;

  return items.map((item, index) => {
    const fb = fallback[index] || fallback[fallback.length - 1];
    const t = pickPageLocalized(item.translations, locale, ['question', 'answer']);
    const headingId =
      typeof item.heading_id === 'string' && item.heading_id
        ? item.heading_id
        : fb.headingId;
    const collapseId =
      typeof item.collapse_id === 'string' && item.collapse_id
        ? item.collapse_id
        : fb.collapseId;

    return {
      headingId,
      collapseId,
      openByDefault:
        typeof item.open_by_default === 'boolean'
          ? item.open_by_default
          : fb.openByDefault,
      question: t.question || fb.question,
      answerHtml: t.answer || fb.answerHtml,
    };
  });
}

/**
 * 解析 FAQ 页面 metadata
 */
export function resolveFaqPageDisplay(
  metadata: Record<string, unknown> | undefined,
  locale: string
): FaqPageDisplay {
  const fallback = getFaqFallback(locale);
  const meta = metadata || {};

  const seoT = pickPageLocalized(
    (meta.seo as { translations?: PageLocalizedField[] } | undefined)?.translations,
    locale,
    ['title']
  );
  const breadcrumbT = pickPageLocalized(
    (meta.breadcrumb as { translations?: PageLocalizedField[] } | undefined)?.translations,
    locale,
    ['title', 'text']
  );
  const sectionT = pickPageLocalized(
    (meta.section as { translations?: PageLocalizedField[] } | undefined)?.translations,
    locale,
    ['title', 'text_before_link', 'link_text']
  );
  const sidebarMeta = (meta.section || meta.sidebar || {}) as FaqSidebarMeta;

  return {
    seoTitle: seoT.title || fallback.seoTitle,
    breadcrumbTitle: breadcrumbT.title || fallback.breadcrumbTitle,
    breadcrumbText: breadcrumbT.text || fallback.breadcrumbText,
    categories: resolveFaqCategories(
      meta.categories as FaqCategoryMeta[] | undefined,
      locale,
      fallback.categories
    ),
    sectionTitle: sectionT.title || fallback.sectionTitle,
    sectionTextBeforeLink:
      sectionT.text_before_link || fallback.sectionTextBeforeLink,
    sectionLinkHref:
      typeof sidebarMeta.contact_href === 'string' && sidebarMeta.contact_href
        ? sidebarMeta.contact_href
        : fallback.sectionLinkHref,
    sectionLinkText: sectionT.link_text || fallback.sectionLinkText,
    items: resolveFaqItems(
      meta.items as FaqItemMeta[] | undefined,
      locale,
      fallback.items
    ),
  };
}

/** FAQ 页面在后台的 page_code，须与 CDN 文件名一致（区分大小写） */
export const FAQ_PAGE_CODE = 'FAQ';

/**
 * 拉取并解析 FAQ 页面
 */
export async function fetchFaqPageDisplay(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<FaqPageDisplay> {
  const data = await fetchWebPage(FAQ_PAGE_CODE, tenantId);
  return resolveFaqPageDisplay(data?.page?.metadata, locale);
}
