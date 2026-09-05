# type=`postlist`（列表页网格）

Skill 可读的组件类型契约。做整页文章/产品列表网格时读本文。必须与 `listfilter` 同页时，同时读 [listfilter.md](./listfilter.md)。不要从 a0005 的 `postlist` Tailwind HTML 直接入库。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。首页预览见 [post.md](./post.md)。

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
| 整页文章/产品列表网格 + 分页 | 是 |
| 把 a0005 某个 `postlist` / `bloglist` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 换每页篇数、文章类型、详情路径 | 是：改组件或关联里的查询字段 |
| 分类/标签/属性/价格筛选表单 | 否：`listfilter` |
| 首页若干篇预览（可 Tab） | 否：`post` |
| 文章详情 | 否：`postsingle` |

---

## 2. 它是什么

`postlist` 是**列表页网格**：内核 SSR 按 metadata 查询条件 + **当前 URL 查询参数** 拉已发布条目，注入 `html_url` 模板，输出分页链接。不支持 `tabs` / `groups`。

`html_url` **必填**。内核没有 HTML 回退；拉不到模板时显示「没有可加载的模板」。列表卡片必须写在组件 HTML 里（`{{#POST_ITEMS}}`），内核不再注入 `{{POSTLIST_SECTION_CONTENT}}` 默认片段。

- **要调文章 API**。查询写在组件 metadata；`page`、`category_ids`、`tag_ids` 等与 URL 合并（URL 优先）。
- **须挂在列表型页面**（`page_code=bloglist` / `product`，或页面 `page_type=list`）。
- 一页通常只挂一个 `type=postlist`。筛选交给同页的 `type=listfilter`。
- 内核把同页的 listfilter + postlist 放进 `.gt6-list-main`（桌面两列：筛选 | 网格）。

内核：组件记录 `type===postlist` → `postlist.astro`。不再要求名字是 `postlist` / `postlist01`。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"postlist"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |
| 页面 `metadata.page_type` | 列表页写 `"list"`（`bloglist` / `product` 可省略，内核已认识） |

创建时**显式传** `type=postlist`。漏传会变成默认 `static`，不会拉列表、也不会分页。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `postlist01`，**不要** `post-list` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.postlist01`；子元素 BEM：`.postlist01__grid` |
| 组件字段 `type` | `"postlist"` |

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/postlist/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/postlist/{components_code}/html
website/postlist/{components_code}/css
website/postlist/{components_code}/js
website/postlist/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 区块 init（可选） | `js/` | `{code}.js` |

硬性：图片走本组件 `media/` 的完整 tenantdoc URL。禁止 `/images/…`、站点相对路径、其它业务租户。`css_url` **必填**（内核不注入全局列表 CSS，也没有 HTML 回退模板）。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-postlist-section>`。
2. **必须留下本文占位符与 `data-*`**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。若写自定义 JS，必须包 IIFE。
6. 卡片循环复用 `post` 的 `{{#POST_ITEMS}}` 与单篇占位符（`POST_HREF` / `POST_TITLE` / `POST_IMAGE` 等）。

### 6.1 标量

| 占位符 | 来源 |
|--------|------|
| `{{POSTLIST_EMPTY_MESSAGE}}` | 无结果文案 |
| `{{POSTLIST_ERROR_MESSAGE}}` | 加载失败 |
| `{{READ_MORE_LABEL}}` | 「阅读更多」 |
| `{{POSTLIST_PREV_HREF}}` `{{POSTLIST_NEXT_HREF}}` | 上一页 / 下一页 URL |
| `{{POSTLIST_PREV_LABEL}}` `{{POSTLIST_NEXT_LABEL}}` | 上一页 / 下一页文案 |
| `{{POSTLIST_CURRENT_PAGE}}` `{{POSTLIST_TOTAL_PAGES}}` `{{POSTLIST_TOTAL}}` | 页码统计 |

### 6.2 条件块

| 块 | 说明 |
|----|------|
| `{{#POSTLIST_HAS_ITEMS}}` / `{{#POSTLIST_EMPTY}}` / `{{#POSTLIST_ERROR}}` | 有数据 / 空 / 错 |
| `{{#POSTLIST_HAS_PAGINATION}}` | 总页数 > 1 |
| `{{#POSTLIST_HAS_PREV}}` / `{{#POSTLIST_HAS_NEXT}}` | 有上一页 / 下一页 |
| `{{#POSTLIST_HAS_FILTERS}}` | 内核 `show_filter_chips` 为真且有 chip（文章列表通常关，筛选走 listfilter） |

### 6.3 循环

| 块 | 说明 |
|----|------|
| `{{#POST_ITEMS}}…{{/POST_ITEMS}}` | 本页文章。单篇占位符与 `post` 相同 |
| `{{#POSTLIST_PAGE_LINK}}…{{/POSTLIST_PAGE_LINK}}` | 页码。内置 `{{PAGE_NUMBER}}` `{{PAGE_HREF}}` `{{PAGE_ARIA_CURRENT}}` |
| `{{#PAGE_IS_ELLIPSIS}}` / `{{#PAGE_IS_NUMBER}}` / `{{#PAGE_IS_ACTIVE}}` | 省略号 / 数字 / 当前页 |
| `{{#POSTLIST_FILTER_ITEM}}` | 可选 chip：`{{FILTER_NAME}}` `{{FILTER_HREF}}` `{{FILTER_ARIA_CURRENT}}` |

当前页链接带 `aria-current="page"` 与 class `is-active`。CSS 用 `[aria-current="page"]` 或 `.is-active`，不要依赖 Tailwind。

