# type=`wishlist`（愿望清单）

Skill 可读的组件类型契约。做愿望清单页时读本文。不要从 a0005 的 Tailwind `wishlist` HTML 直接入库。不要用 `static` 手写收藏网格。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。购物车见 [cart.md](./cart.md)。

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
| 愿望清单页 | 是 |
| 把 a0005 某个 `wishlist` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 底栏愿望清单入口 | 否：`chrome` 的 `footerwish01` |
| 列表/详情上的心形按钮 | 否：仍写在 `post` / `postlist` / `productsingle`，读写同一把 `localStorage.wishlist_product_ids` |
| 购物车 | 否：`cart` |

---

## 2. 它是什么

`wishlist` 是**愿望清单区块**：内核把文案与 URL 注入 `html_url` 的 `{{WISHLIST_*}}`，卡片由内核 `wishlistUi.client` 填充（读 `wishlist_product_ids`，再拉文章简讯，价格走全局折扣）。

- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 愿望清单页 `page_code=wishlist`（URL `/wishlist`）通常只挂一个。
- 卡片 HTML 由内核注入，class 固定为 `wishlist-section__*`。皮 CSS **必须**覆盖这些 class。

内核：组件记录 `type===wishlist` → `wishlist.astro`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退，也没有默认 `/assets/wishlist.css`。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"wishlist"` |
| 组件 `metadata` | **没有组件 type** |
| 页面-组件关联行 | **没有组件 type** |

创建时**显式传** `type=wishlist`。漏传会变成默认 `static`，占位符原样输出、不会填卡片。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `wishlist01`，**不要** `wish-list` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.wishlist01` |
| 组件字段 `type` | `"wishlist"` |
| 页面 `page_code` | `wishlist`（URL `/wishlist`） |

旧 code `wishlistpage` 仅兼容已有租户。

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/wishlist/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/wishlist/{components_code}/html
website/wishlist/{components_code}/css
website/wishlist/{components_code}/js
website/wishlist/{components_code}/media
```

硬性：`css_url` **必填**。禁止 `/images/…`、站点相对路径、其它业务租户、内核 fallback 的 `/assets/wishlist.css`。皮 CSS 必须覆盖网格/列表、空态、加载、卡片、内核注入的 `.wishlist-section__*`。不要假设全局有 `.btn`。网格/列表图标写在 HTML 里（inline SVG），不要依赖内核 `/assets/svg/`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-wishlist-section>`。
2. **必须留下本文占位符与 data 钩子**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。清单读写**不要**在自定义 init 里重写，除非 `use_platform_ui=false`。
6. 不要在 HTML 注释里写 `{{...}}` 字面量。页头已有 H1 时，区块标题用 `h2`。

### 6.1 必须保留的钩子

| 选择器 / 占位 | 说明 |
|---------------|------|
| `[data-wishlist-section]` | 根 |
| `data-wishlist-config` | `{{WISHLIST_CONFIG_JSON}}` |
| `[data-wishlist-product-count]` | 数量文案 |
| `[data-wishlist-grid-btn]` / `[data-wishlist-list-btn]` | 视图切换 |
| `[data-wishlist-loading]` / `[data-wishlist-empty]` / `[data-wishlist-error]` | 状态 |
| `[data-wishlist-wrapper]` | 有数据时的容器 |
| `[data-wishlist-grid-content]` / `[data-wishlist-grid-row]` | 网格 |
| `[data-wishlist-list-content]` / `[data-wishlist-list-row]` | 列表 |
| `.wishlist-section__hidden` | 内核显隐 |
| `[data-action="toggle-wishlist"][data-product-id]` | 内核注入的心形 |

### 6.2 标量与条件

| 占位符 | 说明 |
|--------|------|
| `{{WISHLIST_TITLE}}` / `{{WISHLIST_DESCRIPTION}}` | 标题 / 副标题 |
| `{{WISHLIST_PRODUCTS_LABEL}}` | 计数旁「产品」 |
| `{{WISHLIST_EMPTY_TITLE}}` / `{{WISHLIST_EMPTY_DESCRIPTION}}` | 空态 |
| `{{WISHLIST_CONTINUE_SHOPPING_LABEL}}` / `{{WISHLIST_CONTINUE_SHOPPING_URL}}` | 继续购物，默认 `/product` |
| `{{WISHLIST_LOADING_LABEL}}` / `{{WISHLIST_ERROR_LABEL}}` | 加载 / 失败 |
| `{{WISHLIST_CONFIG_JSON}}` | 已转义的 `data-wishlist-config` |
| `{{#WISHLIST_HAS_TITLE}}` / `HAS_DESCRIPTION` / `HAS_HEADER` | 条件块 |

最小结构：

```html
<section class="wishlist01" data-wishlist-section data-wishlist-config="{{WISHLIST_CONFIG_JSON}}">
  <p data-wishlist-product-count></p>
  <button type="button" data-wishlist-grid-btn></button>
  <button type="button" data-wishlist-list-btn></button>
  <div data-wishlist-loading>{{WISHLIST_LOADING_LABEL}}</div>
  <div data-wishlist-empty class="wishlist-section__hidden">{{WISHLIST_EMPTY_TITLE}}</div>
  <div data-wishlist-error class="wishlist-section__hidden"></div>
  <div data-wishlist-wrapper class="wishlist-section__hidden">
    <div data-wishlist-grid-content class="wishlist-section__hidden">
      <div data-wishlist-grid-row></div>
    </div>
    <div data-wishlist-list-content class="wishlist-section__hidden">
      <div data-wishlist-list-row></div>
    </div>
  </div>
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 与 `[data-wishlist-section] .wishlist-section__*` 下。只引用 layout token。自己用 `max-width: var(--page-max)` + `padding-inline: var(--page-pad)`。断点写死 768 / 1280。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核始终跑清单逻辑。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `wishlist01` |
| `type` | `"wishlist"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止组件 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `header.title` / `header.subtitle` | 区块标题 / 说明 |
| `continue_shopping_url` | 默认 `/product` |
| `product_page_code` | 商品详情页码，默认 `productsingle` |
| `use_platform_ui` | 有自定义 init 时默认 false，否则 true |
| `translations[]` | 每语言 `html_url`、`css_url` |

关联行默许覆盖：标题、空态文案、URL。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 愿望清单页

`page_code` 用 `wishlist`（URL `/wishlist`）。页面 metadata **只留 SEO**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**、**wishlist `10`**、footer `20`。

pageheader 关联示例：

```json
{
  "header": { "title": "Wishlist" },
  "show_title": true,
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "wishlist_title", "current": true }
    ]
  }
}
```

---

## 9. 入库清单

- [ ] `type=wishlist`（组件字段，不在 metadata）
- [ ] `website/wishlist/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-wishlist-section`、空/加载/网格/列表钩子
- [ ] CSS 无 Tailwind；`css_url` 必填；覆盖 `.wishlist-section__*` / 空态 / 卡片
- [ ] 无自定义 init，或不重写心形切换
- [ ] 愿望清单页 `page_code=wishlist`，只关联 code + sort
