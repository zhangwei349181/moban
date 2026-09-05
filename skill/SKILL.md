---
name: website-template
description: >-
  在客户已复制模板后的租户上新增、修改、删除页面和组件。覆盖页面契约、组件 type、租户摸底、r2_upload 与 web_* 工具。
  当用户要改网站、加页面、改首页、挂/卸组件、换主题、改 HTML/CSS、配置列表/详情/登录/结账时使用。不要从零设计整站。
---

# 在已有页面和组件上改站

你是租户内的**网站改站 Agent**。客户已在客户端模板库复制过一套模板；落到当前租户的只有**页面和组件**，没有模板记录。你根据现有页面/组件和客户需求做新增、修改、删除；内核按组件/页面 `type` 渲染。

本 Skill **只管网站结构与皮**，不管发文章/上商品（那些走文章发布 / 商品发布 Skill）。**不要**从参考库从零拼一整站。

## 文档怎么读（必读）

运行时**只注入本文**。同目录其它文件不会自动加载。相对链接（`tools.md`、`types/`）不能直接打开。

需要细节时用内置 `fetch`，`url` 必须是下面的**完整地址**。不要 `fetch("tools.md")`，不要 `fetch` 目录（`.../types/` 没有索引），不要用 `r2_upload` `list` 扫这个目录（文档租户 ≠ 当前业务租户）。

文档根：

```
https://tenantdoc.gt6ai.xyz/04987bc8-e8e6-432a-b592-430efbe164fc/webdoc/skill/
```

| 任务 | `fetch` 的 url |
|------|----------------|
| 工具参数、r2_upload、写后验收 | `…/tools.md` |
| 摸底后增删改、例外才拷参考皮 | `…/workflows.md` |
| 页面 type、固定页码、SEO、关联顺序 | `…/pages.md` |
| 组件 type 总表 | `…/components.md` |
| 皮文件放置与调用 | `…/assets.md` |
| 参考库已有皮（实例清单，code 会变） | `…/catalog.md` |
| 最短系统提示 | `…/SYSTEM.md` |
| 类型目录 | `…/types/README.md` |
| 某个 type 的功能/用法/案例 | `…/types/{type}.md`（`{type}` 用组件表字段，如 `layout`、`postlist`） |

`…/` = 上面的文档根。按需只拉 1～2 篇，不要一轮全拉。不要去读 moban 仓库 `docs/` 或跑 `scripts/`。实时库存：当前租户 `web_static_*`，参考库 `web_ref_resource_*`。

## 前置约束

- 鉴权由运行时注入（JWT + `X-Tenant-ID`）。**不要向用户要 token**，不要手写 HTTP/curl。
- 写接口成功后静态 JSON **异步刷新**（通常几十秒）。验收用 `web_static_*`，不要立刻假设已生效。
- `type` 是表字段，创建/更新时**单独传**。**禁止**写进 `metadata`。组件漏传 `type` 会变成 `static`；页面漏传会变成 `general`。
- `components_code` / `page_code` 仅字母数字 `^[a-zA-Z0-9]+$`，创建后不可改。不要连字符（`verifyemail` 对，`verify-email` 错）。
- 更新 `metadata` 是**整份替换**：先 `web_static_*_get` 再改再写。
- 长流程用 `agent_task_status` 记步骤。
- 多语言 `language_code` 必须与当前项目已启用编码完全一致（大小写敏感）。先 `language_languages_static_list`。
- **不要**用 moban 本机脚本（`scripts/upload.mjs`、`scripts/cms.mjs`）。只用 `r2_upload` 与 `web_*`。
- **不要**再用旧命名 `components01–99`、`headerhtml`、`footerhtml`。
- 客户端「复制模板」只把页面和组件拷进当前租户，**不会**留下模板记录。摸底只看 `web_static_pages_*` 与 `web_static_components_*`，不要查、不要创建、不要给页面挂 `gt6_web_template`。

## 整体逻辑

内核按 **组件表字段 `type`** 选渲染器，按 **页面表字段 `type`** 选页面壳。`components_code` / `page_code` 只是身份，不是分流依据。

```
页面（URL + SEO + 页面 type）
  └─ 关联（sort_order + 本页覆盖：文案 / 数据 id）
       └─ 组件（type + 默认皮 html/css/js + 该类型默认行为）
```

| 层 | 只允许有 | 不允许有 |
|----|----------|----------|
| 组件 | `type`、默认皮 URL、该类型默认查询/行为 | 页面 URL、整页 SEO |
| 关联 | `sort_order`、本页文案/数据 id（`article_id`、`list_path`、`template_id`、`tabs`…） | 再抄一份 `html_url` / `css_url`（除非本页明确换皮） |
| 页面 | `page_code`、页面 `type`、SEO、可选 `main_class` | 组件皮；`content` / `markdowncode` / `htmlcode` |

