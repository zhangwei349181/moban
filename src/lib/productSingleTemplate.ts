import type { ProductSingleSectionData } from './productSingleSection';

export interface ProductSingleSectionLabels {
  discountTitle: string;
  addToCart: string;
  wishlist: string;
  loading: string;
  addressPrompt: string;
  login: string;
  selectAddress: string;
  selectAddressOption: string;
  shippingAddress: string;
  shippingTemplate: string;
  viewShippingRule: string;
  selectTemplate: string;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  discountModalTitle: string;
  shippingModalTitle: string;
  cfTabInfo: string;
  cfTabUpdates: string;
  cfTabFaqs: string;
  tabDescription: string;
  tabAdditionalInfo: string;
  emptyDescription: string;
  emptyAdditionalInfo: string;
}

export interface RenderProductSingleSectionOptions {
  data: ProductSingleSectionData;
  labels: ProductSingleSectionLabels;
  templateShell: string;
}

const BLOCK_PATTERN = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
const PRODUCT_SINGLE_FIELD_PATTERN = /\{\{PRODUCT_SINGLE_FIELD_([a-z0-9_]+)\}\}/gi;
const PRODUCT_FIELD_PATTERN = /\{\{PRODUCT_FIELD_([a-z0-9_]+)\}\}/gi;
const PRODUCT_SINGLE_SUMMARY_LENGTH_PATTERN = /\{\{PRODUCT_SINGLE_SUMMARY_(\d+)\}\}/g;

function escapeHtml(value: string | null | undefined): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.split(`{{${key}}}`).join(value),
    template
  );
}

function applyRawHtml(template: string, key: string, html: string): string {
  return template.split(`{{${key}}}`).join(html);
}

function expandConditionalBlocks(
  template: string,
  conditions: Record<string, boolean>
): string {
  let result = template;
  for (let pass = 0; pass < 16; pass += 1) {
    let changed = false;
    result = result.replace(BLOCK_PATTERN, (match, tag, body) => {
      if (!(tag in conditions)) return match;
      changed = true;
      return conditions[tag] ? body : '';
    });
    if (!changed) break;
  }
  return result;
}

