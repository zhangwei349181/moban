# type=`checkout`

路径与调用见文档根 `assets.md`。购物车页是 `cart`。订阅结账是 `subscriptioncheckout`。

## 功能

一次性商品结账（地址、支付、确认）。页面 `type=general`，`page_code` 必须是 `checkout`（URL `/checkout`）。购物车「去结算」落到本页。

支付成功/取消回 **本页 query**，不要另开 `/checkout/return`。

---

## 使用方法

1. 创建组件，显式 `type=checkout`。
2. 保留参考实现上的表单锚点与 `data-checkout-*`。不要用自定义 init 重写内核交易。
3. 账单地址可链到会员中心地址面板（如 `/dashboard#addresses`）。
4. 关联覆盖文案。sort 同其它功能页。

文件在 `website/checkout/{code}/`。`css_url` 必填。

---

## 使用案例

**从购物车结算。** `cart` 的 `checkout_url` 保持 `/checkout`。本页存在且挂了 `type=checkout`。

**支付回跳。** 仍落在 `/checkout?...`，不要新建回跳页。

---

## 注意细节

- 改 `page_code` 会导致支付回跳失败。
- 漏传组件 type 不会挂结账 runtime。
