# type=`productsingle`（产品详情 + 交易）

Skill 可读的组件类型契约。做**商品详情页主体**（图集、价格、变体、加购、运费税费、团购/众筹）时读本文。不要从 a0005 的 `productsingle` Tailwind HTML 直接入库。不要用 `postsingle` 扛购买。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。列表见 [postlist.md](./postlist.md)。文章详情见 [postsingle.md](./postsingle.md)。详情页下级见 [postchild.md](./postchild.md)。

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
| 产品详情页主体（图集、价格、加购、运费、团购/众筹） | 是 |
| 把 a0005 某个 `productsingle` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与交易锚点必须留下 |
| 换列表回跳路径 | 是：改 `list_path` |
| 产品列表网格 | 否：`postlist` / `listfilter` |
| 首页产品预览卡片 | 否：`post`（如 `product01`） |
| 文章详情 | 否：`postsingle` |
| 详情页关联下级 | 否：`postchild` |
| 面包屑 | 否：`pageheader`（同页另挂，`context=productsingle`） |

---

## 2. 它是什么

`productsingle` 是**单件产品详情 + 交易区块**：内核 SSR 按路由里的产品 id 拉展示数据，把标量填进 `html_url` 的 `{{PRODUCT_SINGLE_*}}`，并把变体/折扣/运费等序列化进 `#product-single-ssr-payload`。交易 DOM 写在组件 HTML 里；交互由内核 `ProductSingleRuntime` 挂载，**不要**在自定义 init 里重写加购。

- **要调产品 API**（单篇，且 `article_type` 必须是产品类）。id 来自 `/productsingle-{id}`，不要写进页面 metadata。
- **须挂在产品详情页**（`page_code=productsingle`）。一页通常只挂一个。
- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 面包屑不在本组件内，由同页 `type=pageheader` 负责（详情页默认藏 H1，标题走本组件）。

内核：组件记录 `type===productsingle` → `productsingle.astro`。不再要求名字是 `productsingle` / `productsingle01`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退。

支持的 `article_type`：`product`、`subscription_product`、`crowdfunding_product`、`wholesale_product`、`group_product`、`finance_product`。其它类型访问详情路由会 404。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"productsingle"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |

创建时**显式传** `type=productsingle`。漏传会变成默认 `static`，占位符原样输出、不会加载交易 runtime。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `productsingle01`，**不要** `product-single` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.productsingle01` |
| 组件字段 `type` | `"productsingle"` |

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/productsingle/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/productsingle/{components_code}/html
website/productsingle/{components_code}/css
website/productsingle/{components_code}/js
website/productsingle/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 区块 init（可选） | `js/` | `{code}.js` |

硬性：禁止 `/images/…`、站点相对路径、其它业务租户。`css_url` **必填**。交易 DOM（加购、变体、弹窗）写在本组件 HTML 里，皮 CSS 必须覆盖这些钩子，不要假设全局有 `.btn`。内核没有 HTML 回退，也不再注入 `{{PRODUCT_SINGLE_COMMERCE_SHELL}}` / `{{PRODUCT_SINGLE_MODALS}}`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-productsingle-section data-article-id="{{PRODUCT_SINGLE_ARTICLE_ID}}">`。
2. **必须留下本文占位符与交易锚点**。改的是皮，不是契约。交易区块的 HTML **写在本组件 html_url 里**，不要依赖内核塞一整段壳。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。若写自定义 JS，必须包 IIFE。
6. `{{PRODUCT_SINGLE_MAIN_CONTENT}}`、`{{METADATA_HTML}}` **不要再 escape**。不要在 HTML 注释里写 `{{...}}` 字面量。

### 6.1 交易锚点（缺一则加购失效）

交易结构写在组件 HTML 中。内核只填标量文案（`{{PRODUCT_SINGLE_ADD_TO_CART}}` 等）并挂 `ProductSingleRuntime`。下列选择器必须存在：

| 选择器 | 用途 |
|--------|------|
| `#product-loading-overlay` | 加载遮罩 |
| `#add-to-cart-btn` | 加购 |
| `#product-wishlist-btn` | 愿望清单 |
| `.quantity-num` / `.qty-input` | 数量 |
| `.color-plates` / `.shop-sizes` | 变体 |
| `.price-rating .price` | 实时价 |
| `.right-box-contain .name` | 标题（runtime 可改） |
| `#discount-rules-outer` / `#discount-rules-list` | 折扣 chip |
| `#shipping-tax-summary` | 运费税费 |
| `#group-buying-list` / `#crowdfunding-list` | 团购 / 众筹 |
| `#discount-modal` / `#shipping-rule-modal` / `#group-buying-modal` / `#crowdfunding-modal` | 弹窗 |

### 6.2 标量

| 占位符 | 来源 |
|--------|------|
| `{{PRODUCT_SINGLE_ARTICLE_ID}}` | 产品 id |
| `{{PRODUCT_SINGLE_TITLE}}` | 标题 |
| `{{PRODUCT_SINGLE_SUMMARY}}` | 摘要 |
| `{{PRODUCT_SINGLE_MAIN_CONTENT}}` | 正文 HTML |
| `{{PRODUCT_SINGLE_GALLERY_HTML}}` | 内核预渲染图集（含 `.product-single-gallery-main`） |
| `{{PRODUCT_SINGLE_FEATURED_IMAGE}}` / `_ALT` | 首图 |
| `{{PRODUCT_SINGLE_TAB_DESCRIPTION}}` / `TAB_ADDITIONAL_INFO` | Tab 文案 |
| `{{PRODUCT_SINGLE_ADD_TO_CART}}` / `WISHLIST` / `LOADING` 等 | 交易区可见文案（内核按语言填） |

