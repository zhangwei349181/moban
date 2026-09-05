# type=`postlist`

路径与调用见文档根 `assets.md`。筛选用 `listfilter`。首页预览用 `post`。

## 功能

在**列表页网格**上按组件查询 + **当前 URL 查询参数**拉已发布条目，并输出分页。必须挂在页面 `type=list` 的页上，并与 `listfilter` 同页。内核把二者放进 `.gt6-list-main`（宽屏左筛选右网格）。

**不支持** `tabs` / `groups`。不要用本类型做首页若干篇预览。

---

## 使用方法

1. 创建组件，显式 `type=postlist`。`html_url`、`css_url` 必填。
2. 根：`<section class="{code}" data-postlist-section>`。循环复用 `{{#POST_ITEMS}}` 与 `post` 的单篇占位符。保留分页占位符。不要再留已废弃的整块内容占位。
3. metadata：
   - `list_path`：本列表页路径（文章列表常用 `/bloglist`，产品列表常用 `/product`）
   - `article_type`：文章类或产品类
   - `path_url`：点进详情的模板（`/article-{id}` 或 `/productsingle-{id}`）
   - `article_limit`、可选 `template_id`
4. URL 里的 `page`、`category_ids`、`tag_ids` 等与 metadata 合并，**URL 优先**。
5. 关联默许覆盖上述查询字段。产品列表卡片同样可用价格与心形钩子（见 `types/post.md`）。

文件在 `website/postlist/{code}/`。

页面关联建议：layout 1、header 2、pageheader 5、listfilter 10、postlist 11、footer 20。

---

## 使用案例

**文章列表。** 页面 `page_code` 建议固定为 `bloglist`，页面 `type=list`。`list_path=/bloglist`，`path_url=/article-{id}`，`article_type` 为文章类。

**产品列表。** 页面 `page_code` 建议 `product`（这是列表，不是详情）。`list_path=/product`，`path_url=/productsingle-{id}`，`article_type` 为产品类。

**只改每页条数。** 改组件或该页关联的 `article_limit`，不要换 type。

---

## 注意细节

- 页面 type 不是 `list` 时，左右栏布局不会出现。
- `product` 页是列表；详情是 `productsingle`。不要用 `/product-{id}`。
- 漏传组件 type 不会分页、不会拉列表。
