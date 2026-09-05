# type=`checkout`（结账）

Skill 可读的组件类型契约。做一次性购物结账页时读本文。不要从 a0005 的 Tailwind `checkout` HTML 直接入库。不要用 `static` 手写结账表。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。购物车见 [cart.md](./cart.md)。订阅结账见 [subscriptioncheckout.md](./subscriptioncheckout.md)。

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
| 一次性购物结账页 | 是 |
| 把 a0005 某个 `checkout` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 购物车 | 否：`cart` |
| 订阅套餐结账 | 否：`subscriptioncheckout` |
| Stripe 成功/取消回跳 | 是：用本页 query（`?status=`），不要另开 `/checkout/return` 这种 CMS 不存在的嵌套路由 |

---

## 2. 它是什么

`checkout` 是**一次性购物结账区块**：内核把文案与 URL 注入 `html_url` 的 `{{CHECKOUT_*}}`，行项目、支付方式、账单地址由内核 `checkoutUi.client` 填充。已登录则先同步 Sales `/cart`，支付走 `POST /checkout/sessions`（`session_mode=payment`）。

- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 结账页 `page_code=checkout`（URL `/checkout`）通常只挂一个。购物车结算按钮应链到 `/checkout`，不要 `/shopcart`。
- 行 HTML 由内核注入，class 固定为 `checkout-section__*`。皮 CSS **必须**覆盖这些 class，以及本组件根 class。
- 未登录显示 auth-gate，登录链接带 `?return=` 回本页。空车显示 empty，返回 `/cart`。
- Stripe 成功/取消回到 **本页** query：`/checkout?status=success&session_id={CHECKOUT_SESSION_ID}` 与 `/checkout?status=cancel`。不要建 `/checkout/return`。

内核：组件记录 `type===checkout` → `checkout.astro`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退，也没有默认 `/assets/checkout.css`。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"checkout"` |
| 组件 `metadata` | **没有组件 type** |
| 页面-组件关联行 | **没有组件 type** |

创建时**显式传** `type=checkout`。漏传会变成默认 `static`，占位符原样输出、不会填结账行。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `checkout01`，**不要** `check-out` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.checkout01` |
| 组件字段 `type` | `"checkout"` |
| 页面 `page_code` | `checkout`（URL `/checkout`） |

旧 code `checkoutpage` 仅兼容已有租户。`checkout*` 正则**不会**匹配 `subscriptioncheckout`。

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/checkout/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/checkout/{components_code}/html
website/checkout/{components_code}/css
website/checkout/{components_code}/js
website/checkout/{components_code}/media
```

硬性：`css_url` **必填**。禁止 `/images/…`、站点相对路径、其它业务租户、内核 fallback 的 `/assets/checkout.css`。皮 CSS 必须覆盖表格、空态、登录门、支付/地址选项、汇总、支付按钮、内核注入的 `.checkout-section__*`。不要假设全局有 `.btn`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-checkout-section>`。
2. **必须留下本文占位符与 data 钩子**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。结账读写**不要**在自定义 init 里重写，除非 `use_platform_ui=false`。
6. 不要在 HTML 注释里写 `{{...}}` 字面量。页头已有 H1 时，区块标题用 `h2`。

### 6.1 必须保留的钩子

| 选择器 / 占位 | 说明 |
|---------------|------|
| `[data-checkout-section]` | 根 |
| `data-checkout-config` | `{{CHECKOUT_CONFIG_JSON}}` |
| `[data-checkout-auth-gate]` / `[data-checkout-login-link]` | 未登录门 |
| `[data-checkout-empty]` / `[data-checkout-empty-cart-link]` | 空车 |
| `[data-checkout-main]` | 有货主区 |
| `[data-checkout-table-wrap]` / `[data-checkout-table-body]` | 桌面表格 |
| `[data-checkout-table-mobile]` | 窄屏列表 |
| `[data-checkout-payment-methods]` / `[data-checkout-payment-loading]` / `[data-checkout-payment-error]` | 支付方式 |
| `[data-checkout-billing-addresses]` / `[data-checkout-address-loading]` / `[data-checkout-address-error]` | 账单地址 |
| `[data-checkout-billing-add-wrap]` / `[data-checkout-billing-add-hint]` / `[data-checkout-add-billing-link]` | 无地址时的添加入口 |
| `[data-checkout-subtotal]` / `[data-checkout-shipping]` / `[data-checkout-tax]` / `[data-checkout-total]` | 金额 |
| `[data-checkout-settle-currency-line]` / `[data-checkout-settle-currency-code]` | 结算货币 |
| `[data-checkout-pay-btn]` / `[data-checkout-submit-error]` | 支付 |
| `[data-checkout-back-cart-link]` | 返回购物车 |
| `.checkout-section__hidden` | 内核显隐 |

