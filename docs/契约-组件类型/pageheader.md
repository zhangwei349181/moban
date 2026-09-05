# type=`pageheader`（内页页头 / 面包屑）

Skill 可读的组件类型契约。做列表页或详情页顶部的面包屑、页标题、可选描述时读本文。不要从 a0005 的 `pageheader` Tailwind HTML 直接入库。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。列表网格见 [postlist.md](./postlist.md)。

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
| 列表页顶部面包屑 + 页标题 | 是 |
| 把 a0005 某个 pageheader 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 换面包屑文案、是否显示标题/描述 | 是：改组件或**关联** metadata（`context` / `breadcrumb` / `header`） |
| 整页列表网格 / 筛选 | 否：`postlist` / `listfilter` |
| 站点顶栏 Logo / 导航 | 否：`header` / `chrome` |

---

## 2. 它是什么

`pageheader` 是**内页页头**：内核 SSR 根据 metadata + 当前 URL + 页面 SEO 算出标题、描述、面包屑，注入 `html_url` 模板。**不调文章列表 API**（分类筛选时才会按 URL 里的 `category_ids` / `tag_ids` 去取分类/标签名称来改标题和末级面包屑）。

- 须挂在列表型页面（`bloglist` / `product`）或详情页；一页通常只挂一个。
- 内核把同页的 pageheader 放在 `.gt6-list-main` **上方**（全宽），筛选和网格仍在下方左右排列。
- **一处皮、到处挂**：同一 `pageheader01` 可同时挂文章列表和产品列表。文案与 `context` 用关联 metadata（或列表页内核默认）覆盖，不要为每页复制一份 HTML。

内核：组件记录 `type===pageheader` → `pageheader.astro`。不再要求名字是 `pageheader` / `pageheader01`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"pageheader"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |

创建时**显式传** `type=pageheader`。漏传会变成默认 `static`，不会注入标题/面包屑。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `pageheader01`，**不要** `page-header` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.pageheader01`；子元素 BEM：`.pageheader01__title` |
| 组件字段 `type` | `"pageheader"` |

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/pageheader/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/pageheader/{components_code}/html
website/pageheader/{components_code}/css
website/pageheader/{components_code}/js
website/pageheader/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 区块 init | 通常不需要 | — |

硬性：禁止 `/images/…`、站点相对路径、其它业务租户。`css_url` **必填**（内核不注入全局 pageheader.css，也没有 HTML 回退模板）。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-pageheader-section>`。
2. **必须留下本文占位符与 `data-*`**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 不必写 `init_script_url`。

### 6.1 标量

| 占位符 | 来源 |
|--------|------|
| `{{PAGE_TITLE}}` | `header.title`，否则页面 SEO 标题；列表页有分类/标签筛选时换成该分类/标签名 |
| `{{PAGE_DESCRIPTION}}` | `header.subtitle` / 页面 SEO 描述（已 HTML 转义） |
| `{{PAGE_DESCRIPTION_BLOCK}}` | 内核注入的 `<p data-pageheader-desc>…</p>`（无描述时为空）。新皮优先用 `PAGE_HAS_DESCRIPTION` + `PAGE_DESCRIPTION` |
| `{{BREADCRUMB_ARIA_LABEL}}` | 面包屑 `aria-label`（内核按语言给「面包屑导航」/ `Breadcrumb`） |

### 6.2 条件块

| 块 | 说明 |
|----|------|
| `{{#PAGE_HAS_BREADCRUMBS}}` | 有面包屑项 |
| `{{#PAGE_HAS_TITLE}}` | `show_title` 为真且标题非空。列表页默认显示；详情页默认隐藏标题（标题走正文） |
| `{{#PAGE_HAS_DESCRIPTION}}` | `show_description` 为真且描述非空 |

### 6.3 面包屑循环

| 块 / 占位符 | 说明 |
|-------------|------|
| `{{#BREADCRUMB_ITEM}}…{{/BREADCRUMB_ITEM}}` | 每一级 |
| `{{#BREADCRUMB_SEPARATOR}}` | 非首项前的分隔符（内核自动去掉第一项前面的） |
| `{{#BREADCRUMB_IS_LINK}}` | 有 `href` 且不是当前页 |
| `{{#BREADCRUMB_IS_CURRENT}}` | 当前页（无链接） |
| `{{BREADCRUMB_LABEL}}` `{{BREADCRUMB_HREF}}` | 文案与链接 |

最小结构：

