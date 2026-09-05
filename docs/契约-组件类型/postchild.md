# type=`postchild`（当前文章的下级列表）

Skill 可读的组件类型契约。做**文章/产品详情页上的关联下级**（关联文章、关联产品）时读本文。展示皮可从 [post.md](./post.md) 拷贝；数据源不同，不要用 `post` 去搜全站文章。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。首页预览见 [post.md](./post.md)。文章详情见 [postsingle.md](./postsingle.md)。产品详情见 [productsingle.md](./productsingle.md)。

---

## 0. 读本文的 Agent 环境（先读）

假定你**已经具备**下列能力，鉴权与当前租户由工具处理，**不要**改用手写 HTTP、curl、密钥文件或「当前这台机器上的上传脚本」来完成本文任务。

1. **文档管理工具**：可直接在 `https://tenantdoc.gt6ai.xyz/{租户id}/` 下上传、覆盖、列举、删除文件。传路径时**不要**自己拼租户 id。成功结果里的完整 `url` 才写入 metadata。
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
| 详情页展示当前文章的下级（关联文章 / 关联产品） | 是 |
| 按类型、发布状态、模板、分类、标签从下级里再筛 | 是：改组件或关联里的过滤字段 |
| 首页/落地页按条件搜全站文章 | 否：`post` |
| 整页列表、筛选 | 否：`postlist` / `listfilter` |
| 详情正文 / 购买主体 | 否：`postsingle` / `productsingle` |

---

## 2. 它是什么

`postchild` 是**当前文章的下级预览区块**：内核先拉**父文章主 JSON**，看 `has_children` 与 `child_article_ids`。没有下级则**整块不渲染**。有下级时，对每个 id 并行拉 **简易 JSON + 主 JSON**，再按组件 metadata 过滤后注入模板。

`child_article_ids` **不分文章类型**。同一父文章下可以混有文章和产品。要在详情页同时出「关联文章」和「关联产品」，挂 **两个** `type=postchild`，用 `article_type`（以及可选的 `template_id` / `category_ids` / `tag_ids` / `publish_status`）分开筛。

- 父文章 id：详情路由 `/article-{id}`、`/productsingle-{id}` 的 id；也可写 metadata `article_id`。
- 只展示 `status=published` 的下级。过滤后一条都没有，同样整块不渲染。
- 展示顺序保持 `child_article_ids` 原序（创建时间升序）。
- 占位符与 Tab 钩子与 `post` **相同**（`{{POST_*}}`、`data-post-tab`）。可直接拷 `post01` 的 HTML/CSS。
- 一页可以挂多个 `type=postchild`。

内核：组件记录 `type===postchild` → `postchild.astro`。不再要求名字是 `postchild` / `postchild01`。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"postchild"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |

创建时**显式传** `type=postchild`。漏传会变成默认 `static`，不会读下级、也不会注入卡片。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `postchild01`，**不要** `post-child` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.postchild01` |
| 组件字段 `type` | `"postchild"` |

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/postchild/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/postchild/{components_code}/html
website/postchild/{components_code}/css
website/postchild/{components_code}/js
website/postchild/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 区块 init（可选） | `js/` | `{code}.js` |

硬性：图片走本组件 `media/` 的完整 tenantdoc URL。禁止 `/images/…`、站点相对路径。

---

## 6. HTML 合同

与 [post.md](./post.md) 第 6 节相同：一根 `<section class="{code}">`，卡片循环用 `{{#POST_ITEMS}}`，Tab 用 `data-post-tab` / `data-post-panel`。禁止 Tailwind / Bootstrap。

内核插槽带 `data-post-section`、`data-post-slot`、`data-postchild-section`，Tab 平台 UI 复用 `post`。

产品卡片同样可用 `{{#POST_HAS_PRICE}}`、`data-price-raw="{{POST_PRICE}}"`、`data-category-ids="{{POST_CATEGORY_IDS}}"`、愿望清单 `data-product-id="{{POST_ID}}"`。

---

## 7. CSS / JS

选择器挂在根 class 下；只引用 layout token；断点写死 640 / 768 / 1024 / 1280。

**Tab 不必写 `init_script_url`。** 未配置自定义 init 时，内核默认跑平台 UI（`postUi.client.ts`）。有自定义 init 时默认不再跑平台 UI，除非 `use_platform_ui: true`。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `postchild01` |
| `type` | `"postchild"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `translations[]` | 每语言 `html_url`、`css_url`；可选 `init_script_url` |
| `header.title` + `header.translations[]` | 区块标题，默认「相关内容」 |
| `cta` + `cta.translations[]` | 底部「更多」链接 |
| `article_id` | 可选。父文章 UUID。详情页不必写，内核用路由 id |
| `article_limit` / `limit` | 过滤后最多展示几条，默认 8，最大 24 |
| `article_type` | 逗号分隔。**不配则下级里所有类型都可出**（与 `post` 不同） |
| `publish_status` | 可选。如 `recommended` / `featured`。不配则不按角标筛 |
| `template_id` | 内容模板 UUID。逗号分隔多个；也可 `"null"`。不配则不按模板筛 |
| `category_ids` | 文章分类 UUID，逗号或数组。下级须命中至少一个 |
| `tag_ids` | 文章标签 UUID，逗号或数组。下级须命中至少一个 |
| `path_url` | 详情链接模板。不配则按该条自己的 `article_type` 走 `/article-{id}` 或 `/productsingle-{id}` |
| `tabs` / `groups` | 可选。多组过滤（如一个区块里 Tab 切「文章 / 产品」） |

`status` 固定只出 `published` 下级，不要写进 metadata。不要用本组件去调 `/articles/ids` 做全站搜索。

根级 `article_limit`、`article_type`、`path_url`、`template_id` 作为各 Tab 默认值。Tab 未写的 `category_ids` / `tag_ids` 不继承。

关联行默许覆盖：标题/CTA、`article_type`、`template_id`、`category_ids`、`tag_ids`、`publish_status`、`article_limit`。不要在关联里再抄一份 `html_url` / `css_url`。

产品详情页示例（两个实例）：

```json
{ "article_type": "article,novel,tutorial,news,blog", "path_url": "/article-{id}" }
```

```json
{ "article_type": "product,subscription_product", "path_url": "/productsingle-{id}" }
```

---

## 9. 入库清单

- [ ] `type=postchild`（组件字段，不在 metadata）
- [ ] `website/postchild/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `POST_SECTION_TITLE`、`POST_ITEMS`；有 Tab 时含 `data-post-tab` / `data-post-panel`
- [ ] CSS 无 Tailwind
- [ ] 过滤字段指向真实类型/分类/标签/模板；不配 `article_type` 时会混出所有类型
- [ ] 挂在 `postsingle` / `productsingle` 页正文（single 组件之后），只关联 code + sort