最小结构：

```html
<section class="postlist01" data-postlist-section aria-label="Article list">
  {{#POSTLIST_EMPTY}}
  <p class="postlist01__empty">{{POSTLIST_EMPTY_MESSAGE}}</p>
  {{/POSTLIST_EMPTY}}
  {{#POSTLIST_HAS_ITEMS}}
  <ul class="postlist01__grid">
    {{#POST_ITEMS}}
    <li>
      <article data-postlist-card>
        <a href="{{POST_HREF}}">
          <img src="{{POST_IMAGE}}" alt="{{POST_IMAGE_ALT}}" />
          <h2>{{POST_TITLE}}</h2>
        </a>
      </article>
    </li>
    {{/POST_ITEMS}}
  </ul>
  {{/POSTLIST_HAS_ITEMS}}
  {{#POSTLIST_HAS_PAGINATION}}
  <nav class="postlist01__pager" aria-label="Pagination">
    {{#POSTLIST_HAS_PREV}}<a href="{{POSTLIST_PREV_HREF}}">{{POSTLIST_PREV_LABEL}}</a>{{/POSTLIST_HAS_PREV}}
    {{#POSTLIST_PAGE_LINK}}
    {{#PAGE_IS_NUMBER}}<a href="{{PAGE_HREF}}" aria-current="{{PAGE_ARIA_CURRENT}}">{{PAGE_NUMBER}}</a>{{/PAGE_IS_NUMBER}}
    {{#PAGE_IS_ELLIPSIS}}<span>…</span>{{/PAGE_IS_ELLIPSIS}}
    {{/POSTLIST_PAGE_LINK}}
    {{#POSTLIST_HAS_NEXT}}<a href="{{POSTLIST_NEXT_HREF}}">{{POSTLIST_NEXT_LABEL}}</a>{{/POSTLIST_HAS_NEXT}}
  </nav>
  {{/POSTLIST_HAS_PAGINATION}}
</section>
```

列表卡片循环写在本组件 HTML 的 `{{#POST_ITEMS}}` 里，不要再留 `{{POSTLIST_SECTION_CONTENT}}`（内核已不再往这里塞默认网格）。

---

## 7. CSS / JS

选择器挂在根 class 下；只引用 layout token；断点写死 640 / 768 / 1024 / 1280。不要再给自己加 `--page-pad` 水平内边距（列表页外壳 `.gt6-list-main` 已经有版心，宽度走 `--list-max`）。

**不必写 `init_script_url`。** 未配置自定义 init 时，内核默认跑平台 UI（`postListUi.client.ts`），只认 `data-postlist-section`、`data-postlist-card`。

若仍要自定义 init：包 IIFE；监听 `gt6:postlist:ready`，`event.detail.root` 是本插槽；不要顶层 `function findRoot`。此时默认**不再**跑平台 UI，除非 metadata 显式 `use_platform_ui: true`。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `postlist01` |
| `type` | `"postlist"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `translations[]` | 每语言 `html_url`、`css_url`；可选 `init_script_url` |
| `list_path` | 列表页路径，文章用 `/bloglist` |
| `article_limit` / `limit` / `page_size` | 每页篇数，默认 9，最大 24 |
| `article_type` | 逗号分隔。文章默认 `article,novel,tutorial,news,blog` |
| `template_id` | 内容模板 UUID。精确匹配；逗号分隔多个；也可 `"null"` 查未绑模板的文章。不配则不按模板筛 |
| `path_url` | 详情链接模板，文章用 `/article-{id}` |
| `show_filter_chips` | 文章列表建议 `false`（筛选走 listfilter） |

`status` 固定 `published`。分页 `page` 来自 URL，不要写进 metadata。

关联行默许覆盖：`article_limit`、`article_type`、`template_id`、`path_url`、`list_path`。不要在关联里再抄一份 `html_url` / `css_url`。

文章列表页 `page_code` 用 `bloglist`（导航已链到 `/bloglist`）。产品列表页 `page_code` 用 `product`（`/product`）。页面 metadata：`page_type: "list"`。关联：theme + header + pageheader + footer + listfilter + postlist。

### 8.3 产品列表皮（如 `postlist02`）

仍是 `type=postlist`。与文章皮差别只在 metadata 与卡片内容：

- `list_path` 用 `/product`，`article_type` 用产品类（如 `product,subscription_product,...`），`path_url` 用 `/productsingle-{id}`，`article_limit` 常用 `12`。
- 价格：`{{#POST_HAS_PRICE}}` + `data-price-raw="{{POST_PRICE}}"` + `data-category-ids="{{POST_CATEGORY_IDS}}"`。金额与是否展示走全局折扣（与 `product01` / newworld 列表相同）。
- 愿望清单心形：按钮不要包在商品 `<a>` 里。`data-product-id="{{POST_ID}}"`，读写 `localStorage.wishlist_product_ids`。
- 有自定义 init 时必须 `use_platform_ui: true`。

---

## 9. 入库清单

- [ ] `type=postlist`（组件字段，不在 metadata）
- [ ] `website/postlist/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-postlist-section`、`POST_ITEMS`、分页块
- [ ] CSS 无 Tailwind；当前页用 `[aria-current="page"]`
- [ ] 无自定义 init，或 IIFE + 不误关平台 UI
- [ ] `list_path` / `article_type` / `path_url` 指向文章列表
- [ ] 挂在 `bloglist`（或同等 list 页），只关联 code + sort
