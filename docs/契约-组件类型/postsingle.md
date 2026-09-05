# type=`postsingle`（文章详情正文）

Skill 可读的组件类型契约。做博客/资讯**单篇详情页主体**时读本文。不要从 a0005 的 `postsingle` Tailwind HTML 直接入库。不要把正文写进页面 metadata。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头/面包屑见 [pageheader.md](./pageheader.md)。列表见 [postlist.md](./postlist.md)。产品交易详情见 [productsingle.md](./productsingle.md)，不要用本文皮去扛商品购买。详情页下级见 [postchild.md](./postchild.md)。

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
| 文章详情页主体（标题、图集、Markdown 正文、标签/分类） | 是 |
| 把 a0005 某个 `postsingle` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 换列表回跳路径、是否显示作者/图集 | 是：改组件或关联里的开关字段 |
| 首页若干篇预览 | 否：`post` |
| 整页文章列表 | 否：`postlist` / `listfilter` |
| 隐私政策等远程静态 MD | 否：`markdown` |
| 产品购买详情 | 否：`productsingle` |
| 详情页关联下级 | 否：`postchild` |
| 面包屑 | 否：`pageheader`（同页另挂） |

---

## 2. 它是什么

`postsingle` 是**单篇文章详情区块**：内核 SSR 按路由里的文章 id 拉已发布内容，注入 `html_url` 模板里的 `{{POST_SINGLE_*}}`，再加载该组件自己的 CSS。

- **要调文章 API**（单篇，不是列表）。id 来自详情路由 `/article-{id}`，不要写进页面 metadata。
- **须挂在文章详情页**（`page_code=article`，URL `/article-{id}`）。一页通常只挂一个。
- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 面包屑不在本组件内，由同页 `type=pageheader` 负责（详情页默认藏 H1，标题走本组件）。

内核：组件记录 `type===postsingle` → `postsingle.astro`。不再要求名字是 `postsingle` / `postsingle01`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"postsingle"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |

创建时**显式传** `type=postsingle`。漏传会变成默认 `static`，不会拉文章、占位符原样输出。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `postsingle01`，**不要** `post-single` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.postsingle01` |
| 组件字段 `type` | `"postsingle"` |

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/postsingle/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/postsingle/{components_code}/html
website/postsingle/{components_code}/css
website/postsingle/{components_code}/js
website/postsingle/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 区块 init（可选） | `js/` | `{code}.js` |

硬性：图片走文章数据或本组件 `media/` 的完整 tenantdoc URL。禁止 `/images/…`、站点相对路径、其它业务租户。`css_url` **必填**（内核不注入全局详情 CSS，也没有 HTML 回退模板）。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-postsingle-section>`。
2. **必须留下本文占位符与 `data-*`**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。若写自定义 JS，必须包 IIFE。
6. `{{POST_SINGLE_MAIN_CONTENT}}` 与 `{{METADATA_HTML}}` 是服务端已渲染 HTML，**不要再 escape**。不要在 HTML 注释里写 `{{...}}` 字面量。

### 6.1 标量

| 占位符 | 来源 |
|--------|------|
| `{{POST_SINGLE_TITLE}}` | 文章标题 |
| `{{POST_SINGLE_DATE_LINE}}` | 日期行（如 `BY ADMIN, JUNE 15, 2026`） |
| `{{POST_SINGLE_PUBLISHED_ISO}}` | ISO 发布时间（`<time datetime>`） |
| `{{POST_SINGLE_MAIN_CONTENT}}` | 正文 HTML |
| `{{POST_SINGLE_FEATURED_IMAGE}}` / `{{POST_SINGLE_FEATURED_IMAGE_ALT}}` | 仅一张图时的主图 |
| `{{POST_SINGLE_SUMMARY}}` / `{{POST_SINGLE_SUMMARY_120}}` | 摘要 |
| `{{POST_SINGLE_AUTHOR_*}}` | 作者（`NAME` / `EMAIL` / `PHONE` / `AVATAR` / `INITIAL` / `BY_PREFIX`） |
| `{{POST_SINGLE_FIELD_<slug>}}` | 主表 `template_fields`（slug 化 key） |

### 6.2 条件块

| 块 | 说明 |
|----|------|
| `{{#POST_SINGLE_HAS_CONTENT}}` / `{{#POST_SINGLE_ERROR}}` | 成功 / 未找到 |
| `{{#POST_SINGLE_HAS_DATE}}` | 有日期且 `show_date` |
| `{{#POST_SINGLE_HAS_IMAGES}}` | 有图且 `show_images` |
| `{{#POST_SINGLE_HAS_SINGLE_IMAGE}}` / `{{#POST_SINGLE_HAS_GALLERY}}` | 1 张 / ≥2 张 |
| `{{#POST_SINGLE_HAS_MAIN_CONTENT}}` | 有正文 |
| `{{#POST_SINGLE_HAS_METADATA}}` | 有 `content.metadata` 附加块 |
| `{{#POST_SINGLE_HAS_TAGS}}` / `{{#POST_SINGLE_HAS_CATEGORIES}}` / `{{#POST_SINGLE_HAS_TAXONOMY}}` | 标签 / 分类 |
| `{{#POST_SINGLE_HAS_AUTHOR}}` 及 `AUTHOR_HAS_AVATAR` / `NO_AVATAR` / `HAS_EMAIL` / `HAS_PHONE` | 作者 |

### 6.3 循环

