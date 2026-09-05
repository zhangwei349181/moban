/**
 * 购物车函数库
 * 用于处理购物车数据的保存、读取、更新、删除等操作
 */

/**
 * 购物车项数据结构
 */
export interface CartItem {
  id: string;                    // 唯一标识（生成UUID）
  article_id: string;            // 产品ID
  variant_id?: string;           // 变体ID（如果有）
  selected_attributes?: {        // 选择的属性
    [attributeId: string]: string; // attributeId → attributeValueId
  };
  quantity: number;              // 数量
  unit_price: number;            // 单价（基础货币，折扣后的价格）
  original_unit_price: number;   // 原价（基础货币，折扣前的价格）
  discount_amount: number;       // 单件折扣金额（基础货币，不是总折扣金额）
  shipping_fee: number;          // 运费（基础货币）
  tax_fee: number;               // 税费（基础货币）
  shipping_address_id?: string;  // 选择的收货地址ID
  shipping_template_id?: string; // 选择的运费模板ID
  tax_template_id?: string;      // 选择的税费模板ID
  added_at: string;              // 添加时间（ISO 8601）
  // 额外字段（用户要求）
  article_type: string;          // 产品类型（主json获取）
  product_name: string;          // 产品名称
  product_sku?: string;          // 产品SKU（如果有变体）
  product_image_url: string;     // 产品缩略图URL
  discount_rule_ids?: string[];  // 所匹配的折扣规则ID数组（支持折上折，按优先级顺序）
  currency_code: string;         // 货币代码
  group_buying_id?: string;      // 团购活动ID（如果参加了团购）
  crowdfunding_activity_id?: string; // 众筹活动ID（如果参加了众筹）
  crowdfunding_reward_id?: string;   // 众筹回报档位ID（如果参加了众筹）
  // 可选：用于显示的产品信息（不用于计算）
  product_title?: string;
  product_image?: string;
  variant_name?: string;
}

/**
 * 购物车存储键
 */
const CART_STORAGE_KEY = 'cart_items';

/**
 * 生成UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 获取所有购物车项
 * @returns 购物车项数组
 */
export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const items = JSON.parse(stored) as CartItem[];
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error('Failed to get cart items:', error);
    return [];
  }
}

/**
 * 保存购物车项到 localStorage
 * @param items 购物车项数组
 */
function saveCartItems(items: CartItem[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart items:', error);
  }
}

/**
 * 添加商品到购物车
 * @param item 购物车项（不需要 id 和 added_at，会自动生成）
 * @returns 添加后的购物车项（包含 id 和 added_at）
 */
export function addToCart(item: Omit<CartItem, 'id' | 'added_at'>): CartItem {
  const items = getCartItems();
  
  const newItem: CartItem = {
    ...item,
    id: generateUUID(),
    added_at: new Date().toISOString(),
  };

  items.push(newItem);
  saveCartItems(items);

  return newItem;
}

/**
 * 更新购物车项
 * @param itemId 购物车项ID
 * @param updates 要更新的字段
 * @returns 更新后的购物车项，如果没有找到则返回 null
 */
export function updateCartItem(
  itemId: string,
  updates: Partial<Omit<CartItem, 'id' | 'article_id' | 'added_at'>>
): CartItem | null {
  const items = getCartItems();
  const index = items.findIndex(item => item.id === itemId);

  if (index === -1) {
    return null;
  }

  items[index] = {
    ...items[index],
    ...updates,
  };

  saveCartItems(items);
  return items[index];
}

/**
 * 从购物车删除商品
 * @param itemId 购物车项ID
 * @returns 是否删除成功
 */
export function removeFromCart(itemId: string): boolean {
  const items = getCartItems();
  const filteredItems = items.filter(item => item.id !== itemId);

  if (filteredItems.length === items.length) {
    return false; // 没有找到要删除的项
  }

  saveCartItems(filteredItems);
  return true;
}

/**
 * 清空购物车
 */
export function clearCart(): void {
  saveCartItems([]);
}

