# 页面契约

Skill 可读的**页面**契约。做站点路由、SEO、页面↔组件关联时读本文。组件怎么渲染见 [流程与步骤.md](./流程与步骤.md) 与 [契约-组件类型](./契约-组件类型/)。

页面不是组件：页面不带 HTML/CSS/JS，只决定 **URL、SEO、走哪套页面布局、挂哪些组件**。

---

## 0. 读本文的 Agent 环境（先读）

假定你**已经具备** CMS 工具，鉴权与当前租户由工具处理。可直接创建、读取、更新、删除 **页面** 以及 **页面↔组件关联**。更新 metadata 是**整份替换**（先读后写）。

`type` 是页面表的**独立字段**，与 `page_code`、`metadata` 并列。创建/更新时**显式传** `type`。不要写进 `metadata`。

---

## 1. 页面的功能和设定

### 1.1 页面负责什么

| 项 | 说明 |
|----|------|
| 身份 | `page_code`：租户内唯一，决定 URL |
| 布局分流 | `type`：决定用哪套页面壳（见第 3 节） |
| SEO | `metadata` 里的 title / description / keywords（可多语言） |
| 挂载 | 页面↔组件关联：`component_id` + `sort_order` + 可选本页覆盖 |
| 可选框架 | `metadata.main_class` 等只影响 `<main>` class，不是正文 |

内核按 `page_code` 拉 `web_pages/{page_code}.json`，再按关联渲染组件。正文**只来自关联组件**。

### 1.2 页面不负责什么

| 禁止 | 改去哪 |
|------|--------|
| 组件 HTML / CSS / JS | 改组件记录，或换一个组件挂上 |
| `content` / `content_en` / `markdowncode` / `htmlcode` | 挂 `type=markdown` 或其它内容组件 |
| 在页面 metadata 里再写一份 `html_url` / `css_url` | 同上 |
| 用页面 metadata 的 `type` 表示组件类型或页面类型 | 页面 `type` 是表字段；组件 `type` 在组件记录上 |

### 1.3 三层怎么分

| 层 | 只允许有 | 不允许有 |
|----|----------|----------|
| 组件 | 组件 `type`、默认皮、该类型默认行为 | 页面 URL、整页 SEO |
| 关联 | `sort_order`、本页实例覆盖（文案、`article_id`、`list_path`、`template_id` 等） | 再抄一份皮 URL（除非本页明确换皮） |
| 页面 | `page_code`、页面 `type`、SEO、可选 `main_class` | 组件皮；不要在页面里「发明」一个组件 |

关联默许覆盖：多语言文案、数据 id、列表路径、是否显示某块。默认不要在关联里换 HTML/CSS。

### 1.4 `page_code` 与 URL

`page_code` 仅字母数字：`^[a-zA-Z0-9]+$`。**不要**连字符：`verifyemail` 对，`verify-email` 错。

| 页面 type | URL | 例子 |
|-----------|-----|------|
| `general` / `list` | `/{page_code}` | `/login`、`/bloglist`、`/product` |
| `postsingle` / `productsingle` | `/{page_code}-{文章或产品id}` | `/article-{id}`、`/productsingle-{id}` |
| 首页特例 | `/` | `page_code` 必须是 `home`，不是 `/home` |

首页由内核固定读 `home`。其它页必须出现在页面索引 `web_pages.json` 里，未知 `page_code` 404。

### 1.5 关联顺序（建议）

| sort_order | 通常挂什么 |
|------------|------------|
| 1 | `type=layout` 主题（theme01） |
| 2 | `type=header` 头 |
| 5 | `type=pageheader` 内页页头（首页可省略） |
| 10 | 本页主组件（form / login / postlist / postsingle …） |
| 20 | `type=footer` 底 |

`type=chrome` 子块和 `type=dashboardpanel` **不要**挂到页面，写在壳 HTML 的 `{{code}}` 里。layout / header / footer / chrome 不进正文槽。

layout 加载仍按流程 1.1：本页关联的 `type=layout` 优先，否则 `components_code=layout`，再没有则不加载、不回退。

---

## 2. 必须固定编码的页面

下列页码被内核、组件默认 URL、头底入口写死。改名会导致登录回跳、购物车结算、订阅支付、邮件验证对不上。

创建时 **`page_code` 必须用表中这一列**，`type` 一律 `general`。组件 `checkout_url` / `login_url` / `success_url` 等默认值也指向这些路径。

