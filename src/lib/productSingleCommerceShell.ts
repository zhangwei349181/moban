/**
 * ProductSingle 交易运行时 DOM 锚点。
 * 这些 id / class 必须写在组件 html_url 模板里；内核不再注入整段交易 HTML。
 * 皮 CSS 覆盖这些钩子；不要依赖 Tailwind。
 */

export const PRODUCT_SINGLE_REQUIRED_IDS = [
  'product-loading-overlay',
  'discount-rules-outer',
  'discount-rules-list',
  'group-buying-list',
  'crowdfunding-list',
  'crowdfunding-delivery-time',
  'add-to-cart-btn',
  'product-wishlist-btn',
  'shipping-tax-summary',
  'discount-modal',
  'discount-modal-overlay',
  'shipping-rule-modal',
  'group-buying-modal',
  'crowdfunding-modal',
] as const;

export const PRODUCT_SINGLE_REQUIRED_CLASSES = [
  'color-plates',
  'shop-sizes',
  'quantity-num',
  'qty-input',
  'price-rating',
  'right-box-contain',
] as const;
