# type=`subscriptioncheckout`（订阅结账）

Skill 可读的组件类型契约。做订阅套餐结账页时读本文。不要从 a0005 的 Tailwind `subscriptioncheckout` HTML 直接入库。不要用 `static` 手写订阅结账表。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。一次性结账见 [checkout.md](./checkout.md)。定价 CTA 见定价组件（`checkout_url` 默认 `/subscriptioncheckout`）。

---

## 0. 读本文的 Agent 环境（先读）

假定你**已经具备**下列能力，鉴权与当前租户由工具处理，**不要**改用手写 HTTP、curl、密钥文件或「当前这台机器上的上传脚本」来完成本文任务。

1. **文档管理工具**：可直接在 `https://tenantdoc.gt6ai.xyz/{租户id}/` 下上传、覆盖、列举、删除、读取文件。传路径时**不要**自己拼租户 id。成功结果里的完整 `url` 才写入 metadata。
2. **CMS 工具**：可直接创建、读取、更新、删除 **组件**、**页面**，以及 **页面↔组件关联**。更新 metadata 是**整份替换**（先读后写）。`type` 是组件记录的独立字段，与 `metadata` 分开传。

上传时务必带对 MIME：

| 资源 | `content_type` |
|------|----------------|
| HTML | `text/html` 或 `text/html; charset=utf-8` |
| CSS | `text/css` 或 `text/css; charset=utf-8` |
| JS | `text/javascript` |

不要用默认的 `application/octet-stream`。

---

## 1. 何时读 / 何时不读

| 任务 | 读本文？ |
|------|----------|
| 订阅套餐结账页 | 是 |
| 把 a0005 某个 `subscriptioncheckout` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 一次性购物结账 | 否：`checkout` |
| 定价 / 套餐选择 | 否：`pricing`；其 CTA 应指向 `/subscriptioncheckout` |
| Stripe 成功/取消回跳 | 是：用本页 query（`?status=`），不要另开 `/subscription-checkout/return` |

---

## 2. 它是什么

`subscriptioncheckout` 是**订阅结账区块**：内核把文案与 URL 注入 `html_url` 的 `{{SUBCHECKOUT_*}}`，摘要、支付方式、账单地址由内核 `subscriptionCheckoutUi.client` 填充。数据来自本地 `subscription_cart_items` 最新一条；支付走 `POST /subscription/checkout/sessions`（`session_mode=subscription`）。

- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 页码必须是 `page_code=subscriptioncheckout`（URL `/subscriptioncheckout`）。**不要**用带连字符的 `subscription-checkout`（CMS `page_code` 仅字母数字）。
- 定价组件默认 `checkout_url` 必须是 `/subscriptioncheckout`。
- 选项 HTML 由内核注入，class 固定为 `subscription-checkout-section__*`。皮 CSS **必须**覆盖这些 class。
- 未登录显示 auth-gate。没有订阅购物车记录则显示 empty，返回 `/product`。
- Stripe 成功/取消回到 **本页** query：`/subscriptioncheckout?status=success&session_id={CHECKOUT_SESSION_ID}` 与 `/subscriptioncheckout?status=cancel`。

内核：组件记录 `type===subscriptioncheckout` → `subscriptionCheckout.astro`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退，也没有默认 `/assets/subscriptioncheckout.css`。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"subscriptioncheckout"` |
| 组件 `metadata` | **没有组件 type** |
| 页面-组件关联行 | **没有组件 type** |

创建时**显式传** `type=subscriptioncheckout`。漏传会变成默认 `static`，占位符原样输出、不会填订阅摘要。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `subscriptioncheckout01`，**不要** `subscription-checkout` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.subscriptioncheckout01` |
| 组件字段 `type` | `"subscriptioncheckout"` |
| 页面 `page_code` | `subscriptioncheckout`（URL `/subscriptioncheckout`） |

旧 code `subscriptioncheckoutpage` 仅兼容已有租户。

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/subscriptioncheckout/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/subscriptioncheckout/{components_code}/html
website/subscriptioncheckout/{components_code}/css
website/subscriptioncheckout/{components_code}/js
website/subscriptioncheckout/{components_code}/media
```

硬性：`css_url` **必填**。禁止 `/images/…`、站点相对路径、其它业务租户、内核 fallback 的 `/assets/subscriptioncheckout.css`。皮 CSS 必须覆盖空态、登录门、支付/地址选项、摘要、支付按钮、内核注入的 `.subscription-checkout-section__*`。不要假设全局有 `.btn`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-subscription-checkout-section>`。
2. **必须留下本文占位符与 data 钩子**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。订阅结账读写**不要**在自定义 init 里重写，除非 `use_platform_ui=false`。
6. 不要在 HTML 注释里写 `{{...}}` 字面量。页头已有 H1 时，区块标题用 `h2`。

### 6.1 必须保留的钩子