function expandImageItems(template: string, data: ProductSingleSectionData): string {
  const pattern = /\{\{#PRODUCT_SINGLE_IMAGE_ITEM\}\}([\s\S]*?)\{\{\/PRODUCT_SINGLE_IMAGE_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.images
      .map((image) =>
        applyTemplate(body, {
          IMAGE_SRC: escapeHtml(image.src),
          IMAGE_ALT: escapeHtml(image.alt),
          IMAGE_INDEX: String(image.index),
          IMAGE_LOADING: image.index === 1 ? 'eager' : 'lazy',
        })
      )
      .join('\n')
  );
}

function expandTagItems(template: string, data: ProductSingleSectionData): string {
  const pattern = /\{\{#PRODUCT_SINGLE_TAG_ITEM\}\}([\s\S]*?)\{\{\/PRODUCT_SINGLE_TAG_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.tags
      .map((tag) =>
        applyTemplate(body, {
          TAG_ID: escapeHtml(tag.id),
          TAG_NAME: escapeHtml(tag.name),
          TAG_HREF: escapeHtml(tag.href),
        })
      )
      .join('\n')
  );
}

function expandCategoryItems(template: string, data: ProductSingleSectionData): string {
  const pattern =
    /\{\{#PRODUCT_SINGLE_CATEGORY_ITEM\}\}([\s\S]*?)\{\{\/PRODUCT_SINGLE_CATEGORY_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.categories
      .map((cat) =>
        applyTemplate(body, {
          CATEGORY_ID: escapeHtml(cat.id),
          CATEGORY_NAME: escapeHtml(cat.name),
          CATEGORY_HREF: escapeHtml(cat.href),
        })
      )
      .join('\n')
  );
}

function expandMetadataBlocks(template: string, data: ProductSingleSectionData): string {
  const pattern =
    /\{\{#PRODUCT_SINGLE_METADATA_BLOCK\}\}([\s\S]*?)\{\{\/PRODUCT_SINGLE_METADATA_BLOCK\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.metadataBlocks
      .map((block) => {
        let html = applyTemplate(body, { METADATA_KEY: escapeHtml(block.key) });
        return applyRawHtml(html, 'METADATA_HTML', block.html);
      })
      .join('\n')
  );
}

function expandTemplateFieldItems(template: string, data: ProductSingleSectionData): string {
  const pattern =
    /\{\{#PRODUCT_SINGLE_TEMPLATE_FIELD_ITEM\}\}([\s\S]*?)\{\{\/PRODUCT_SINGLE_TEMPLATE_FIELD_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.templateFieldItems
      .map((field) =>
        applyTemplate(body, {
          FIELD_KEY: escapeHtml(field.key),
          FIELD_SLUG: escapeHtml(field.slug),
          FIELD_VALUE: escapeHtml(field.value),
        })
      )
      .join('\n')
  );
}

function templateFieldConditions(data: ProductSingleSectionData): Record<string, boolean> {
  const conditions: Record<string, boolean> = {
    PRODUCT_SINGLE_HAS_SUMMARY: Boolean(data.summary),
    PRODUCT_SINGLE_HAS_PRICE: Boolean(data.price),
    PRODUCT_SINGLE_HAS_ARTICLE_TYPE: Boolean(data.articleType),
    PRODUCT_SINGLE_HAS_TEMPLATE_FIELDS: data.templateFieldItems.length > 0,
  };
  for (const [slug, value] of Object.entries(data.templateFields)) {
    conditions[`PRODUCT_SINGLE_HAS_FIELD_${slug}`] = Boolean(value);
    conditions[`PRODUCT_HAS_FIELD_${slug}`] = Boolean(value);
  }
  return conditions;
}

function applyTemplateFieldPlaceholders(template: string, data: ProductSingleSectionData): string {
  let result = template;
  result = result.replace(PRODUCT_SINGLE_FIELD_PATTERN, (_, slug: string) => {
    const key = slug.toLowerCase();
    return escapeHtml(data.templateFields[key] || '');
  });
  result = result.replace(PRODUCT_FIELD_PATTERN, (_, slug: string) => {
    const key = slug.toLowerCase();
    return escapeHtml(data.templateFields[key] || '');
  });
  return result;
}

function buildGalleryHtml(data: ProductSingleSectionData): string {
  if (!data.images.length) {
    return `<div class="product-single-gallery">
      <div class="swiper product-single-gallery-main">
        <div class="swiper-wrapper">
          <div class="swiper-slide"><img src="" alt="" /></div>
        </div>
      </div>
    </div>`;
  }

  const slides = data.images
    .map(
      (img, i) =>
        `<div class="swiper-slide${i === 0 ? ' is-active swiper-slide-active' : ''}"><img src="${escapeHtml(img.src)}" ${i === 0 ? 'id="img-1"' : ''} alt="${escapeHtml(img.alt)}" loading="${i === 0 ? 'eager' : 'lazy'}" /></div>`
    )
    .join('');

  const thumbSlides = data.images
    .map(
      (img, i) =>
        `<div class="swiper-slide${i === 0 ? ' is-active swiper-slide-thumb-active' : ''}"><img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" loading="lazy" /></div>`
    )
    .join('');

  const thumbsBlock =
    data.images.length > 1
      ? `<div class="swiper product-single-gallery-thumbs">
          <div class="swiper-wrapper">${thumbSlides}</div>
        </div>`
      : '';

  const navBlock =
    data.images.length > 1
      ? `<button type="button" class="product-single-gallery-prev" aria-label="Previous">‹</button>
         <button type="button" class="product-single-gallery-next" aria-label="Next">›</button>`
      : '';

  return `<div class="product-single-gallery">
    <div class="product-main">
      <div class="swiper product-single-gallery-main">
        <div class="swiper-wrapper">${slides}</div>
        ${navBlock}
      </div>
    </div>
    ${thumbsBlock}
    <div class="left-slider-image" hidden aria-hidden="true"></div>
  </div>`;
}

function buildLabelReplacements(
  data: ProductSingleSectionData,
  labels: ProductSingleSectionLabels
): Record<string, string> {
  const featured = data.images[0];
  return {
    PRODUCT_SINGLE_ARTICLE_ID: escapeHtml(data.articleId),
    PRODUCT_SINGLE_TITLE: escapeHtml(data.title),
    PRODUCT_SINGLE_SUMMARY: escapeHtml(data.summary),
    PRODUCT_SINGLE_PRICE: escapeHtml(data.price),
    PRODUCT_SINGLE_ARTICLE_TYPE: escapeHtml(data.articleType),
    PRODUCT_SINGLE_ARTICLE_TYPE_LABEL: escapeHtml(data.articleTypeLabel),
    PRODUCT_SINGLE_FEATURED_IMAGE: escapeHtml(featured?.src || ''),
    PRODUCT_SINGLE_FEATURED_IMAGE_ALT: escapeHtml(featured?.alt || data.title),
    PRODUCT_SINGLE_GALLERY_HTML: buildGalleryHtml(data),
    PRODUCT_SINGLE_DISCOUNT_TITLE: escapeHtml(labels.discountTitle),
    PRODUCT_SINGLE_ADD_TO_CART: escapeHtml(labels.addToCart),
    PRODUCT_SINGLE_WISHLIST: escapeHtml(labels.wishlist),
    PRODUCT_SINGLE_LOADING: escapeHtml(labels.loading),
    PRODUCT_SINGLE_ADDRESS_PROMPT: escapeHtml(labels.addressPrompt),
    PRODUCT_SINGLE_LOGIN: escapeHtml(labels.login),
    PRODUCT_SINGLE_SELECT_ADDRESS: escapeHtml(labels.selectAddress),
    PRODUCT_SINGLE_SELECT_ADDRESS_OPTION: escapeHtml(labels.selectAddressOption),
    PRODUCT_SINGLE_SHIPPING_ADDRESS: escapeHtml(labels.shippingAddress),
    PRODUCT_SINGLE_SHIPPING_TEMPLATE: escapeHtml(labels.shippingTemplate),
    PRODUCT_SINGLE_VIEW_SHIPPING_RULE: escapeHtml(labels.viewShippingRule),
    PRODUCT_SINGLE_SELECT_TEMPLATE: escapeHtml(labels.selectTemplate),
    PRODUCT_SINGLE_SUBTOTAL: escapeHtml(labels.subtotal),
    PRODUCT_SINGLE_SHIPPING: escapeHtml(labels.shipping),
    PRODUCT_SINGLE_TAX: escapeHtml(labels.tax),
    PRODUCT_SINGLE_TOTAL: escapeHtml(labels.total),
    PRODUCT_SINGLE_DISCOUNT_MODAL_TITLE: escapeHtml(labels.discountModalTitle),
    PRODUCT_SINGLE_SHIPPING_MODAL_TITLE: escapeHtml(labels.shippingModalTitle),
    PRODUCT_SINGLE_CF_TAB_INFO: escapeHtml(labels.cfTabInfo),
    PRODUCT_SINGLE_CF_TAB_UPDATES: escapeHtml(labels.cfTabUpdates),
    PRODUCT_SINGLE_CF_TAB_FAQS: escapeHtml(labels.cfTabFaqs),
    PRODUCT_SINGLE_TAB_DESCRIPTION: escapeHtml(labels.tabDescription),
    PRODUCT_SINGLE_TAB_ADDITIONAL_INFO: escapeHtml(labels.tabAdditionalInfo),
    PRODUCT_SINGLE_EMPTY_DESCRIPTION: escapeHtml(labels.emptyDescription),
    PRODUCT_SINGLE_EMPTY_ADDITIONAL_INFO: escapeHtml(labels.emptyAdditionalInfo),
  };
}

export function renderProductSingleSectionHtml(options: RenderProductSingleSectionOptions): string {
  const { data, labels, templateShell } = options;

  const hasContent = !data.error && Boolean(data.title);
  const hasImages = data.images.length > 0;
  const hasSingleImage = data.images.length === 1;
  const hasGallery = data.images.length > 1;
  const hasMainContent = Boolean(data.mainContentHtml?.trim());
  const hasMetadata = data.metadataBlocks.length > 0;
  const hasTags = data.tags.length > 0;
  const hasCategories = data.categories.length > 0;
  const hasTaxonomy = hasTags || hasCategories;

  let html = templateShell;
  html = applyTemplate(html, buildLabelReplacements(data, labels));

  const conditions: Record<string, boolean> = {
    PRODUCT_SINGLE_ERROR: data.error,
    PRODUCT_SINGLE_HAS_CONTENT: hasContent,
    PRODUCT_SINGLE_HAS_IMAGES: hasImages,
    PRODUCT_SINGLE_HAS_SINGLE_IMAGE: hasSingleImage,
    PRODUCT_SINGLE_HAS_GALLERY: hasGallery,
    PRODUCT_SINGLE_HAS_MAIN_CONTENT: hasMainContent,
    PRODUCT_SINGLE_HAS_METADATA: hasMetadata,
    PRODUCT_SINGLE_HAS_TAXONOMY: hasTaxonomy,
    PRODUCT_SINGLE_HAS_TAGS: hasTags,
    PRODUCT_SINGLE_HAS_CATEGORIES: hasCategories,
    ...templateFieldConditions(data),
  };

  html = expandConditionalBlocks(html, conditions);
  html = expandImageItems(html, data);
  html = expandTagItems(html, data);
  html = expandCategoryItems(html, data);
  html = expandMetadataBlocks(html, data);
  html = expandTemplateFieldItems(html, data);
  html = applyTemplateFieldPlaceholders(html, data);

  html = html.replace(PRODUCT_SINGLE_SUMMARY_LENGTH_PATTERN, (_, len: string) => {
    const max = parseInt(len, 10);
    if (!data.summary || !Number.isFinite(max) || max <= 0) return escapeHtml(data.summary);
    if (data.summary.length <= max) return escapeHtml(data.summary);
    return `${escapeHtml(data.summary.slice(0, max))}…`;
  });

  html = applyRawHtml(html, 'PRODUCT_SINGLE_MAIN_CONTENT', data.mainContentHtml || '');
  html = applyTemplate(html, buildLabelReplacements(data, labels));

  return html;
}