### 6.2 标量与条件

| 占位符 | 说明 |
|--------|------|
| `{{CHECKOUT_TITLE}}` | 区块标题 |
| `{{CHECKOUT_ORDER_SUMMARY_TITLE}}` 等列头 | 产品 / 价格 / 数量 / 小计 |
| `{{CHECKOUT_SUMMARY_TITLE}}` / 汇总标签 / `{{CHECKOUT_TOTAL_LABEL}}` | 侧栏 |
| `{{CHECKOUT_PAYMENT_TITLE}}` / `{{CHECKOUT_BILLING_TITLE}}` | 支付 / 地址 |
| `{{CHECKOUT_PAY_LABEL}}` / `{{CHECKOUT_BACK_TO_CART_LABEL}}` | 按钮 |
| `{{CHECKOUT_EMPTY_MESSAGE}}` / `{{CHECKOUT_AUTH_MESSAGE}}` | 空态 / 登录门 |
| `{{CHECKOUT_LOGIN_URL}}` / `{{CHECKOUT_CART_URL}}` / `{{CHECKOUT_ADDRESSES_URL}}` | 默认 `/login`、`/cart`、`/dashboard#addresses` |
| `{{CHECKOUT_CONFIG_JSON}}` | 已转义的 `data-checkout-config` |
| `{{#CHECKOUT_HAS_TITLE}}` | 条件块 |

最小结构：

```html
<section class="checkout01" data-checkout-section data-checkout-config="{{CHECKOUT_CONFIG_JSON}}">
  <div data-checkout-auth-gate class="checkout-section__hidden">
    <a href="{{CHECKOUT_LOGIN_URL}}" data-checkout-login-link>{{CHECKOUT_LOGIN_LABEL}}</a>
  </div>
  <div data-checkout-empty class="checkout-section__hidden">
    <a href="{{CHECKOUT_CART_URL}}" data-checkout-empty-cart-link>{{CHECKOUT_BACK_TO_CART_LABEL}}</a>
  </div>
  <div data-checkout-main class="checkout-section__hidden">
    <table><tbody data-checkout-table-body></tbody></table>
    <div data-checkout-table-mobile></div>
    <div data-checkout-payment-methods></div>
    <div data-checkout-billing-addresses></div>
    <span data-checkout-total></span>
    <button type="button" data-checkout-pay-btn disabled>{{CHECKOUT_PAY_LABEL}}</button>
  </div>
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 与 `[data-checkout-section] .checkout-section__*` 下。只引用 layout token。自己用 `max-width: var(--page-max)` + `padding-inline: var(--page-pad)`。断点写死 1024（桌面表 / 移动列表切换）。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核始终跑结账逻辑（`use_platform_ui` 默认 true）。若自定义 init 接管渲染，设 `use_platform_ui: false`。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `checkout01` |
| `type` | `"checkout"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止组件 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `header.title` | 区块标题 |
| `login_url` | 默认 `/login` |
| `cart_url` | 默认 `/cart` |
| `addresses_url` | 默认 `/dashboard#addresses` |
| `success_return_path` | 默认 `/checkout?status=success&session_id={CHECKOUT_SESSION_ID}` |
| `cancel_return_path` | 默认 `/checkout?status=cancel` |
| `use_platform_ui` | 有自定义 init 时默认 false，否则 true |
| `translations[]` | 每语言 `html_url`、`css_url` |

关联行默许覆盖：标题、按钮文案、URL。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 结账页

`page_code` 用 `checkout`（URL `/checkout`）。页面 metadata **只留 SEO**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**、**checkout `10`**、footer `20`。

pageheader 关联示例：

```json
{
  "header": { "title": "Checkout" },
  "show_title": true,
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "cart_title", "href": "/cart" },
      { "label_key": "checkout_title", "current": true }
    ]
  }
}
```

---

## 9. 入库清单

- [ ] `type=checkout`（组件字段，不在 metadata）
- [ ] `website/checkout/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-checkout-section`、`data-checkout-auth-gate`、`data-checkout-empty`、`data-checkout-table-body`、`data-checkout-pay-btn`
- [ ] CSS 无 Tailwind；`css_url` 必填；覆盖 `.checkout-section__*` / 空态 / 登录门 / 汇总
- [ ] 无自定义 init，或不重写支付会话
- [ ] 结账页 `page_code=checkout`，只关联 code + sort
