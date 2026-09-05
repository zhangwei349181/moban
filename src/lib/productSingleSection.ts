/**
 * ProductSingle 产品详情区块 — 服务端拉取产品展示数据与交易运行时 SSR 载荷
 */

import {
  fetchArticleMain,
  fetchArticleContent,
  fetchArticleVariants,
  fetchDiscountRules,
  fetchShippingTemplate,
  fetchTaxTemplate,
  fetchRegions,
  fetchGroupBuying,
  fetchCrowdfunding,
  fetchCategory,
  fetchTag,
  type ArticleMainData,
  type ArticleContentData,
  type ArticleVariantsData,
  type DiscountRulesData,
  type CategoryData,
  type TagData,
  type ShippingTemplateData,
  type TaxTemplateData,
  type RegionsData,
  type GroupBuyingData,
  type CrowdfundingData,
} from './product';
import { loadProductDetailViewModel, type ProductDetailViewModel } from './productDetail';
import { formatArticleTypeLabel, type TemplateFieldEntry } from './postSection';

export interface ProductSingleImageItem {
  src: string;
  alt: string;
  index: number;
}

export interface ProductSingleTaxonomyItem {
  id: string;
  name: string;
  href: string;
}

export interface ProductSingleMetadataBlock {
  key: string;
  html: string;
}

export interface ProductSingleSectionData {
  articleId: string;
  title: string;
  images: ProductSingleImageItem[];
  summary: string;
  mainContentHtml: string;
  metadataBlocks: ProductSingleMetadataBlock[];
  tags: ProductSingleTaxonomyItem[];
  categories: ProductSingleTaxonomyItem[];
  templateFields: Record<string, string>;
  templateFieldItems: TemplateFieldEntry[];
  price: string;
  articleType: string;
  articleTypeLabel: string;
  error: boolean;
}

export interface ProductSingleSsrPayload {
  articleMain: ArticleMainData;
  articleContent: ArticleContentData;
  variants: ArticleVariantsData;
  discountRules: DiscountRulesData;
  categories: CategoryData[];
  tags: TagData[];
  shippingTemplates: ShippingTemplateData[];
  taxTemplates: TaxTemplateData[];
  regionsData: RegionsData | null;
  groupBuyingData: GroupBuyingData | null;
  crowdfundingData: CrowdfundingData | null;
}

function boolMeta(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function resolveListPath(metadata: Record<string, unknown> | undefined): string {
  const raw =
    metadata?.list_path ??
    metadata?.listPath ??
    metadata?.base_path ??
    metadata?.basePath ??
    '/product';
  const path = String(raw).trim() || '/product';
  return path.startsWith('/') ? path : `/${path}`;
}

function parseExcludeFieldSlugs(metadata: Record<string, unknown>): Set<string> {
  const raw = metadata.exclude_template_fields ?? metadata.excludeTemplateFields;
  if (Array.isArray(raw)) {
    return new Set(raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean));
  }
  if (typeof raw === 'string' && raw.trim()) {
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
  }
  return new Set();
}

function filterTemplateFieldItems(
  entries: TemplateFieldEntry[],
  excludeSlugs: Set<string>
): TemplateFieldEntry[] {
  return entries.filter((item) => Boolean(item.value) && !excludeSlugs.has(item.slug));
}

function mapViewToSectionData(
  view: ProductDetailViewModel,
  articleId: string,
  metadata: Record<string, unknown>
): ProductSingleSectionData {
  const listPath = resolveListPath(metadata);
  const excludeSlugs = parseExcludeFieldSlugs(metadata);
  const templateFieldItems = filterTemplateFieldItems(view.templateFieldEntries, excludeSlugs);

  const images: ProductSingleImageItem[] = view.images.map((src, i) => ({
    src,
    alt: view.title,
    index: i + 1,
  }));

  return {
    articleId,
    title: view.title,
    images,
    summary: view.summary,
    mainContentHtml: view.mainContentHtml,
    metadataBlocks: view.metadataBlocks,
    tags: view.tags.map((tag) => ({
      ...tag,
      href: `${listPath}?tag_ids=${tag.id}`,
    })),
    categories: view.categories.map((cat) => ({
      ...cat,
      href: `${listPath}?category_ids=${cat.id}`,
    })),
    templateFields: view.templateFields,
    templateFieldItems,
    price: view.price,
    articleType: view.articleType,
    articleTypeLabel: formatArticleTypeLabel(view.articleType),
    error: false,
  };
}

