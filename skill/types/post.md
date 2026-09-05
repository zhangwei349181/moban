# type=`post`

路径与调用见文档根 `assets.md`。整页列表用 `postlist`；详情下级用 `postchild`。

## 功能

在**首页或落地页**上按查询条件预览若干篇已发布文章或产品时使用。内核 SSR 拉数据，注入 `{{POST_*}}`。可挂任意展示页，不要求页面 `type=list`。

支持多组查询（`tabs` / `groups`）。Tab 切换用平台 UI（`data-post-tab` / `data-post-panel`），不必为切 Tab 单独写 init。

不要用本类型做整页筛选网格（`postlist`）或详情页关联下级（`postchild`）。

---

## 使用方法

1. 创建组件，显式 `type=post`。`html_url` 必填。卡片循环必须写在组件 HTML 的 `{{#POST_ITEMS}}` 里。
2. 根：`<section class="{code}">`。需要 Tab 时保留 `POST_TAB_NAV` / `POST_TAB_PANEL` 与 `data-post-tab` / `data-post-panel`。
3. 单篇占位符：`POST_HREF` `POST_TITLE` `POST_IMAGE` `POST_SUMMARY` `POST_DATE` 等。产品预览另可用 `{{#POST_HAS_PRICE}}`、`data-price-raw="{{POST_PRICE}}"`、`data-category-ids="{{POST_CATEGORY_IDS}}"`。心形按钮不要包在商品 `<a>` 里，用 `data-product-id="{{POST_ID}}"`。
4. metadata（禁止 `type`）常见字段：
   - `article_type`：逗号分隔。文章类与产品类不要混用在同一组默认查询里，除非你有意混排。
   - `path_url`：详情链接模板，如 `/article-{id}` 或 `/productsingle-{id}`。
   - `template_id`：内容模板 UUID，可多个或 `"null"`。不配则不按模板筛。
   - `article_limit`、`category_ids`、`tag_ids`
   - `tabs` / `groups`：每组自己的 id、label、查询字段
5. 根级 `article_limit` / `article_type` / `path_url` / `template_id` 作各 Tab 默认值。Tab 未写的 `category_ids` **不继承**。
6. 关联默许覆盖：标题/CTA、查询字段。不要抄皮 URL。

文件在 `website/post/{code}/`。

---

## 使用案例

**首页出一组最新文章。** 页面 `type=general`。关联或组件上写文章类 `article_type`、`path_url=/article-{id}`、合适的 `article_limit`。

**首页出一组产品并带价格。** `article_type` 用产品类，`path_url=/productsingle-{id}`。价格是否展示走全局折扣与登录态，不要在皮里写死金额逻辑。

**同一区块用 Tab 切两个分类。** metadata 写两组 `tabs`，HTML 用平台 Tab 钩子。

---

## 注意细节

- 漏传 type 会变成 static，占位符原样输出、不拉数。
- 不要用组件名字判断是不是文章区块。
- 未登录价格看 `show_price_for_unregistered`；折扣走 `window.__ASTRO_GLOBAL_DISCOUNT__`。