```html
<section class="pageheader01" data-pageheader-section>
  <div class="pageheader01__inner">
    {{#PAGE_HAS_BREADCRUMBS}}
    <nav class="pageheader01__crumbs" aria-label="{{BREADCRUMB_ARIA_LABEL}}">
      {{#BREADCRUMB_ITEM}}
      {{#BREADCRUMB_SEPARATOR}}<span aria-hidden="true">/</span>{{/BREADCRUMB_SEPARATOR}}
      {{#BREADCRUMB_IS_LINK}}
      <a href="{{BREADCRUMB_HREF}}">{{BREADCRUMB_LABEL}}</a>
      {{/BREADCRUMB_IS_LINK}}
      {{#BREADCRUMB_IS_CURRENT}}
      <span aria-current="page">{{BREADCRUMB_LABEL}}</span>
      {{/BREADCRUMB_IS_CURRENT}}
      {{/BREADCRUMB_ITEM}}
    </nav>
    {{/PAGE_HAS_BREADCRUMBS}}
    {{#PAGE_HAS_TITLE}}
    <h1>{{PAGE_TITLE}}</h1>
    {{/PAGE_HAS_TITLE}}
    {{#PAGE_HAS_DESCRIPTION}}
    <p data-pageheader-desc>{{PAGE_DESCRIPTION}}</p>
    {{/PAGE_HAS_DESCRIPTION}}
  </div>
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 下；只引用 layout token；断点写死 640 / 768 / 1024 / 1280。页头自己用 `max-width: var(--page-max)` + `padding-inline: var(--page-pad)` 对齐版心。

**不必写 `init_script_url`。**

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `pageheader01` |
| `type` | `"pageheader"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `translations[]` | 每语言 `html_url`、`css_url` |
| `context` | `bloglist` / `product` / `article` / `productsingle`。决定默认面包屑与是否按 URL 筛选改标题 |
| `list_path` | 列表路径。文章 `/bloglist`，产品 `/product` |
| `breadcrumb.items[]` | `{ label }` 或 `{ label_key }`，可选 `href`、`current` |
| `header.title` / `header.subtitle` | 覆盖页标题与描述；不写则用页面 SEO |
| `show_title` / `show_description` | 默认：列表页开，详情页关 |

组件皮上**不要**写死 `context` / `breadcrumb`，让各页关联或列表页内核默认注入：

| 页面 | 内核默认 `context` | 默认末级面包屑 |
|------|-------------------|----------------|
| `bloglist` | `bloglist` | Home → Blog（`new_blog_section_title`） |
| `product` | `product` | Home → Our Products（`our_products_section_title`） |
| `article`（详情，关联覆盖） | `article` | Home → Blog → 当前文章标题 |
| `productsingle`（详情，关联覆盖） | `productsingle` | Home → Our Products → 当前产品标题 |

URL 带 `category_ids` / `tag_ids` 时，标题与末级面包屑换成该分类/标签名。`context=product` 是**产品列表**，不要当成产品详情（详情用 `context=productsingle`）。`context=article` 是文章详情：内核隐藏 pageheader 标题，并把文章名接到面包屑末级。

关联行默许覆盖：`context`、`list_path`、`breadcrumb`、`header`、`show_title`。不要在关联里再抄一份 `html_url` / `css_url`。

列表页关联顺序建议：theme `1`、header `2`、**pageheader `5`**、listfilter `10`、postlist `11`、footer `20`。

文章详情页关联顺序建议：theme `1`、header `2`、**pageheader `5`**（`context: article`）、postsingle `10`、footer `20`。

产品详情页关联顺序建议：theme `1`、header `2`、**pageheader `5`**（`context: productsingle`）、productsingle `10`、footer `20`。

联系页关联顺序建议：theme `1`、header `2`、**pageheader `5`**、form `10`、footer `20`。标题与面包屑用关联覆盖，例如 Home → Contact。

登录页关联顺序建议：theme `1`、header `2`、**pageheader `5`**、login `10`、footer `20`。面包屑 Home → Log in。

注册页关联顺序建议：theme `1`、header `2`、**pageheader `5`**、signup `10`、footer `20`。面包屑 Home → Sign up。

---

## 9. 入库清单

- [ ] `type=pageheader`（组件字段，不在 metadata）
- [ ] `website/pageheader/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-pageheader-section`、`PAGE_TITLE`、`BREADCRUMB_ITEM`
- [ ] CSS 无 Tailwind；描述用 `[data-pageheader-desc]`
- [ ] 无自定义 init
- [ ] 同一皮挂到 `bloglist` 与 `product`，只关联 code + sort（context 走默认或关联覆盖）
