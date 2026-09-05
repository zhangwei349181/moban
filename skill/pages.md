# 页面契约

页面不是组件：不带 HTML/CSS/JS。只决定 **URL、SEO、走哪套页面壳、挂哪些组件**。正文只来自关联组件。

写页面用 `web_pages_create/update/delete`。挂组件用 `web_page_components_*`。读当前租户用 `web_static_pages_list/get`；读参考库用 `web_ref_resource_pages_list/get`。

`type` 是页面表字段，与 `page_code`、`metadata` 并列。创建/更新时**显式传** `type`。不要写进 `metadata`。漏传视为 `general`。

---

## 1. 页面负责 / 不负责

| 负责 | 不负责（改去哪） |
|------|------------------|
| `page_code` → URL | 组件 HTML/CSS/JS → 改组件或换一个组件挂上 |
| 页面 `type` → 选壳 | `content` / `markdowncode` / `htmlcode` → 挂 `markdown` 或其它组件 |
| SEO（title / description / keywords） | 页面 metadata 里再写 `html_url` / `css_url` |
| 关联哪些组件、什么顺序 | 用页面 metadata 的 `type` 表示页面或组件类型 |

内核按 `page_code` 拉 `web_pages/{page_code}.json`，再按关联渲染。未知 `page_code` 404。首页固定读 `home`，URL 是 `/` 不是 `/home`。

---

## 2. `page_code` 与 URL

仅字母数字。不要连字符。

| 页面 type | URL | 例子 |
|-----------|-----|------|
| `general` / `list` | `/{page_code}` | `/login`、`/bloglist`、`/product` |
| `postsingle` / `productsingle` | `/{page_code}-{id}` | `/article-{id}`、`/productsingle-{id}` |
| 首页 | `/` | `page_code` 必须是 `home` |

`/{page_code}`（无 id）遇到详情 type 会 404。

---

## 3. 必须固定的页码

改名会导致登录回跳、购物车、订阅支付、邮件验证对不上。组件默认 `checkout_url` / `login_url` / `success_url` 也指向这些路径。

功能页，页面 `type` 一律 `general`：

| `page_code` | URL | 主组件 type | 谁会跳过来 |
|-------------|-----|-------------|------------|
| `login` | `/login` | `login` | 结账 / 会员中心未登录、`?return=` |
| `signup` | `/signup` | `signup` | 登录页「去注册」 |
| `verifyemail` | `/verifyemail` | `verifyemail` | 租户 `metadata.email_verify=true` |
| `dashboard` | `/dashboard` | `dashboard` | 头底账户入口 |
| `cart` | `/cart` | `cart` | 底栏购物车。不要 `/shopcart` |
| `wishlist` | `/wishlist` | `wishlist` | 底栏愿望清单 |
| `checkout` | `/checkout` | `checkout` | 购物车结算。Stripe 成功/取消回**本页 query**，不要另开 `/checkout/return` |
| `subscriptioncheckout` | `/subscriptioncheckout` | `subscriptioncheckout` | 定价 CTA。不要 `subscription-checkout` |

内核写死、但不属于上表「功能页」：

| `page_code` | URL | 页面 type | 说明 |
|-------------|-----|-----------|------|
| `home` | `/` | `general` | 不要改成 `index` / `homepage` |
| `article` | `/article-{id}` | `postsingle` | 文章详情。不要用 `postsingle` 当页码 |
| `productsingle` | `/productsingle-{id}` | `productsingle` | 产品详情 |

列表页建议固定，页面 `type=list`：

| `page_code` | URL | 说明 |
|-------------|-----|------|
| `bloglist` | `/bloglist` | 文章列表 |
| `product` | `/product` | 产品**列表**（不是详情） |

`price`、`contact`、`privacy` 等展示页没有内核硬跳转，编码可自定，仍须字母数字。定价 CTA 默认去 `/subscriptioncheckout`，不是 `/price`。

---

## 4. 页面 `type`（四种）

出现在：页面表、索引 `web_pages.json` 每一项、详情 `web_pages/{page_code}.json` 的 `data.page`。

内核**只读页面表字段 `type`**。不要用 `page_code` 或页上挂了什么组件来猜布局。旧数据若只有 `metadata.page_type`，内核可当迁移值；**新页面必须显式传表字段**。