### 6.3 条件块与循环

与 `postsingle` 同结构，前缀换成 `PRODUCT_SINGLE_*`：`HAS_CONTENT` / `ERROR` / `HAS_IMAGES` / `HAS_MAIN_CONTENT` / `HAS_TAGS` / `HAS_CATEGORIES` / `HAS_SUMMARY`，以及 `IMAGE_ITEM` / `TAG_ITEM` / `CATEGORY_ITEM` / `METADATA_BLOCK`。

最小结构（交易 DOM 写在组件 HTML 里，不要再用 `{{PRODUCT_SINGLE_COMMERCE_SHELL}}` 占位）：

```html
<section
  class="productsingle01"
  data-productsingle-section
  data-article-id="{{PRODUCT_SINGLE_ARTICLE_ID}}"
>
  <div id="product-loading-overlay" style="display:none"><p id="loading-text">{{PRODUCT_SINGLE_LOADING}}</p></div>
  {{#PRODUCT_SINGLE_ERROR}}<p>Product not found.</p>{{/PRODUCT_SINGLE_ERROR}}
  {{#PRODUCT_SINGLE_HAS_CONTENT}}
  <div class="productsingle01__grid">
    <div>{{PRODUCT_SINGLE_GALLERY_HTML}}</div>
    <div class="right-box-contain">
      <h1 class="name">{{PRODUCT_SINGLE_TITLE}}</h1>
      <div class="price-rating"><p class="price">—</p></div>
      <div id="discount-rules-outer" style="display:none"><div id="discount-rules-list"></div></div>
      <div class="color-plates" style="display:none"></div>
      <div class="shop-sizes"></div>
      <input class="qty-input quantity-num" type="text" name="quantity" value="1" />
      <a href="#" id="add-to-cart-btn">{{PRODUCT_SINGLE_ADD_TO_CART}}</a>
      <a href="#" id="product-wishlist-btn" data-action="toggle-wishlist" data-product-id="{{PRODUCT_SINGLE_ARTICLE_ID}}">{{PRODUCT_SINGLE_WISHLIST}}</a>
      <div id="shipping-tax-summary" style="display:none"></div>
    </div>
  </div>
  {{#PRODUCT_SINGLE_HAS_MAIN_CONTENT}}
  <div>{{PRODUCT_SINGLE_MAIN_CONTENT}}</div>
  {{/PRODUCT_SINGLE_HAS_MAIN_CONTENT}}
  {{/PRODUCT_SINGLE_HAS_CONTENT}}
</section>
<div id="discount-modal" style="display:none"></div>
<div id="shipping-rule-modal" style="display:none"></div>
<div id="group-buying-modal" style="display:none"></div>
<div id="crowdfunding-modal" style="display:none"></div>
```

完整交易区块以 `website/productsingle/productsingle01/html/` 为准，新皮照抄锚点，改的是 class 与排版。

---

## 7. CSS / JS

选择器挂在根 class 下；交易钩子（`#add-to-cart-btn`、`.product-attribute-option`、`.product-single-gallery-main`、弹窗）也写在**本组件 CSS**，用 `[data-productsingle-section]` 限定作用域。只引用 layout token；断点写死 640 / 768 / 1024 / 1280。自己用 `max-width: var(--page-max)` + `padding-inline: var(--page-pad)`。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核跑平台 UI（图集 Swiper、描述 Tab）。无 Swiper 时 CSS 仍须让首图可见。交易 runtime **始终**加载。

若仍要自定义 init：包 IIFE；监听 `gt6:productsingle:ready`；不要顶层 `function findRoot`。此时默认不再跑平台图集/Tab，除非 `use_platform_ui: true`。**不要**在自定义 init 里写加购。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `productsingle01` |
| `type` | `"productsingle"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `translations[]` | 每语言 `html_url`、`css_url`；可选 `init_script_url` |
| `list_path` | 标签/分类回列表，产品用 `/product` |
| `exclude_template_fields` | 从字段循环排除的 slug |

产品 id **不要**写进 metadata。`translations[].language` 与 `language_code` 都写上（`en` / `zh-CN`）。

关联行默许覆盖：`list_path`。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 产品详情页

`page_code` 必须是 `productsingle`（或 `productsingle01`…，URL `/{page_code}-{id}`）。旧链 `/product-{id}` 内核会转到同一套详情。页面 metadata **只留 SEO 回退**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**（`context: productsingle`，`list_path: /product`）、**productsingle `10`**、footer `20`。

pageheader 关联示例：

```json
{
  "context": "productsingle",
  "list_path": "/product",
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "our_products_section_title", "href": "/product" }
    ]
  }
}
```

内核会把当前产品标题接到面包屑末级，并默认隐藏 pageheader 的 H1。

---

## 9. 入库清单

- [ ] `type=productsingle`（组件字段，不在 metadata）
- [ ] `website/productsingle/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-productsingle-section`、`data-article-id`，以及交易锚点（`#add-to-cart-btn`、弹窗 id 等，见 6.1）
- [ ] 保留 `.right-box-contain .name`、`.price-rating .price`、`#add-to-cart-btn`
- [ ] CSS 无 Tailwind；`css_url` 必填；覆盖加购/属性/图集/弹窗
- [ ] 无自定义 init，或 IIFE + 不误关平台 UI、不重写加购
- [ ] `list_path` 指向 `/product`
- [ ] 挂在 `page_code=productsingle`，只关联 code + sort
