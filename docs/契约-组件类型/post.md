# type=`post`（首页/落地页文章预览）

Skill 可读的组件类型契约。做首页、落地页上的文章/资讯预览区块时读本文。不要从 a0005 的 `post` / `post01–99` Tailwind HTML 直接入库。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。静态区块见 [static.md](./static.md)。头底见 [chrome.md](./chrome.md)。整页列表见 [postlist.md](./postlist.md)、[listfilter.md](./listfilter.md)。详情页下级见 [postchild.md](./postchild.md)。

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

不要用默认的 `application/octet-stream` 传 CSS/HTML。

---

## 1. 何时读 / 何时不读

| 任务 | 读本文？ |
|------|----------|
| 首页/落地页文章预览（若干篇、可 Tab 切分类） | 是 |
| 把 a0005 某个 `postNN` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 换本区块拉哪些分类/几篇文章 | 是：改组件或关联里的查询字段 |
| 整页文章列表、筛选 | 否：`postlist` / `listfilter` |
| 文章详情 | 否：`postsingle` |
| 详情页关联下级 | 否：`postchild` |
| Hero / 特性等无 API 数据 | 否：`static` |

---

## 2. 它是什么

`post` 是**动态预览区块**：内核 SSR 按 metadata 查询条件拉已发布文章，注入 `html_url` 模板里的 `{{占位符}}`，再加载该组件自己的 CSS。Tab 切换由内核平台 UI（`data-post-tab` / `data-post-panel`）完成，不必为切 Tab 再写一份 init。

`html_url`（或内联 `html`）**必填**。内核没有 HTML 回退；拉不到模板时显示「没有可加载的模板」。卡片循环必须写在组件 HTML 里（`{{#POST_ITEMS}}` 等），内核不再注入默认条目片段。

- **要调文章 API**。查询写在组件 metadata（`tabs` / `category_ids` / `article_limit` 等）。
- 可挂到任意展示页，**不要求**特定 `page_type`。
- 一页可以挂多个 `type=post`，按关联 `sort_order` 排列。

内核：组件记录 `type===post` → `post.astro`。不再要求名字是 `post` / `post01`。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"post"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |

创建时**显式传** `type=post`。漏传会变成默认 `static`，占位符不会被注入、也不会拉文章。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `post01`、`journal01`，**不要** `post-grid` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.post01`；子元素 BEM：`.post01__grid`、`.post01__tab` |
| 组件字段 `type` | `"post"` |

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/post/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/post/{components_code}/html
website/post/{components_code}/css
website/post/{components_code}/js
website/post/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 区块 init（可选） | `js/` | `{code}.js` |

硬性：图片走本组件 `media/` 的完整 tenantdoc URL。禁止 `/images/…`、站点相对路径、其它业务租户、Tailwind 模板里的 `/assets/post.css`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}">`。
2. **必须留下本文占位符与 `data-*`**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。若写自定义 JS，必须包 IIFE。

### 6.1 标量占位符

| 占位符 | 来源 |
|--------|------|
| `{{POST_SECTION_TITLE}}` | `header.title`（可多语言） |
| `{{POST_SECTION_DESCRIPTION_BLOCK}}` | 副标题；无则空 |
| `{{POST_SECTION_BADGE}}` | 内核 i18n「博客」类角标，可不用 |
| `{{POST_SECTION_EMPTY_MESSAGE}}` | 无文章时的文案 |
| `{{CTA_HREF}}` `{{CTA_LABEL}}` `{{CTA_ARIA_LABEL}}` | `cta` |
| `{{READ_MORE_LABEL}}` | 单篇「阅读更多」 |

### 6.2 文章循环（写在每个 Tab 面板内）

| 块 | 说明 |
|----|------|
| `{{#POST_ITEMS}}…{{/POST_ITEMS}}` | 该组全部文章 |
| `{{#POST_ITEM_FIRST}}` / `{{#POST_ITEM_REST}}` | 首篇 / 其余（本皮若格子均等，用 `POST_ITEMS` 即可） |
| `{{#POST_SECTION_EMPTY}}` / `{{#POST_SECTION_HAS_ITEMS}}` | 空态 / 有数据 |

单篇：`{{POST_HREF}}` `{{POST_TITLE}}` `{{POST_IMAGE}}` `{{POST_IMAGE_ALT}}` `{{POST_DATE}}` `{{POST_DATETIME}}` `{{POST_SUMMARY}}` `{{POST_SUMMARY_80}}`。条件块：`{{#POST_HAS_DATE}}` `{{#POST_HAS_SUMMARY}}`。

### 6.3 Tab（两组及以上查询时）

| 块 / 钩子 | 说明 |
|-----------|------|
| `{{#POST_SECTION_HAS_TABS}}…{{/POST_SECTION_HAS_TABS}}` | ≥2 组时显示导航 |
| `{{#POST_TAB_NAV}}…{{/POST_TAB_NAV}}` | 循环按钮。内置 `{{TAB_ID}}` `{{TAB_LABEL}}` `{{TAB_BUTTON_ATTRS}}` |
| `{{#POST_TAB_PANEL}}…{{/POST_TAB_PANEL}}` | 循环面板。内置 `{{TAB_ID}}` `{{TAB_PANEL_ATTRS}}`，组内文章块对应该 Tab |
| `data-post-tab="{{TAB_ID}}"` | 按钮必带 |
| `data-post-panel="{{TAB_ID}}"` | 面板必带 |
| `role="tab"` / `role="tablist"` / `role="tabpanel"` | 无障碍 |