| `type` | 谁来渲染 | URL | 何时用 |
|--------|----------|-----|--------|
| `general` | 默认壳（首页 `index`） | `/{code}`，首页 `/` | 落地页、功能页、文档页。默认值 |
| `list` | 列表壳（筛选左、网格右） | `/{code}` | 文章/产品筛选+网格 |
| `postsingle` | 文章详情壳 | `/{code}-{id}` | 单篇文章 |
| `productsingle` | 产品详情壳 | `/{code}-{id}` | 单件产品（含交易） |

`list` / 详情填错：筛选左右栏不出现，或详情打不开。

### `general`

头 → 可选 pageheader → 正文按 `sort_order` → 底。适合 `home`、全部功能页、`price`、`contact`、`privacy`。首页也可挂 `post`、`pricing`（精简皮），仍是 `general`，不要标成 `list`。

### `list`

抽出本页的 `pageheader`、`listfilter`、`postlist`：宽屏筛选在左、列表在右；其余 body 组件排在这组下面。筛选+网格包在 `.gt6-list-main`，宽度用 `--list-max`。

必须挂：`listfilter` + `postlist`（可再挂 pageheader）。关联上给 `list_path`（通常 `/{page_code}`）。产品列表还要产品类 `article_type`、`path_url=/productsingle-{id}`。

不要把列表页标成 `productsingle`。

### `postsingle`

按 URL id 拉一篇文章，交给本页 `type=postsingle` 组件。文章字段覆盖页面 SEO 回退。

- 约定 `page_code=article`。
- 通常只挂一个 `postsingle` + pageheader（详情常藏 H1）。
- 关联下级另挂 `postchild`。
- 没挂对应组件时内核用该类型默认槽，皮仍来自组件库；库里没有就显示「没有可加载的模板」。

### `productsingle`

按 URL id 拉一件产品（必须是产品类 `article_type`），交给本页第一个 `productsingle` 槽。

- 约定 `page_code=productsingle`。
- 列表是 `page_code=product` + 页面 `type=list`。`/product-{id}` 不会当详情。
- 下级另挂 `postchild`。

---

## 5. 页面 metadata

`type` **不在** metadata。

| 字段 | 说明 |
|------|------|
| `title` / `description` / `keywords` | 主语言平铺，可选 |
| `seo.translations[]` | 每语言 `title` / `description` / `keywords`；`is_primary` 标主语言 |
| `header.translations[]` | 部分页把 SEO 写在 header 里，内核也会读 |
| `main_class` / `mainClass` | `<main>` class，可选 |

详情页 SEO 以文章/产品字段为准，页面 metadata 只是回退。

---

## 6. 关联顺序（建议）

| sort_order | 通常挂什么 |
|------------|------------|
| 1 | `layout` |
| 2 | `header` |
| 5 | `pageheader`（首页可省） |
| 10 | 本页主组件 |
| 11+ | 同页其它正文（如 listfilter 10、postlist 11；多个 static 递增） |
| 20 | `footer` |

`chrome` 与 `dashboardpanel` **不要**挂到页面。layout / header / footer / chrome 不进正文槽。

layout 加载：本页关联的 `type=layout` 优先 → 否则 `components_code=layout` → 再没有则不加载、不回退。

关联默许覆盖：多语言文案、数据 id、列表路径、是否显示某块。默认不要在关联里换 HTML/CSS。

---

## 7. 页面 vs 组件 type

| | 页面 | 组件 |
|--|------|------|
| 字段 | 页面表 `type` | 组件表 `type` |
| 例子 | `general` / `list` / `postsingle` / `productsingle` | `login` / `postlist` / `header` … |
| 作用 | 选页面壳 | 选区块实现 |

可以：`type=list` 的页面上挂 `type=postlist` 的组件。  
不可以：页面 `type=postsingle` 去渲染登录；也不可以 `page_code=login` 却把页面标成 `list`。

---

## 8. 入库清单

- [ ] `page_code` 字母数字；功能页用第 3 节固定名
- [ ] 表字段 `type` 为四者之一；不写进 metadata
- [ ] 页面 metadata 只有 SEO（和可选 `main_class`）
- [ ] 关联只有 code + sort + 少量实例字段
- [ ] `list` 页挂了 listfilter + postlist；详情页挂了对应 single（下级再挂 postchild）
- [ ] 写后等静态 JSON，`web_static_pages_get` 的 `data.page` 上有 `type`
