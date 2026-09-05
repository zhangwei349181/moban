/**
 * Pricing 订阅定价 HTML 模板注入（布局由 CMS html_url 定义）
 */

import type { SubscriptionPlanCardView } from './subscriptionProduct';
import type { PricingSectionData } from './pricingSection';

export interface PricingSectionLabels {
  plansSectionTitle: string;
  plansSectionLead: string;
  emptyMessage: string;
  featuredBadge: string;
  subscribeLabel: string;
  noFeaturesLine: string;
  yearlyHint: string;
  detailSectionTitle: string;
  accordionContentTitle: string;
  emptyContentMessage: string;
  accordionMetaTitle: string;
  emptyMetaMessage: string;
}

export interface PricingClientConfig {
  checkoutUrl: string;
}

export interface RenderPricingSectionOptions {
  data: PricingSectionData;
  labels: PricingSectionLabels;
  templateShell: string | null;
  clientConfig: PricingClientConfig;
}

const BLOCK_PATTERN = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

function escapeHtml(value: string | null | undefined): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function applyTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.split(`{{${key}}}`).join(value),
    template
  );
}

function expandConditionalBlocks(
  template: string,
  conditions: Record<string, boolean>
): string {
  let html = template;
  for (let pass = 0; pass < 16; pass += 1) {
    let changed = false;
    html = html.replace(BLOCK_PATTERN, (match, tag, body) => {
      if (!(tag in conditions)) return match;
      changed = true;
      return conditions[tag] ? body : '';
    });
    if (!changed) break;
  }
  return html;
}

function defaultBillingOption(card: SubscriptionPlanCardView) {
  return (
    card.billingOptions.find((o) => o.code === card.defaultBillingCode) || card.billingOptions[0]
  );
}

function isYearlyLikeCode(code: string): boolean {
  const c = code.toLowerCase();
  return c === 'yearly' || c === 'year' || c === 'annual';
}