首个按钮带 `data-active aria-selected="true"`（由 `{{TAB_BUTTON_ATTRS}}` 注入）。平台 UI 点击后切换 `hidden` 与 `data-active`。CSS 须把未激活面板藏起来：`.{code} [data-post-panel]:not([data-active]) { display: none; }`。

只有一组数据时不要依赖 Tab 导航；仍可用 `POST_ITEMS`。

最小结构：

```html
<section class="post01" aria-labelledby="post01-heading">
  <div class="post01__inner">
    <h2 id="post01-heading">{{POST_SECTION_TITLE}}</h2>
    {{#POST_SECTION_HAS_TABS}}
    <div class="post01__tabs" role="tablist">
      {{#POST_TAB_NAV}}
      <button type="button" role="tab" class="post01__tab" data-post-tab="{{TAB_ID}}" {{TAB_BUTTON_ATTRS}}>
        {{TAB_LABEL}}
      </button>
      {{/POST_TAB_NAV}}
    </div>
    {{/POST_SECTION_HAS_TABS}}
    {{#POST_TAB_PANEL}}
    <div class="post01__panel" role="tabpanel" data-post-panel="{{TAB_ID}}" {{TAB_PANEL_ATTRS}}>
      {{#POST_SECTION_HAS_ITEMS}}
      <ul class="post01__grid">
        {{#POST_ITEMS}}
        <li>
          <a href="{{POST_HREF}}">
            <img src="{{POST_IMAGE}}" alt="{{POST_IMAGE_ALT}}" />
            <h3>{{POST_TITLE}}</h3>
          </a>
        </li>
        {{/POST_ITEMS}}
      </ul>
      {{/POST_SECTION_HAS_ITEMS}}
    </div>
    {{/POST_TAB_PANEL}}
    <a href="{{CTA_HREF}}">{{CTA_LABEL}}</a>
  </div>
</section>
```

---

### 6.4 产品预览皮（如 `product01`）

仍是 `type=post`，不要另发明 type。与文章皮的差别只在 metadata 与卡片内容：

- `article_type` 用产品类（如 `product,subscription_product`），`path_url` 用 `/productsingle-{id}`，CTA 链到 `/product`。
- 价格：`{{#POST_HAS_PRICE}}` + `{{POST_PRICE}}`；init 里用 `data-price-raw="{{POST_PRICE}}"`、`data-category-ids="{{POST_CATEGORY_IDS}}"`。金额与是否展示走全局折扣：`window.__ASTRO_GLOBAL_DISCOUNT__` + 登录态 `auth_session_token` / `auth_current_membership`。规则与 newworld 列表一致——未登录看 `show_price_for_unregistered`（关则显示「登录后查看价格」）；启用折扣后按档位乘数（含分类覆盖）；乘数 `0` 隐藏价格（已登录留空）。
- 愿望清单心形：按钮**不要**包在商品 `<a>` 里。`data-product-id="{{POST_ID}}"`，读写 `localStorage.wishlist_product_ids`（与页脚愿望清单同一把钥匙）。在清单中时换色 / `aria-pressed="true"`，再点取消。
- 有自定义 init 时必须 `use_platform_ui: true`，否则 Tab 不会切。

---

## 7. CSS / JS

选择器挂在根 class 下；只引用 layout token；断点写死 640 / 768 / 1024 / 1280。

**Tab 不必写 `init_script_url`。** 未配置自定义 init 时，内核默认跑平台 UI（`postUi.client.ts`），只认 `data-post-tab` / `data-post-panel`。

若仍要自定义 init：包 IIFE；监听 `gt6:post:ready`，`event.detail.root` 是本插槽；不要顶层 `function findRoot`。此时默认**不再**跑平台 UI，除非 metadata 显式 `use_platform_ui: true`。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `post01` |
| `type` | `"post"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `translations[]` | 每语言 `html_url`、`css_url`；可选 `init_script_url` |
| `header.title` + `header.translations[]` | 区块标题 |
| `cta` + `cta.translations[]` | 底部「更多」链接，默认 `/bloglist` |
| `article_limit` / `limit` | 每组篇数，默认 3，最大 24。两行四列网格用 `8` |
| `article_type` | 逗号分隔，默认 `article,novel,tutorial,news,blog` |
| `template_id` | 内容模板 UUID。精确匹配；逗号分隔多个；也可 `"null"`。不配则不按模板筛 |
| `path_url` | 详情链接模板，如 `/article-{id}` |
| `tabs` / `groups` | 多组查询。`tabs[].id`、`label`、`translations`、`category_ids` 等 |

根级 `article_limit`、`article_type`、`path_url`、`template_id` 作为各 Tab 默认值。Tab 未写的查询字段不继承 `category_ids`（避免两组拉同一批）。

`status` 固定 `published`，`page` 固定 `1`，不要写进 metadata。

关联行默许覆盖：标题/CTA 文案、`article_limit`、`category_ids`、`template_id`、`tabs` 里的数据 id。不要在关联里再抄一份 `html_url` / `css_url`。

---

## 9. 入库清单

- [ ] `type=post`（组件字段，不在 metadata）
- [ ] `website/post/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `POST_SECTION_TITLE`、`POST_TAB_NAV`、`POST_TAB_PANEL`、`POST_ITEMS` 与 `data-post-tab` / `data-post-panel`
- [ ] CSS 无 Tailwind；未激活面板 `display: none`
- [ ] 无自定义 init，或 IIFE + 不误关平台 Tab
- [ ] 查询字段指向真实分类/标签 id；`article_limit` 与网格列数匹配
- [ ] 页面只关联 code + sort，不重复抄皮 URL
