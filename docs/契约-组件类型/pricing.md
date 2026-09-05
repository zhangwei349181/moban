# type=`pricing`（订阅套餐）

Skill 可读的组件类型契约。做首页套餐条或独立定价页时读本文。不要从 a0005 的 Tailwind `pricing` HTML 直接入库。不要用 `static` 手写套餐卡。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。订阅结账见 [subscriptioncheckout.md](./subscriptioncheckout.md)。

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
| 首页 / 落地页套餐卡（不展示产品介绍） | 是：用精简皮，如 `pricing01` |
| 独立定价页 / 订阅产品详情页（要产品介绍） | 是：用详情皮，如 `pricing02` |
| 把 a0005 某个 `pricing` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 订阅支付 | 否：[subscriptioncheckout.md](./subscriptioncheckout.md) |
| 普通商品详情 | 否：[productsingle.md](./productsingle.md) |

不要用「同一组件、页面关联换 `html_url`」区分首页和定价页。做成 **两个 `type=pricing` 组件**，各有自己的皮。

---

## 2. 它是什么

`pricing` 是**订阅套餐区块**：内核按 `article_id` 拉订阅商品的变体与内容，注入 `html_url` 的 `{{PRICING_*}}`。点击订阅写入 `localStorage.subscription_cart_items`，再跳转 `checkout_url`（默认 `/subscriptioncheckout`）。

- **必须有 `article_id`**（`subscription_product` 文章 UUID）。没有或拉不到变体时走 `{{#PRICING_IS_EMPTY}}`。
- 可挂到任意展示页。独立定价页 `page_code=price`（URL `/price`）通常挂详情皮。
- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 两套皮的差异只在 HTML：精简皮**不要**写介绍/图集/附加信息块；详情皮**必须**写这些条件块。数据内核两边都会算，皮不引用就不会显示。

内核：组件记录 `type===pricing` → `pricing.astro`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退，也没有默认 `/assets/pricing.css`。

数据模型与 a0005 / newworld 订阅页一致：

1. 仅一个 `is_variant_creator` 属性（如「版本」）
2. 每个属性值对应一个 `active` 变体
3. 变体 `physical.dimensions.subscription` 配置计费周期（`base_period` + `options[].code/multiplier`）
4. 可选 `dimensions.sort_order`、`dimensions.is_recommended`

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"pricing"` |
| 组件 `metadata` | **没有组件 type** |
| 页面-组件关联行 | **没有组件 type** |

创建时**显式传** `type=pricing`。漏传会变成默认 `static`，占位符原样输出、不会拉变体。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。精简皮用 `pricing01`，详情皮用 `pricing02`，**不要** `pricing-home` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.pricing01` / `.pricing02` |
| 组件字段 `type` | `"pricing"`（两套皮都是这个 type） |
| 独立定价页 `page_code` | `price`（URL `/price`） |

旧 code `pricing` / `subscriptionpricing` 仅兼容已有租户。

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/pricing/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/pricing/{components_code}/html
website/pricing/{components_code}/css
website/pricing/{components_code}/js
website/pricing/{components_code}/media
```

硬性：`css_url` **必填**。禁止 `/images/…`、站点相对路径、其它业务租户、内核 fallback 的 `/assets/pricing.css`。皮 CSS 必须覆盖套餐卡、计费切换、订阅按钮、空态，以及内核/客户端写入的 `.pricing-plan-card--featured` / `--locked`、`.pricing-subscribe-btn--disabled`、`.pricing-billing-toggle__btn`、`.pricing-plan-price`。详情皮还要覆盖图集轮播（`.pricing-section__gallery-*`、`.is-active` 主图/缩略图、左右按钮）、正文、附加信息。不要假设全局有 `.btn`。不要假设全局有 Swiper。

---

## 6. HTML 合同

### 6.1 根与必须钩子

一根语义根 `<section class="{code}" data-pricing-section data-pricing-config="{{PRICING_CONFIG_JSON}}" data-pricing-article-id="{{PRICING_ARTICLE_ID}}">`。

独立定价页已有 pageheader 的 H1，本区块标题用 **h2**。

每张卡：

```html
<article
  data-pricing-plan
  data-pricing-json="{{PRICING_PLAN_PRICING_JSON_ATTR}}"
  data-cart-payload="{{PRICING_PLAN_CART_PAYLOAD_ATTR}}"
