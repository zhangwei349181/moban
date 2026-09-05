# 组件总则

内核用组件表字段 **`type`** 选渲染器。`components_code` 只是实例 ID，可以是任意合法字母数字，**不是**分流依据。不要靠名字猜测类型。

读详文必须用内置 `fetch`，`url` 为**完整地址**。不要 `fetch("types/layout.md")`，不要 `fetch` 目录。

```
https://tenantdoc.gt6ai.xyz/04987bc8-e8e6-432a-b592-430efbe164fc/webdoc/skill/
```

| 要读什么 | 路径 |
|----------|------|
| 文件放哪、内核怎么加载 CSS/JS | `assets.md` |
| 某个 type 的功能 / 用法 / 案例 / 注意 | `types/{type}.md`（`{type}` 用下表第一列） |
| 类型目录 | `types/README.md` |

只拉当前任务需要的 1～2 篇。

写组件：`web_components_create/update/delete`、`web_components_copy`。读当前租户：`web_static_components_list/get`。读参考库：`web_ref_resource_components_list/get`。

创建时**显式传** `type`。漏传服务端默认 `static`，动态组件会变成死皮（占位符原样输出）。

---

## 功能

组件负责：**默认皮**（HTML/CSS/JS URL）和**该类型的默认行为**（查询条件、表单模板 id 等）。

组件不负责：页面 URL、整页 SEO。那些在页面上。本页只换文案或数据 id 时改**关联**，不要改组件、也不要在关联里再抄一份皮 URL。

---

## 使用方法

### 身份

| 项 | 规则 |
|----|------|
| `type` | 表字段，下表枚举之一。**禁止**写入 metadata |
| `components_code` | 仅 `^[a-zA-Z0-9]+$`，租户内唯一，创建后不可改。不要连字符 |
| 目录名 / 根 class | 与 code 相同；子元素 BEM：`.{code}__title` |
| `parent_id` | 壳的子块挂到本套壳 id，便于整套复制；**渲染不靠** parent，只靠壳 HTML 的 `{{code}}` |

### type 清单

| type | 进正文？ | 功能（何时用） | 详文 |
|------|----------|----------------|------|
| `layout` | 否 | 主题 token，注入 CSS/JS | `types/layout.md` |
| `header` | 头槽 | 全站头部壳 | `types/header.md` |
| `footer` | 底槽 | 全站底部壳 | `types/footer.md` |
| `chrome` | 否 | 头/底里的 logo、导航等子块。**不要挂页面** | `types/chrome.md` |
| `static` | 是 | 无 API 数据的展示区块 | `types/static.md` |
| `post` | 是 | 首页/落地页文章或产品预览 | `types/post.md` |
| `postchild` | 是 | 详情页当前条目的下级 | `types/postchild.md` |
| `postlist` | 是 | 列表页网格。须挂 `list` 页 | `types/postlist.md` |
| `listfilter` | 是 | 与 postlist 同页的筛选 | `types/listfilter.md` |
| `pageheader` | 是 | 内页面包屑/标题 | `types/pageheader.md` |
| `postsingle` | 是 | 文章详情。须挂 `postsingle` 页 | `types/postsingle.md` |
| `productsingle` | 是 | 产品详情+交易。须挂 `productsingle` 页 | `types/productsingle.md` |
| `markdown` | 是 | 远程 Markdown 长文 | `types/markdown.md` |
| `form` | 是 | 后台模板驱动的表单 | `types/form.md` |
| `pricing` | 是 | 订阅套餐 | `types/pricing.md` |
| `login` | 是 | 登录页 | `types/login.md` |
| `signup` | 是 | 注册页 | `types/signup.md` |
| `verifyemail` | 是 | 邮箱验证页 | `types/verifyemail.md` |
| `dashboard` | 是 | 会员中心壳 | `types/dashboard.md` |
| `dashboardpanel` | 否 | 会员中心子块。**不要挂页面** | `types/dashboardpanel.md` |
| `cart` | 是 | 购物车 | `types/cart.md` |
| `wishlist` | 是 | 愿望清单 | `types/wishlist.md` |
| `checkout` | 是 | 一次性结账 | `types/checkout.md` |
| `subscriptioncheckout` | 是 | 订阅结账 | `types/subscriptioncheckout.md` |

### 公共 metadata（禁止 `type`）

皮 URL 的写法见 `assets.md`。业务字段见各 type 文档，不要在 `static` 上发明 `article_type` / `tabs`。

| 字段 | 含义 |
|------|------|
| `bare` | `true` 时全宽、少一层包裹。头底/根为 section 时常开 |
| `translations[]` | 按 `language_code` 分发 `html_url` / `css_url` / 可选 `init_script_url` / `md_url` |
| `html_url` / `html` | 有皮的类型必填 |
| `css_url` / `css_urls` | 有样式时必填。内核没有全局 `.btn` |
| `init_script_url` | 区块级 init |
| `global_js` | 文档级脚本 URL 数组 |
| `depends` | 共享库 id，如 `["swiper"]` |
| `use_platform_ui` | 有自定义 init 时默认不再跑平台 UI，除非显式 `true` |
| `header` / `cta` | 区块标题、「更多」链接；可带 `translations[]` |

### 复制

本租户没有某种皮时，才 `web_components_copy`（参考库组件 UUID）。会复制记录、`parent_id` 子树、`website/{type}/{code}/` 文件，并把 tenantdoc URL 改成当前租户。编码冲突时自动加后缀。`depends` 仍指向参考库 vendor。

壳类型必须整套复制（壳 + 其子块）。不要只拷壳再去引用另一套子块的 `{{code}}`。

---

## 使用案例

**改现有页上某区块的查询或文案。** 先 `web_static_pages_get`，改关联 metadata，不改组件 type，不换皮 URL。

**租户已有同 type 的组件，只要再挂一页。** `web_page_components_create`，显式 `sort_order`，复用已有组件 id。

**本租户没有该 type。** `web_ref_resource_components_list` 按 **type** 找（不要按某个历史 code 名死磕）→ `web_components_copy` → 再挂页。

---

## 注意细节

- `type` 固定，`components_code` 不固定。文档和决策按 type，不要假设库里永远叫某一个名字。
- 漏传组件 `type` 会变成 `static`。
- metadata 整份替换：先 get 再写。
- `chrome` / `dashboardpanel` 不要做页面关联。
- 动态类型改皮必须留下 `{{占位符}}` 与规定的 `data-*`。