| `page_code` | URL | 主组件 type | 谁会跳过来 |
|-------------|-----|-------------|------------|
| `login` | `/login` | `login` | 结账 / 会员中心未登录、`?return=` 回跳 |
| `signup` | `/signup` | `signup` | 登录页「去注册」 |
| `verifyemail` | `/verifyemail` | `verifyemail` | 租户 `metadata.email_verify=true` 时，登录/注册成功后 |
| `dashboard` | `/dashboard` | `dashboard` | 头底账户入口；未登录去 `/login?return=/dashboard` |
| `cart` | `/cart` | `cart` | 底栏购物车、「去购物车」。不要 `/shopcart` |
| `wishlist` | `/wishlist` | `wishlist` | 底栏愿望清单 |
| `checkout` | `/checkout` | `checkout` | 购物车结算。Stripe 成功/取消回 **本页 query**，不要另开 `/checkout/return` |
| `subscriptioncheckout` | `/subscriptioncheckout` | `subscriptioncheckout` | 定价组件订阅 CTA。不要 `subscription-checkout` |

另外两个**内核写死、但不属于上表「功能页」**的编码也要固定：

| `page_code` | URL | 页面 type | 说明 |
|-------------|-----|-----------|------|
| `home` | `/` | `general` | 首页。不要改成 `index` / `homepage` |
| `article` | `/article-{id}` | `postsingle` | 文章详情。列表 `path_url` 默认指向它 |
| `productsingle` | `/productsingle-{id}` | `productsingle` | 产品详情。列表页是 `product`（`/product`），不要用 `/product-{id}` |

列表页建议固定（导航和筛选回跳常用），`type=list`：

| `page_code` | URL | 说明 |
|-------------|-----|------|
| `bloglist` | `/bloglist` | 文章列表 |
| `product` | `/product` | 产品列表（这是列表页，**不是**产品详情） |

`price`、`contact`、`privacy` 等展示页**没有**内核硬跳转，编码可自定，但仍须字母数字。定价 CTA 默认去 `/subscriptioncheckout`，不是 `/price`。

---

## 3. 页面 `type`

与组件 `type` 一样：是**表字段**，会出现在：

1. 页面表
2. 静态索引 `tenant_{id}/web_pages.json` 的每一项
3. 静态详情 `tenant_{id}/web_pages/{page_code}.json` 的 `data.page`

**不要**写在 `metadata` 里。旧数据若只有 `metadata.page_type`，内核可把它当成 `type` 的迁移值；**新页面必须显式传表字段 `type`**。

### 3.1 枚举（四种）

| `type` | 谁来渲染 | URL 形态 | 何时用 |
|--------|----------|----------|--------|
| `general` | `[...slug].astro` 默认壳（首页则 `index.astro`） | `/{page_code}`，首页 `/` | 落地页、功能页、文档页。默认值 |
| `list` | [`ListPageLayout.astro`](../src/components/page/ListPageLayout.astro) | `/{page_code}` | 文章/产品等筛选+网格列表 |
| `postsingle` | [`ArticleDetailPage.astro`](../src/components/page/ArticleDetailPage.astro) | `/{page_code}-{id}` | 单篇文章详情 |
| `productsingle` | [`ProductSingleDetailPage.astro`](../src/components/page/ProductSingleDetailPage.astro) | `/{page_code}-{id}` | 单件产品详情（含交易） |

漏传 `type` 视为 `general`。`list` / 详情 type 填错会导致筛选左右栏不出现，或详情打不开。

内核分流：**只读页面 `type`**。不要用 `page_code` 名字、也不要靠页上挂了什么组件来猜布局。表字段为空时，才把 `metadata.page_type` 当成迁移值。

`/{page_code}`（无 id）遇到 `postsingle` / `productsingle` 会 404，必须走 `/{page_code}-{id}`。

### 3.2 `general`

普通页：头 → 可选 pageheader → 正文关联组件（按 `sort_order`）→ 底。

适合：`home`、第 2 节全部功能页、`price`、`contact`、`privacy`、关于我们等。

首页也可以挂 `post`、`pricing`（精简皮）等区块，仍是 `general`，不要标成 `list`。

### 3.3 `list` → ListPageLayout