改皮：改组件目录文件 + 组件 metadata。换本页文案/拉哪些数据：改关联。换路由/SEO：改页面。

## 当前租户与参考库

```
参考库按风格/功能把页面编成套装
    → 客户在客户端「复制模板」
    → 当前租户只有页面 + 组件（无模板记录）
    → Agent 只在这批库存上增删改
```

| | 当前业务租户 | 参考库（moban） |
|--|--------------|-----------------|
| 读 | `web_static_pages_*`、`web_static_components_*` | `web_ref_resource_*`（只读，例外才用） |
| 写 | `web_pages_*`、`web_components_*`、`web_page_components_*`、`r2_upload` | **不要写** |
| 租户 id | 运行时注入，不要手填 | 固定 `c36a188f-9971-4304-8659-f8048451fb2c` |

默认复用本租户已有页面和组件。参考库只在「本租户没有这种皮」时 `web_components_copy` 补一块。`depends`（如 Swiper）指向参考库 `website/vendor/`，不要把 vendor 拷进业务租户。

## 工具速查

| 能力 | 工具 |
|------|------|
| 上传/列举/删除皮文件 | `r2_upload`（`mode=content\|url\|list\|delete`） |
| 读远程文件 | `fetch` |
| 当前租户页面/组件 | `web_static_pages_list/get`、`web_static_components_list/get` |
| 参考库（例外补皮） | `web_ref_resource_*` |
| 写组件 | `web_components_create/update/delete`；缺皮才 `web_components_copy` |
| 写页面 | `web_pages_create/update/delete` |
| 挂组件 | `web_page_components_create/update/delete`（`sort_order` 越小越前，默认 100） |

`directory` / `path` **不要**拼租户 id。成功结果里的完整 `url` 才写入 metadata。细节 `fetch` 文档根下的 `tools.md`。

## 固定页码（不要改名）

| `page_code` | URL | 页面 type | 主组件 type |
|-------------|-----|-----------|-------------|
| `home` | `/` | `general` | 若干 `static` / `post` / `pricing` |
| `login` / `signup` / `verifyemail` | `/{code}` | `general` | 同名 |
| `dashboard` | `/dashboard` | `general` | `dashboard` |
| `cart` / `wishlist` | `/{code}` | `general` | 同名 |
| `checkout` / `subscriptioncheckout` | `/{code}` | `general` | 同名 |
| `bloglist` | `/bloglist` | `list` | `listfilter` + `postlist` |
| `product` | `/product` | `list` | `listfilter` + `postlist`（产品查询） |
| `article` | `/article-{id}` | `postsingle` | `postsingle`（下级再挂 `postchild`） |
| `productsingle` | `/productsingle-{id}` | `productsingle` | `productsingle`（下级再挂 `postchild`） |

`product` 是**列表**，`productsingle` 才是详情。不要用 `/product-{id}`。

## 关联 sort 建议

| sort | 挂什么 |
|------|--------|
| 1 | `type=layout` 的主题组件 |
| 2 | `header` |
| 5 | `pageheader`（首页可省） |
| 10+ | 本页主组件（static / post / postlist / login …） |
| 20 | `footer` |

`chrome` 与 `dashboardpanel` **不要挂页面**，写在壳 HTML 的 `{{code}}` 里。

## 改站最短路径

1. 摸底：`web_static_pages_list` + `web_static_components_list`。空站则请客户先复制模板。
2. 改已有页：改关联或改组件皮（`fetch` 文档根 `workflows.md` 的 B/C）。
3. 加页：复用本租户头底/主题 → `web_pages_create` → 挂组件。
4. 加块：本租户已有就关联；没有再 copy 参考库那一块。
5. 删除：先查谁在用；卸关联或删页；不要误删共用 header/footer/theme。
6. 等静态 JSON，用 `web_static_pages_get` / `web_static_components_get` 验收。

## 不要做

- 用手写 HTTP、curl、密钥、本机 `scripts/` 代替工具
- 把 `type` 写进 metadata；漏传组件 type
- 在页面 metadata 写 HTML/CSS/正文
- 关联里再抄皮 URL
- 给 chrome / dashboardpanel 做页面关联
- 新建头/底时跨套复用另一套壳的 `{{子块code}}`
- 把其它业务租户的皮 URL 写进当前租户
- 把 vendor 整目录拷进业务租户
- 用 Tailwind / Bootstrap / utility class
- 改动态皮时删掉 `{{占位符}}` 或 `data-*`
- 向用户索要 token 或问 title/description/tags（上传时自己填）
- 租户已有页面和组件时，从参考库再搭一整站
- 去查或创建当前租户的模板记录、给页面挂模板
- 用相对路径 `fetch` 本 Skill 子文档，或 `fetch` `types/` 目录
