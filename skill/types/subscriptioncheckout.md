# type=`subscriptioncheckout`

路径与调用见文档根 `assets.md`。套餐展示是 `pricing`。一次性结账是 `checkout`。

## 功能

订阅套餐结账。页面 `type=general`，`page_code` 必须是 `subscriptioncheckout`（URL `/subscriptioncheckout`）。定价 CTA 写入订阅购物车后跳到本页。

不要用连字符编码。不要把定价页做成这个 page_code。

---

## 使用方法

1. 创建组件，显式 `type=subscriptioncheckout`。
2. 保留规定的 `data-*` 与支付锚点。不要重写内核订阅支付。
3. `pricing` 组件的 `checkout_url` 默认指向本路径。

文件在 `website/subscriptioncheckout/{code}/`。

---

## 使用案例

**从套餐卡订阅。** 确认本页存在且主组件 type 正确；定价按钮不要改去随手起的路径。

**升级/续费。** 仍落在本页，由内核按登录态与当前订阅处理。

---

## 注意细节

- `page_code` 必须是 `subscriptioncheckout`。
- 漏传组件 type 不会挂订阅结账 runtime。