>
```

| 钩子 | 作用 |
|------|------|
| `[data-pricing-section]` | 根 |
| `data-pricing-config` | `{{PRICING_CONFIG_JSON}}` |
| `data-pricing-article-id` | `{{PRICING_ARTICLE_ID}}`，登录后续费/升级依赖它 |
| `[data-pricing-plan]` | 套餐卡 |
| `[data-billing="{code}"]` | 计费周期按钮 |
| `[data-pricing-subscribe]` | 订阅 / 续费 / 升级 |
| `[data-pricing-currency]` / `[data-pricing-amount]` / `[data-pricing-period]` / `[data-pricing-equiv]` / `[data-pricing-yearly-hint]` | 价格区（可选，建议留） |
| `[data-pricing-gallery]` | 详情皮图集根（内核注入 `{{PRICING_GALLERY_HTML}}`） |
| `[data-pricing-gallery-slide]` / `[data-pricing-gallery-thumb]` | 主图 / 缩略图 |
| `[data-pricing-gallery-prev]` / `[data-pricing-gallery-next]` | 左右切换（多于 1 张才有） |

客户端会再写：根 `data-pricing-has-subscription`；卡 `data-pricing-action="subscribe|renew|upgrade|disabled"`、`data-pricing-min-billing`。

### 6.2 页面级占位符

| 占位符 | 说明 |
|--------|------|
| `{{PRICING_ARTICLE_ID}}` | 商品 ID |
| `{{PRICING_PAGE_TITLE}}` / `{{PRICING_SUMMARY}}` | 文章标题 / 摘要 |
| `{{PRICING_GALLERY_HTML}}` | 图集（勿转义；无图则为空） |
| `{{PRICING_CONTENT_HTML}}` | 正文（勿转义） |
| `{{PRICING_CONFIG_JSON}}` | 已转义的 `data-pricing-config` |
| `{{PRICING_PLANS_SECTION_TITLE}}` 等 | 区块标题 / 空态 / 角标 |

条件块：`{{#PRICING_HAS_PLANS}}` / `{{#PRICING_IS_EMPTY}}` / `{{#PRICING_HAS_CONTENT}}` / `{{#PRICING_HAS_GALLERY}}` / `{{#PRICING_HAS_SUMMARY}}` / `{{#PRICING_HAS_METADATA}}` / `{{#PRICING_NO_METADATA}}`。

### 6.3 套餐卡循环 `{{#PRICING_PLAN_CARD}}`

| 占位符 | 说明 |
|--------|------|
| `{{PRICING_PLAN_TITLE}}` / `SUBTITLE` | 套餐名 |
| `{{PRICING_PLAN_CURRENCY}}` / `PRICE` / `PERIOD` / `EQUIV` | 默认周期价格 |
| `{{PRICING_PLAN_PRICING_JSON_ATTR}}` | → `data-pricing-json` |
| `{{PRICING_PLAN_CART_PAYLOAD_ATTR}}` | → `data-cart-payload` |
| `{{#PRICING_PLAN_IS_FEATURED}}` | 推荐角标 |
| `{{#PRICING_PLAN_HAS_BILLING_TOGGLE}}` + `{{#PRICING_BILLING_OPTION}}` | 月付/年付 |
| `{{#PRICING_FEATURE_LINE}}` | 功能行（属性值 `description`，按换行或分号拆） |
| `{{#PRICING_PLAN_NO_FEATURES}}` | 无功能行 |

### 6.4 附加信息 `{{#PRICING_METADATA_ROW}}`

来自**文章 content 的 `metadata`**，不是组件 metadata。跳过空值。

### 6.5 精简皮（首页）最小骨架

不要放 gallery / content / metadata 块。

```html
<section class="pricing01" data-pricing-section data-pricing-config="{{PRICING_CONFIG_JSON}}" data-pricing-article-id="{{PRICING_ARTICLE_ID}}">
  <h2>{{PRICING_PLANS_SECTION_TITLE}}</h2>
  {{#PRICING_IS_EMPTY}}<p>{{PRICING_EMPTY_MESSAGE}}</p>{{/PRICING_IS_EMPTY}}
  {{#PRICING_HAS_PLANS}}
  {{#PRICING_PLAN_CARD}}
  <article data-pricing-plan data-pricing-json="{{PRICING_PLAN_PRICING_JSON_ATTR}}" data-cart-payload="{{PRICING_PLAN_CART_PAYLOAD_ATTR}}">
    <button type="button" data-pricing-subscribe>{{PRICING_SUBSCRIBE_LABEL}}</button>
  </article>
  {{/PRICING_PLAN_CARD}}
  {{/PRICING_HAS_PLANS}}
</section>
```

### 6.6 详情皮（定价页）还要有

```html
{{#PRICING_HAS_GALLERY}}<figure class="pricing02__gallery">{{PRICING_GALLERY_HTML}}</figure>{{/PRICING_HAS_GALLERY}}
{{#PRICING_HAS_CONTENT}}<div>{{PRICING_CONTENT_HTML}}</div>{{/PRICING_HAS_CONTENT}}
{{#PRICING_HAS_METADATA}}
<dl>
  {{#PRICING_METADATA_ROW}}
  <div><dt>{{PRICING_META_KEY}}</dt><dd>{{PRICING_META_VALUE}}</dd></div>
  {{/PRICING_METADATA_ROW}}
</dl>
{{/PRICING_HAS_METADATA}}
```

---

## 7. CSS / JS

选择器挂在根 class 与 `[data-pricing-section]` 下。只引用 layout token。自己用 `max-width: var(--page-max)` + `padding-inline: var(--page-pad)`。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核始终跑定价逻辑（`use_platform_ui` 默认 true）。若自定义 init 接管渲染，设 `use_platform_ui: false`。

客户端行为（`pricingUi.client`）：

1. 切换 `data-billing` → 更新卡片价格。
2. 点击 `data-pricing-subscribe` → 写入 `subscription_cart_items` → 跳转 `checkout_url`。
3. 已登录：拉活跃订阅，按变体 `base_price` 显示续费 / 升级 / 禁用；计费周期不得短于当前订单的 `payment_period`。
4. 详情皮图集：多于 1 张时原生轮播（左右按钮 + 缩略图），**不依赖 Swiper**。皮 CSS 必须让非 `.is-active` 的 slide 隐藏。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | `pricing01`（精简）或 `pricing02`（详情） |
| `type` | `"pricing"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止组件 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `article_id` | **必填**，订阅商品 UUID |
| `checkout_url` | 默认 `/subscriptioncheckout` |
| `use_platform_ui` | 有自定义 init 时默认 false，否则 true |
| `translations[]` | 每语言 `html_url`、`css_url` |

关联行默许覆盖：`article_id`、`checkout_url`。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 独立定价页

`page_code` 用 `price`（URL `/price`）。页面 metadata **只留 SEO**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**、**pricing02 `10`**、footer `20`。

首页挂 `pricing01`，插在其它区块与 footer 之间即可。

pageheader 关联示例：

```json
{
  "header": { "title": "Pricing" },
  "show_title": true,
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "pricing_title", "current": true }
    ]
  }
}
```

---

## 9. 入库清单

- [ ] 两个组件都是 `type=pricing`（组件字段，不在 metadata）
- [ ] `website/pricing/{code}/html|css/`，URL 写入 `translations`
- [ ] 精简皮无介绍/图集/metadata；详情皮有 `{{#PRICING_HAS_CONTENT}}` 等
- [ ] HTML 含 `data-pricing-section`、`data-pricing-article-id`、`data-pricing-plan`、`data-pricing-subscribe`
- [ ] CSS 无 Tailwind；`css_url` 必填；覆盖卡 / 切换 / 按钮 / 空态
- [ ] `article_id` 为真实订阅商品；`checkout_url` 为 `/subscriptioncheckout`
- [ ] 定价页 `page_code=price`，只关联 code + sort；首页另挂精简皮