function expandBillingOptions(
  template: string,
  card: SubscriptionPlanCardView
): string {
  const pattern = /\{\{#PRICING_BILLING_OPTION\}\}([\s\S]*?)\{\{\/PRICING_BILLING_OPTION\}\}/g;
  return template.replace(pattern, (_, body) =>
    card.billingOptions
      .map((opt) => {
        const active = opt.code === card.defaultBillingCode;
        return applyTemplate(body, {
          PRICING_BILLING_CODE: escapeHtml(opt.code),
          PRICING_BILLING_LABEL: escapeHtml(opt.buttonLabel),
          PRICING_BILLING_ACTIVE_CLASS: active ? 'active' : '',
          PRICING_BILLING_ARIA_PRESSED: active ? 'true' : 'false',
        });
      })
      .join('\n')
  );
}

function expandFeatureLines(
  template: string,
  card: SubscriptionPlanCardView,
  noFeaturesLine: string
): string {
  let html = template;
  const featurePattern = /\{\{#PRICING_FEATURE_LINE\}\}([\s\S]*?)\{\{\/PRICING_FEATURE_LINE\}\}/g;
  html = html.replace(featurePattern, (_, body) =>
    card.featureLines.length > 0
      ? card.featureLines
          .map((line) =>
            applyTemplate(body, {
              PRICING_FEATURE_TEXT: escapeHtml(line),
            })
          )
          .join('\n')
      : ''
  );
  return expandConditionalBlocks(html, {
    PRICING_PLAN_NO_FEATURES: card.featureLines.length === 0,
  }).replace(/\{\{PRICING_NO_FEATURES_LINE\}\}/g, escapeHtml(noFeaturesLine));
}

function expandMetadataRows(
  template: string,
  rows: PricingSectionData['metadataRows'],
  emptyMetaMessage: string
): string {
  const pattern = /\{\{#PRICING_METADATA_ROW\}\}([\s\S]*?)\{\{\/PRICING_METADATA_ROW\}\}/g;
  let html = template.replace(pattern, (_, body) =>
    rows.length > 0
      ? rows
          .map((row) =>
            applyTemplate(body, {
              PRICING_META_KEY: escapeHtml(row.key),
              PRICING_META_VALUE: escapeHtml(row.value),
            })
          )
          .join('\n')
      : ''
  );
  return expandConditionalBlocks(html, {
    PRICING_HAS_METADATA: rows.length > 0,
    PRICING_NO_METADATA: rows.length === 0,
  }).replace(/\{\{PRICING_EMPTY_META_MESSAGE\}\}/g, escapeHtml(emptyMetaMessage));
}

function expandPlanCards(
  template: string,
  cards: SubscriptionPlanCardView[],
  labels: PricingSectionLabels
): string {
  const pattern = /\{\{#PRICING_PLAN_CARD\}\}([\s\S]*?)\{\{\/PRICING_PLAN_CARD\}\}/g;
  return template.replace(pattern, (_, body) =>
    cards
      .map((card) => {
        const def = defaultBillingOption(card);
        const yearlyDefault = def && isYearlyLikeCode(def.code);
        let cardHtml = applyTemplate(body, {
          PRICING_PLAN_TITLE: escapeHtml(card.title),
          PRICING_PLAN_SUBTITLE: escapeHtml(card.subtitle),
          PRICING_PLAN_CURRENCY: escapeHtml(card.currencySymbol),
          PRICING_PLAN_PRICE: escapeHtml(def?.priceDisplay ?? '—'),
          PRICING_PLAN_PERIOD: escapeHtml(def?.periodSuffix ?? ''),
          PRICING_PLAN_EQUIV: escapeHtml(def?.equivHint ?? '\u00a0'),
          PRICING_PLAN_EQUIV_HIDDEN_ATTR: def?.equivHint ? '' : 'hidden',
          PRICING_PLAN_YEARLY_HINT_HIDDEN_ATTR: yearlyDefault ? '' : 'hidden',
          PRICING_PLAN_FEATURED_CLASS: card.featured ? 'pricing-plan-card--featured' : '',
          PRICING_FEATURED_BADGE: escapeHtml(labels.featuredBadge),
          PRICING_YEARLY_HINT: escapeHtml(labels.yearlyHint),
          PRICING_SUBSCRIBE_LABEL: escapeHtml(labels.subscribeLabel),
          PRICING_PLAN_PRICING_JSON_ATTR: escapeHtmlAttr(card.pricingJson),
          PRICING_PLAN_CART_PAYLOAD_ATTR: escapeHtmlAttr(card.cartPayloadJson),
        });

        cardHtml = expandConditionalBlocks(cardHtml, {
          PRICING_PLAN_IS_FEATURED: card.featured,
          PRICING_PLAN_HAS_BILLING_TOGGLE: card.billingOptions.length > 1,
        });

        cardHtml = expandBillingOptions(cardHtml, card);
        cardHtml = expandFeatureLines(cardHtml, card, labels.noFeaturesLine);
        return cardHtml;
      })
      .join('\n')
  );
}

export function renderPricingSectionHtml(options: RenderPricingSectionOptions): string {
  const { data, labels, templateShell, clientConfig } = options;
  if (!templateShell) return '';
  const hasContent = Boolean(data.contentHtml?.trim());

  let html = applyTemplate(templateShell, {
    PRICING_ARTICLE_ID: escapeHtml(data.articleId),
    PRICING_PAGE_TITLE: escapeHtml(data.title),
    PRICING_SUMMARY: escapeHtml(data.summary),
    PRICING_GALLERY_HTML: data.galleryHtml,
    PRICING_CONTENT_HTML: data.contentHtml,
    PRICING_PLANS_SECTION_TITLE: escapeHtml(labels.plansSectionTitle),
    PRICING_PLANS_SECTION_LEAD: escapeHtml(labels.plansSectionLead),
    PRICING_EMPTY_MESSAGE: escapeHtml(labels.emptyMessage),
    PRICING_DETAIL_SECTION_TITLE: escapeHtml(labels.detailSectionTitle),
    PRICING_ACCORDION_CONTENT_TITLE: escapeHtml(labels.accordionContentTitle),
    PRICING_EMPTY_CONTENT_MESSAGE: escapeHtml(labels.emptyContentMessage),
    PRICING_ACCORDION_META_TITLE: escapeHtml(labels.accordionMetaTitle),
    PRICING_EMPTY_META_MESSAGE: escapeHtml(labels.emptyMetaMessage),
    PRICING_CONFIG_JSON: escapeHtmlAttr(JSON.stringify(clientConfig)),
  });

  html = expandConditionalBlocks(html, {
    PRICING_HAS_PLANS: !data.empty && data.planCards.length > 0,
    PRICING_IS_EMPTY: data.empty,
    PRICING_HAS_ERROR: data.error,
    PRICING_HAS_CONTENT: hasContent,
    PRICING_HAS_GALLERY: Boolean(data.galleryHtml?.trim()),
    PRICING_HAS_SUMMARY: Boolean(data.summary?.trim()),
  });

  html = expandPlanCards(html, data.planCards, labels);
  html = expandMetadataRows(html, data.metadataRows, labels.emptyMetaMessage);
  return html;
}
