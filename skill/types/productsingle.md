# type=`productsingle`

路径与调用见文档根 `assets.md`。文章详情用 `postsingle`。产品**列表**是页面 `product` + `postlist`，不是本文。

## 功能

在**单件产品详情**上拉产品数据、注入展示占位符，并挂交易运行时（加购、变体、愿望清单）。必须挂在页面 `type=productsingle` 的页上。约定 `page_code=productsingle`，URL `/productsingle-{id}`。一页只渲染**第一个**本类型槽。

`article_type` 必须是产品类（如 `product`、`subscription_product`、`crowdfunding_product`、`wholesale_product`、`group_product`、`finance_product`）。其它类型访问详情会 404。

交易 DOM **写在组件 HTML 里**。内核填标量并挂 `ProductSingleRuntime`。不要在自定义 init 里重写加购。不要再用已删除的整段交易壳占位符。

---

## 使用方法

1. 创建组件，显式 `type=productsingle`。`html_url`、`css_url` 必填（CSS 须覆盖交易钩子，全局没有 `.btn`）。
2. 根必须有 `data-productsingle-section`、`data-article-id="{{PRODUCT_SINGLE_ARTICLE_ID}}"`。
3. 交易锚点缺一则加购失效（至少包括 loading 层、加购按钮、愿望清单按钮及规定的 id/`data-*`）。另有内核写入的 SSR payload 节点。改皮时对照租户里已有的该 type 组件 HTML 保留选择器。
4. 占位符前缀 `PRODUCT_SINGLE_*`：标题、摘要、正文、图集、加购/愿望清单文案，以及与文章详情同结构的 `HAS_*` / 循环。
5. metadata：`list_path` 回产品列表（常用 `/product`）。关联默许覆盖 `list_path`。

文件在 `website/productsingle/{code}/`。

---

## 使用案例

**标准产品详情。** 页面 type=`productsingle`。主组件本类型，pageheader `context=productsingle`，可选再挂 `postchild`。

**从列表点进来。** 列表 `path_url` 必须是 `/productsingle-{id}`，不是 `/product-{id}`。

---

## 注意细节

- `/product-{id}` 不会当详情。
- 漏传组件 type 不会挂交易 runtime。
- 不要把列表页标成 `productsingle`。
