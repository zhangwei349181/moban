/**
 * Pricing 订阅定价区块 — 服务端拉取订阅商品变体并构建套餐卡片数据
 */

import {
  fetchArticleMain,
  fetchArticleContent,
  fetchArticleVariants,
} from './product';
import {
  buildSubscriptionPlanCards,
  normalizeVariantsResponse,
  type SubscriptionPlanCardView,
} from './subscriptionProduct';
import type { Currency } from './currencies';

export interface PricingMetadataRow {
  key: string;
  value: string;
}

export interface PricingSectionData {
  articleId: string;
  title: string;
  summary: string;
  galleryHtml: string;
  contentHtml: string;
  metadataRows: PricingMetadataRow[];
  planCards: SubscriptionPlanCardView[];
  error: boolean;
  empty: boolean;
}

function escapeHtml(value: string | null | undefined): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resolvePricingArticleId(metadata: Record<string, unknown> | undefined): string {
  const meta = metadata || {};
  return String(meta.article_id ?? meta.articleId ?? meta.product_id ?? meta.productId ?? '').trim();
}

function buildMetadataRows(metadata: Record<string, unknown> | undefined): PricingMetadataRow[] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
  return Object.entries(metadata)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([key, v]) => ({
      key,
      value: typeof v === 'object' ? JSON.stringify(v) : String(v),
    }));
}

function buildGalleryHtml(rawGallery: unknown, fallbackAlt: string, locale: string): string {
  const images: string[] =
    Array.isArray(rawGallery) && rawGallery.length > 0
      ? rawGallery.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : [];

  if (images.length === 0) return '';

  const zh = String(locale).split('-')[0].toLowerCase() === 'zh';
  const prevLabel = zh ? '上一张' : 'Previous';
  const nextLabel = zh ? '下一张' : 'Next';
  const carousel = images.length > 1;

  const slides = images
    .map((src, i) => {
      const active = i === 0 ? ' is-active' : '';
      const loading = i === 0 ? 'eager' : 'lazy';
      return `<div class="pricing-section__gallery-slide${active}" data-pricing-gallery-slide>
        <img src="${escapeHtml(src)}" alt="${escapeHtml(fallbackAlt)}" class="pricing-section__gallery-img" loading="${loading}">
      </div>`;
    })
    .join('');

  const navBlock = carousel
    ? `<button type="button" class="pricing-section__gallery-prev" data-pricing-gallery-prev aria-label="${escapeHtml(prevLabel)}">‹</button>
       <button type="button" class="pricing-section__gallery-next" data-pricing-gallery-next aria-label="${escapeHtml(nextLabel)}">›</button>`
    : '';

  const thumbsBlock = carousel
    ? `<div class="pricing-section__gallery-thumbs" data-pricing-gallery-thumbs>
        ${images
          .map(
            (src, i) =>
              `<button type="button" class="pricing-section__gallery-thumb${i === 0 ? ' is-active' : ''}" data-pricing-gallery-thumb aria-label="${escapeHtml(String(i + 1))}">
                <img src="${escapeHtml(src)}" alt="" class="pricing-section__gallery-thumb-img" loading="lazy">
              </button>`
          )
          .join('')}
      </div>`
    : '';

  return `<div class="pricing-section__gallery" data-pricing-gallery>
    <div class="pricing-section__gallery-main">
      <div class="pricing-section__gallery-track">${slides}</div>
      ${navBlock}
    </div>
    ${thumbsBlock}
  </div>`;
}

export interface LoadPricingSectionOptions {
  locale: string;
  tenantId: string;
  exchangeRate?: number;
  currentCurrency?: Currency | null;
}

export async function loadPricingSection(
  metadata: Record<string, unknown> | undefined,
  options: LoadPricingSectionOptions
): Promise<PricingSectionData> {
  const { locale, tenantId } = options;
  const articleId = resolvePricingArticleId(metadata);

  if (!articleId) {
    return {
      articleId: '',
      title: '',
      summary: '',
      galleryHtml: '',
      contentHtml: '',
      metadataRows: [],
      planCards: [],
      error: true,
      empty: true,
    };
  }

  try {
    const [articleMain, articleContent, variantsRes] = await Promise.all([
      fetchArticleMain(articleId, tenantId),
      fetchArticleContent(articleId, locale, tenantId),
      fetchArticleVariants(articleId, tenantId),
    ]);

    const title = articleContent.data.title || '';
    const summary = articleContent.data.summary || '';
    const contentHtml = articleContent.data.content || '';
    const articleMetadata = (articleContent.data.metadata || {}) as Record<string, unknown>;
    const metadataRows = buildMetadataRows(articleMetadata);
    const rawGallery = articleMain.data.article.metadata?.template_fields?.['Showcase Gallery'];

    const variantsNormalized = normalizeVariantsResponse(variantsRes);
    const planCards = buildSubscriptionPlanCards(variantsNormalized, locale, {
      exchangeRate: options.exchangeRate ?? 1,
      currentCurrency: options.currentCurrency ?? null,
      tenantId,
      articleId,
      productName: title || (locale.toLowerCase().startsWith('zh') ? '订阅方案' : 'Subscription'),
    });

    return {
      articleId,
      title,
      summary,
      galleryHtml: buildGalleryHtml(rawGallery, title, locale),
      contentHtml,
      metadataRows,
      planCards,
      error: false,
      empty: planCards.length === 0,
    };
  } catch (error) {
    console.error('[pricingSection] load failed:', articleId, error);
    return {
      articleId,
      title: '',
      summary: '',
      galleryHtml: '',
      contentHtml: '',
      metadataRows: [],
      planCards: [],
      error: true,
      empty: true,
    };
  }
}