把本页的 `pageheader`、`listfilter`、`postlist` **抽出来**：宽屏下筛选在左、列表在右；其余 body 组件仍按顺序排在这组下面。筛选+网格包在 `.gt6-list-main` 里，`max-width` 用 `--list-max`（不要用 `--page-max` / `--content-max`）。

必须挂：`listfilter` + `postlist`（可再挂 pageheader）。关联上给 `list_path`（通常 `/{page_code}`），产品列表还要 `article_type`、`path_url=/productsingle-{id}`。

不要把列表页标成 `productsingle`。`page_code=product` 是列表，`page_code=productsingle` 才是详情。

### 3.4 `postsingle` → ArticleDetailPage

按 URL 里的 id 拉**一篇文章**，把 id 交给本页的 `type=postsingle` 组件。真正的 title/description 由该篇文章覆盖页面 SEO 回退。

- 约定 `page_code=article`（URL `/article-{id}`）。不要用 `postsingle` 当页码，以免和组件 type 混名。
- 一页通常只挂一个 `postsingle` 组件 + pageheader（详情页 header 常藏 H1）。
- 关联下级（关联文章/产品）另挂 `type=postchild`，见 [契约-组件类型/postchild.md](./契约-组件类型/postchild.md)。
- 页上没挂 `postsingle` / `pageheader` 时，内核用该类型默认槽位，但皮仍来自组件库；库里没有对应组件就会「没有可加载的模板」。

### 3.5 `productsingle` → ProductSingleDetailPage

按 URL 里的 id 拉**一件产品**（`article_type` 必须是产品类），交给本页的 `type=productsingle` 组件。一页只渲染**第一个** `productsingle` 槽。

- 约定 `page_code=productsingle`（URL `/productsingle-{id}`）。
- 列表页 `page_code=product` 的 type 是 `list`，`/product-{id}` **不会**再当产品详情。
- 关联下级另挂 `type=postchild`（可用 `article_type` 分成关联文章 / 关联产品）。

---

## 4. metadata（页面上只留这些）

`type` **不在** metadata。

| 字段 | 说明 |
|------|------|
| `title` / `description` / `keywords` | 主语言平铺，可选 |
| `seo.translations[]` | 每语言 `title` / `description` / `keywords`；`is_primary` 标主语言 |
| `header.translations[]` | 部分页把 SEO 写在 header 里，内核也会读 |
| `main_class` / `mainClass` | `<main>` class，可选 |

详情页的 SEO 以文章/产品字段为准，页面 metadata 只是回退。

---

## 5. 静态 JSON（加上 `type` 之后）

索引 `web_pages.json` 每一项：

```json
{
  "id": "uuid",
  "page_code": "login",
  "type": "general",
  "created_at": "2026-08-30T00:00:00Z"
}
```

详情 `web_pages/login.json` 的 `data.page`：

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "page_code": "login",
  "type": "general",
  "metadata": {
    "title": "Log in",
    "seo": {
      "translations": [
        { "is_primary": true, "language_code": "en", "title": "Log in" },
        { "language_code": "zh-CN", "title": "登录" }
      ]
    }
  },
  "created_at": "...",
  "updated_at": "..."
}
```

`data.components[]` 仍是关联列表（`component_id`、`components_code`、`sort_order`、关联 `metadata`），**没有**页面 type。

---

## 6. 和组件 type 不要混

| | 页面 | 组件 |
|--|------|------|
| 字段 | 页面表 `type` | 组件表 `type` |
| 例子 | `general` / `list` / `postsingle` / `productsingle` | `login` / `postlist` / `postsingle` / `header` … |
| 作用 | 选页面壳 | 选区块实现 |

可以：`type=list` 的页面上挂 `type=postlist` 的组件。  
不可以：用页面 `type=postsingle` 去渲染登录；也不可以靠 `page_code=login` 却把页面标成 `list`。

---

## 7. 入库清单

- [ ] `page_code` 字母数字；功能页用第 2 节固定名
- [ ] 表字段 `type` 为四者之一；不写进 metadata
- [ ] 页面 metadata 只有 SEO（和可选 `main_class`），没有正文、没有皮 URL
- [ ] 关联只有 code + sort + 少量实例字段
- [ ] `list` 页挂了 listfilter + postlist；详情页挂了对应 single 组件（关联下级再挂 `postchild`）
- [ ] 索引 JSON 与详情 JSON 的 `page` 上都有 `type`