export async function loadProductSingleSsrPayload(
  articleId: string,
  locale: string,
  tenantId: string
): Promise<ProductSingleSsrPayload | null> {
  if (!articleId?.trim() || !tenantId?.trim()) return null;

  try {
    const [articleMain, articleContent, variantsRes, discountRules] = await Promise.all([
      fetchArticleMain(articleId, tenantId),
      fetchArticleContent(articleId, locale, tenantId),
      fetchArticleVariants(articleId, tenantId),
      fetchDiscountRules(articleId, tenantId),
    ]);

    const variants: ArticleVariantsData = {
      success: variantsRes?.success ?? true,
      data: {
        attributes: Array.isArray(variantsRes?.data?.attributes) ? variantsRes.data.attributes : [],
        variants: Array.isArray(variantsRes?.data?.variants) ? variantsRes.data.variants : [],
      },
    };

    const categoryIds = articleMain.data.categories ?? [];
    const tagIds = articleMain.data.tags ?? [];
    const shippingTemplateIds = articleMain.data.shipping_template_ids ?? [];
    const taxTemplateIds = articleMain.data.tax_template_ids ?? [];

    const loadPromises: Promise<unknown>[] = [
      ...categoryIds.map((id) => fetchCategory(id, tenantId).catch(() => null)),
      ...tagIds.map((id) => fetchTag(id, tenantId).catch(() => null)),
      ...shippingTemplateIds.map((id) => fetchShippingTemplate(id, tenantId).catch(() => null)),
      ...taxTemplateIds.map((id) => fetchTaxTemplate(id, tenantId).catch(() => null)),
      fetchRegions(tenantId).catch(() => null),
    ];

    const articleType = articleMain.data.article.article_type;
    if (articleType === 'group_product') {
      loadPromises.push(fetchGroupBuying(articleId, tenantId).catch(() => null));
    }
    if (articleType === 'crowdfunding_product') {
      loadPromises.push(fetchCrowdfunding(articleId, tenantId).catch(() => null));
    }

    const results = await Promise.all(loadPromises);

    let offset = 0;
    const categories = results.slice(offset, offset + categoryIds.length).filter(Boolean) as CategoryData[];
    offset += categoryIds.length;
    const tags = results.slice(offset, offset + tagIds.length).filter(Boolean) as TagData[];
    offset += tagIds.length;
    const shippingTemplates = results
      .slice(offset, offset + shippingTemplateIds.length)
      .filter(Boolean) as ShippingTemplateData[];
    offset += shippingTemplateIds.length;
    const taxTemplates = results
      .slice(offset, offset + taxTemplateIds.length)
      .filter(Boolean) as TaxTemplateData[];
    offset += taxTemplateIds.length;
    const regionsData = (results[offset] as RegionsData | null) ?? null;
    offset += 1;

    let groupBuyingData: GroupBuyingData | null = null;
    let crowdfundingData: CrowdfundingData | null = null;
    if (articleType === 'group_product') {
      groupBuyingData = (results[offset] as GroupBuyingData | null) ?? null;
    } else if (articleType === 'crowdfunding_product') {
      crowdfundingData = (results[offset] as CrowdfundingData | null) ?? null;
    }

    return {
      articleMain,
      articleContent,
      variants,
      discountRules,
      categories,
      tags,
      shippingTemplates,
      taxTemplates,
      regionsData,
      groupBuyingData,
      crowdfundingData,
    };
  } catch (error) {
    console.error('[productSingleSection] SSR payload load failed:', articleId, error);
    return null;
  }
}

export interface LoadProductSingleSectionResult {
  data: ProductSingleSectionData;
  ssrPayload: ProductSingleSsrPayload | null;
}

export async function loadProductSingleSection(
  articleId: string,
  locale: string,
  tenantId: string,
  metadata: Record<string, unknown> | undefined
): Promise<LoadProductSingleSectionResult> {
  const meta = metadata || {};
  const id = String(articleId || '').trim();

  if (!id) {
    return {
      data: {
        articleId: '',
        title: '',
        images: [],
        summary: '',
        mainContentHtml: '',
        metadataBlocks: [],
        tags: [],
        categories: [],
        templateFields: {},
        templateFieldItems: [],
        price: '',
        articleType: '',
        articleTypeLabel: '',
        error: true,
      },
      ssrPayload: null,
    };
  }

  const [view, ssrPayload] = await Promise.all([
    loadProductDetailViewModel(id, locale, tenantId),
    loadProductSingleSsrPayload(id, locale, tenantId),
  ]);

  if (!view) {
    return {
      data: {
        articleId: id,
        title: '',
        images: [],
        summary: '',
        mainContentHtml: '',
        metadataBlocks: [],
        tags: [],
        categories: [],
        templateFields: {},
        templateFieldItems: [],
        price: '',
        articleType: '',
        articleTypeLabel: '',
        error: true,
      },
      ssrPayload: null,
    };
  }

  return {
    data: mapViewToSectionData(view, id, meta),
    ssrPayload,
  };
}

export function serializeProductSingleSsrPayload(payload: ProductSingleSsrPayload): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}
