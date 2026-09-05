# type=`pageheader`

路径与调用见文档根 `assets.md`。站点顶栏是 `header`，不是本文。

## 功能

在内页顶部提供**面包屑、页标题、可选描述**时使用。不调文章列表 API；仅当 URL 带 `category_ids` / `tag_ids` 时才会取分类/标签名来改标题和末级面包屑。

一页通常只挂一个。列表壳里它在 `.gt6-list-main` **上方**（全宽）。首页可省略。详情页常藏 H1（`show_title: false`），标题由 single 组件出。

同一组件可挂到多种内页，用**关联**覆盖 `context` / 文案，不要为每页复制一份 HTML。

---

## 使用方法

1. 创建组件，显式 `type=pageheader`。`html_url` 必填。建议 sort=5。
2. metadata / 关联覆盖：
   - `context`：`bloglist` / `product` / `article` / `productsingle`。`product` 是**列表**，详情用 `productsingle`
   - `list_path`：回列表路径
   - `breadcrumb.items[]`：`label` 或 `label_key`，可选 `href`、`current`
   - `header.title` / `header.subtitle`
   - `show_title` / `show_description`（默认：列表开，详情关）
3. 组件皮上不要写死 `context` / `breadcrumb`，留给各页关联或内核默认。

文件在 `website/pageheader/{code}/`。

内核默认：文章列表 Home → Blog；产品列表 Home → Our Products；详情把当前标题接到末级。

---

## 使用案例

**文章列表。** 关联可不写死标题，或只写 `context` 对应列表。

**登录页。** 页面 `type=general`。关联覆盖 `header.title` 与面包屑 Home → Log in。

**详情页。** 关联 `context=article` 或 `productsingle`，`show_title: false`。

---

## 注意细节

- 漏传 type 不会注入标题/面包屑。
- 不要把 `context=product` 当成产品详情。