/**
 * 根据产品ID和变体ID查找购物车项
 * @param articleId 产品ID
 * @param variantId 变体ID（可选）
 * @returns 找到的购物车项数组
 */
export function findCartItemsByProduct(
  articleId: string,
  variantId?: string
): CartItem[] {
  const items = getCartItems();
  
  return items.filter(item => {
    if (item.article_id !== articleId) {
      return false;
    }
    
    if (variantId !== undefined) {
      return item.variant_id === variantId;
    }
    
    return true;
  });
}

/**
 * 计算购物车总金额
 * @returns 总金额对象
 */
export function calculateCartTotal(): {
  subtotal: number;      // 小计（单价 × 数量 - 折扣）
  shippingFee: number;   // 总运费
  taxFee: number;        // 总税费
  total: number;         // 总计
  itemCount: number;     // 商品数量
} {
  const items = getCartItems();

  let subtotal = 0;
  let shippingFee = 0;
  let taxFee = 0;
  let itemCount = 0;

  for (const item of items) {
    const itemSubtotal = item.unit_price * item.quantity;
    subtotal += itemSubtotal;
    shippingFee += item.shipping_fee;
    taxFee += item.tax_fee;
    itemCount += item.quantity;
  }

  const total = subtotal + shippingFee + taxFee;

  return {
    subtotal,
    shippingFee,
    taxFee,
    total,
    itemCount,
  };
}

/**
 * 获取购物车项数量
 * @returns 购物车项数量
 */
export function getCartItemCount(): number {
  const items = getCartItems();
  return items.length;
}

/**
 * 获取购物车商品总数量
 * @returns 商品总数量（所有项的 quantity 之和）
 */
export function getCartTotalQuantity(): number {
  const items = getCartItems();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * 根据ID获取购物车项
 * @param itemId 购物车项ID
 * @returns 购物车项，如果没有找到则返回 null
 */
export function getCartItem(itemId: string): CartItem | null {
  const items = getCartItems();
  return items.find(item => item.id === itemId) || null;
}

/**
 * 检查购物车是否为空
 * @returns 是否为空
 */
export function isCartEmpty(): boolean {
  return getCartItemCount() === 0;
}

/**
 * 验证购物车项数据的完整性
 * @param item 购物车项
 * @returns 验证结果
 */
export function validateCartItem(item: Partial<CartItem>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!item.article_id) {
    errors.push('产品ID不能为空');
  }

  if (!item.quantity || item.quantity <= 0) {
    errors.push('数量必须大于0');
  }

  if (item.unit_price === undefined || item.unit_price < 0) {
    errors.push('单价不能为负数');
  }

  if (item.original_unit_price === undefined || item.original_unit_price < 0) {
    errors.push('原价不能为负数');
  }

  if (item.discount_amount === undefined || item.discount_amount < 0) {
    errors.push('折扣金额不能为负数');
  }

  if (item.shipping_fee === undefined || item.shipping_fee < 0) {
    errors.push('运费不能为负数');
  }

  if (item.tax_fee === undefined || item.tax_fee < 0) {
    errors.push('税费不能为负数');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 将服务端返回的一行合并进本地缓存（供头部 minicart / 角标等仍读 localStorage 的 UI）。
 * 主数据源以服务端为准；加购成功后请优先调用 {@link syncLocalCartFromServer}（见 cart-api）全量对齐。
 */
export function appendCartItemFromServer(item: CartItem): void {
  const items = getCartItems();
  items.push(item);
  saveCartItems(items);
}

/**
 * 用 GET /cart 返回的完整列表覆盖本地缓存（与「以服务端为准」一致）
 */
export function replaceCartItemsFromServer(items: CartItem[]): void {
  saveCartItems(items);
}

/**
 * 客户端专用的购物车函数
 */
export const clientCart = {
  getCartItems,
  addToCart,
  appendCartItemFromServer,
  replaceCartItemsFromServer,
  updateCartItem,
  removeFromCart,
  clearCart,
  findCartItemsByProduct,
  calculateCartTotal,
  getCartItemCount,
  getCartTotalQuantity,
  getCartItem,
  isCartEmpty,
  validateCartItem,
};

