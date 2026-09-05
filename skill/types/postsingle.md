# type=`postsingle`

路径与调用见文档根 `assets.md`。产品详情用 `productsingle`。下级用 `postchild`。

## 功能

在**单篇文章详情**上，按路由里的文章 id 拉已发布内容并注入模板。必须挂在页面 `type=postsingle` 的页上。约定 `page_code=article`，URL `/article-{id}`。

id 来自路由，不要写进页面 metadata。优先级：页面传入的 articleId → 路由 `params.id` → 仅调试用的 `article_id`。

真正的 SEO 以文章字段为准，页面 metadata 只是回退。

---

## 使用方法

1. 创建组件，显式 `type=postsingle`。`html_url` 必填。
2. 根：`<section class="{code}" data-postsingle-section>`。
3. 必须留下占位符。`{{POST_SINGLE_MAIN_CONTENT}}` / `{{METADATA_HTML}}` 不要再 escape。
4. 常用占位：`POST_SINGLE_TITLE`、`DATE_LINE`、`PUBLISHED_ISO`、`MAIN_CONTENT`、`FEATURED_IMAGE`、`SUMMARY`、`AUTHOR_*`、`FIELD_<slug>`；条件块 `HAS_CONTENT` / `ERROR` / `HAS_DATE` / `HAS_IMAGES` 等；循环 `IMAGE_ITEM`、`TAG_ITEM`、`CATEGORY_ITEM`。
5. 标签/分类链接：`{list_path}?tag_ids=` / `?category_ids=`。metadata `list_path` 文章列表常用 `/bloglist`。
6. 关联默许覆盖：`list_path`、各 `show_*`。

文件在 `website/postsingle/{code}/`。一页通常：pageheader + 本组件 + 可选 postchild。

---

## 使用案例

**标准文章详情。** 页面 `page_code=article`、`type=postsingle`。关联 postsingle，`list_path` 指回文章列表页。

**详情不要重复 H1。** pageheader 关联 `show_title: false`，`context=article`。

---

## 注意细节

- 打开无 id 的 `/{page_code}` 会 404，必须 `/{page_code}-{id}`。
- 漏传组件 type 不会拉文章。
- 不要用 `postsingle` 当 page_code，以免和组件 type 混名。