| 块 | 内置 |
|----|------|
| `{{#POST_SINGLE_IMAGE_ITEM}}` | `IMAGE_SRC` `IMAGE_ALT` `IMAGE_INDEX` `IMAGE_LOADING` |
| `{{#POST_SINGLE_TAG_ITEM}}` | `TAG_ID` `TAG_NAME` `TAG_HREF`（`{list_path}?tag_ids=`） |
| `{{#POST_SINGLE_CATEGORY_ITEM}}` | `CATEGORY_ID` `CATEGORY_NAME` `CATEGORY_HREF`（`{list_path}?category_ids=`） |
| `{{#POST_SINGLE_METADATA_BLOCK}}` | `METADATA_KEY` `METADATA_HTML`（不转义） |

最小结构：

```html
<section class="postsingle01" data-postsingle-section>
  {{#POST_SINGLE_ERROR}}
  <p>Article not found.</p>
  {{/POST_SINGLE_ERROR}}
  {{#POST_SINGLE_HAS_CONTENT}}
  <header>
    <h1>{{POST_SINGLE_TITLE}}</h1>
    {{#POST_SINGLE_HAS_DATE}}
    <time datetime="{{POST_SINGLE_PUBLISHED_ISO}}">{{POST_SINGLE_DATE_LINE}}</time>
    {{/POST_SINGLE_HAS_DATE}}
  </header>
  {{#POST_SINGLE_HAS_SINGLE_IMAGE}}
  <img src="{{POST_SINGLE_FEATURED_IMAGE}}" alt="{{POST_SINGLE_FEATURED_IMAGE_ALT}}" />
  {{/POST_SINGLE_HAS_SINGLE_IMAGE}}
  {{#POST_SINGLE_HAS_GALLERY}}
  {{#POST_SINGLE_IMAGE_ITEM}}
  <img src="{{IMAGE_SRC}}" alt="{{IMAGE_ALT}}" loading="{{IMAGE_LOADING}}" />
  {{/POST_SINGLE_IMAGE_ITEM}}
  {{/POST_SINGLE_HAS_GALLERY}}
  <article>
    {{#POST_SINGLE_HAS_MAIN_CONTENT}}{{POST_SINGLE_MAIN_CONTENT}}{{/POST_SINGLE_HAS_MAIN_CONTENT}}
  </article>
  {{#POST_SINGLE_HAS_TAXONOMY}}
  {{#POST_SINGLE_TAG_ITEM}}<a href="{{TAG_HREF}}">{{TAG_NAME}}</a>{{/POST_SINGLE_TAG_ITEM}}
  {{#POST_SINGLE_CATEGORY_ITEM}}<a href="{{CATEGORY_HREF}}">{{CATEGORY_NAME}}</a>{{/POST_SINGLE_CATEGORY_ITEM}}
  {{/POST_SINGLE_HAS_TAXONOMY}}
  {{/POST_SINGLE_HAS_CONTENT}}
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 下；只引用 layout token；断点写死 640 / 768 / 1024 / 1280。自己用 `max-width: var(--page-max)` + `padding-inline: var(--page-pad)` 对齐版心。正文排版（标题、段落、列表、图片）写在本组件 CSS，不要依赖全局 `.prose` 或 `.page-markdown-content__body`。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核默认跑平台 UI（`postSingleUi.client.ts`）：仅当模板里出现 `.post-single-gallery-main`（Swiper）或 `[data-post-single-tabs]` 才有实际动作。网格图集不需要 JS。

若仍要自定义 init：包 IIFE；监听 `gt6:postsingle:ready`，`event.detail.root` 是本插槽；不要顶层 `function findRoot`。此时默认**不再**跑平台 UI，除非 metadata 显式 `use_platform_ui: true`。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `postsingle01` |
| `type` | `"postsingle"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `translations[]` | 每语言 `html_url`、`css_url`；可选 `init_script_url` |
| `list_path` | 标签/分类回列表的路径，文章用 `/bloglist` |
| `show_date` / `show_images` / `show_tags` / `show_categories` | 默认 `true` |
| `show_author` | 默认 `false` |
| `exclude_template_fields` | 从字段循环里排除的 slug |

文章 id **不要**写进 metadata。优先级：页面传入的 `articleId` → 路由 `params.id` → 仅调试用的 `article_id`。

`translations[].language` 与 `language_code` 都写上（`en` / `zh-CN`）。

关联行默许覆盖：`list_path`、各 `show_*`。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 文章详情页

`page_code` 必须是 `article`（或 `article01`…，URL 为 `/{page_code}-{id}`）。页面 metadata **只留 SEO 回退**（真正的 title/description 由内核按该篇文章覆盖）。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**（`context: article`，`list_path: /bloglist`）、**postsingle `10`**、footer `20`。

pageheader 关联示例：

```json
{
  "context": "article",
  "list_path": "/bloglist",
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "new_blog_section_title", "href": "/bloglist" }
    ]
  }
}
```

内核会把当前文章标题接到面包屑末级，并默认隐藏 pageheader 的 H1。

---

## 9. 入库清单

- [ ] `type=postsingle`（组件字段，不在 metadata）
- [ ] `website/postsingle/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-postsingle-section`、`POST_SINGLE_TITLE`、`POST_SINGLE_MAIN_CONTENT`
- [ ] CSS 无 Tailwind；`css_url` 必填
- [ ] 无自定义 init，或 IIFE + 不误关平台 UI
- [ ] `list_path` 指向 `/bloglist`
- [ ] 挂在 `page_code=article`，只关联 code + sort；页面无文档 URL