| 选择器 / 占位 | 说明 |
|---------------|------|
| `[data-subscription-checkout-section]` | 根 |
| `data-subscription-checkout-config` | `{{SUBCHECKOUT_CONFIG_JSON}}` |
| `[data-subscription-checkout-auth-gate]` / `[data-subscription-checkout-login-link]` | 未登录门 |
| `[data-subscription-checkout-empty]` / `[data-subscription-checkout-empty-shop-link]` | 无订阅项 |
| `[data-subscription-checkout-main]` | 主区 |
| `[data-subscription-checkout-summary-product-name]` / `attribute-name` / `payment-period` / `paid-price` | 摘要字段 |
| `[data-subscription-checkout-side-total]` | 侧栏合计 |
| `[data-subscription-checkout-payment-methods]` / `[data-subscription-checkout-payment-loading]` / `[data-subscription-checkout-payment-error]` | 支付方式 |
| `[data-subscription-checkout-billing-addresses]` / `[data-subscription-checkout-address-loading]` / `[data-subscription-checkout-address-error]` | 账单地址 |
| `[data-subscription-checkout-billing-add-wrap]` / `[data-subscription-checkout-billing-add-hint]` / `[data-subscription-checkout-add-billing-link]` | 无地址时的添加入口 |
| `[data-subscription-checkout-pay-btn]` / `[data-subscription-checkout-submit-error]` | 支付 |
| `[data-subscription-checkout-back-shop-link]` | 返回商城 |
| `.subscription-checkout-section__hidden` | 内核显隐 |

### 6.2 标量与条件

| 占位符 | 说明 |
|--------|------|
| `{{SUBCHECKOUT_TITLE}}` | 区块标题 |
| `{{SUBCHECKOUT_SUMMARY_TITLE}}` / 产品 / 套餐 / 周期 / 金额标签 | 摘要 |
| `{{SUBCHECKOUT_CONFIRM_TITLE}}` / `{{SUBCHECKOUT_TOTAL_LABEL}}` | 侧栏 |
| `{{SUBCHECKOUT_PAYMENT_TITLE}}` / `{{SUBCHECKOUT_BILLING_TITLE}}` | 支付 / 地址 |
| `{{SUBCHECKOUT_PAY_LABEL}}` / `{{SUBCHECKOUT_BACK_TO_SHOP_LABEL}}` | 按钮 |
| `{{SUBCHECKOUT_EMPTY_MESSAGE}}` / `{{SUBCHECKOUT_AUTH_MESSAGE}}` | 空态 / 登录门 |
| `{{SUBCHECKOUT_LOGIN_URL}}` / `{{SUBCHECKOUT_SHOP_URL}}` / `{{SUBCHECKOUT_ADDRESSES_URL}}` | 默认 `/login`、`/product`、`/dashboard#addresses` |
| `{{SUBCHECKOUT_CONFIG_JSON}}` | 已转义的 `data-subscription-checkout-config` |
| `{{#SUBCHECKOUT_HAS_TITLE}}` | 条件块 |

最小结构：

```html
<section class="subscriptioncheckout01" data-subscription-checkout-section data-subscription-checkout-config="{{SUBCHECKOUT_CONFIG_JSON}}">
  <div data-subscription-checkout-auth-gate class="subscription-checkout-section__hidden">
    <a href="{{SUBCHECKOUT_LOGIN_URL}}" data-subscription-checkout-login-link>{{SUBCHECKOUT_LOGIN_LABEL}}</a>
  </div>
  <div data-subscription-checkout-empty class="subscription-checkout-section__hidden">
    <a href="{{SUBCHECKOUT_SHOP_URL}}" data-subscription-checkout-empty-shop-link>{{SUBCHECKOUT_BACK_TO_SHOP_LABEL}}</a>
  </div>
  <div data-subscription-checkout-main class="subscription-checkout-section__hidden">
    <strong data-subscription-checkout-summary-product-name></strong>
    <div data-subscription-checkout-payment-methods></div>
    <div data-subscription-checkout-billing-addresses></div>
    <strong data-subscription-checkout-side-total></strong>
    <button type="button" data-subscription-checkout-pay-btn disabled>{{SUBCHECKOUT_PAY_LABEL}}</button>
  </div>
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 与 `[data-subscription-checkout-section] .subscription-checkout-section__*` 下。只引用 layout token。自己用 `max-width: var(--page-max)` + `padding-inline: var(--page-pad)`。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核始终跑订阅结账逻辑（`use_platform_ui` 默认 true）。若自定义 init 接管渲染，设 `use_platform_ui: false`。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `subscriptioncheckout01` |
| `type` | `"subscriptioncheckout"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止组件 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `header.title` | 区块标题 |
| `login_url` | 默认 `/login` |
| `shop_url` | 默认 `/product` |
| `addresses_url` | 默认 `/dashboard#addresses` |
| `success_return_path` | 默认 `/subscriptioncheckout?status=success&session_id={CHECKOUT_SESSION_ID}` |
| `cancel_return_path` | 默认 `/subscriptioncheckout?status=cancel` |
| `use_platform_ui` | 有自定义 init 时默认 false，否则 true |
| `translations[]` | 每语言 `html_url`、`css_url` |

关联行默许覆盖：标题、按钮文案、URL。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 订阅结账页

`page_code` 用 `subscriptioncheckout`（URL `/subscriptioncheckout`）。页面 metadata **只留 SEO**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**、**subscriptioncheckout `10`**、footer `20`。

pageheader 关联示例：

```json
{
  "header": { "title": "Subscription checkout" },
  "show_title": true,
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "subscriptioncheckout_title", "current": true }
    ]
  }
}
```

---

## 9. 入库清单

- [ ] `type=subscriptioncheckout`（组件字段，不在 metadata）
- [ ] `website/subscriptioncheckout/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-subscription-checkout-section`、`data-subscription-checkout-auth-gate`、`data-subscription-checkout-empty`、`data-subscription-checkout-pay-btn`
- [ ] CSS 无 Tailwind；`css_url` 必填；覆盖 `.subscription-checkout-section__*` / 空态 / 登录门 / 摘要
- [ ] 无自定义 init，或不重写订阅会话
- [ ] 订阅结账页 `page_code=subscriptioncheckout`，只关联 code + sort
