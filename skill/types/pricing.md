# type=`pricing`

路径与调用见文档根 `assets.md`。订阅下单页是 `subscriptioncheckout`。

## 功能

在需要展示**订阅套餐**并引导去订阅结账时使用。可挂首页（页面仍是 `general`）或独立定价页。

点击订阅：写入 `subscription_cart_items`，跳转 `checkout_url`（默认 `/subscriptioncheckout`，**不是**某个自定的定价页路径）。

---

## 使用方法

1. 创建组件，显式 `type=pricing`。
2. 卡片保留 `data-pricing-plan`、`data-pricing-subscribe` 及内核要求的 JSON/payload 属性。
3. 占位：`{{#PRICING_HAS_PLANS}}` `{{#PRICING_PLAN_CARD}}`、订阅按钮文案；详情皮还可有图集、正文、metadata 行。
4. 默认不必写 init（`use_platform_ui` 默认 true）。自定义 init 接管渲染时设 `use_platform_ui: false`。
5. 图集多于 1 张用原生轮播，不依赖 vendor 轮播库；非激活 slide 必须用皮 CSS 隐藏。

文件在 `website/pricing/{code}/`。

---

## 使用案例

**首页精简套餐卡。** 挂在 `general` 首页，sort 在头底之间。

**独立定价页。** 页面 code 可自定。CTA 仍指向 `/subscriptioncheckout`。

---

## 注意细节

- 不要把定价页的 `page_code` 做成 `subscriptioncheckout`。
- 漏传 type 不会跑定价逻辑。
