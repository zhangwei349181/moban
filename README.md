# GT6 CMS 的前端模板解析项目

本仓库是 **Astro 内核**：不负责在仓库里写死各站点的 HTML。它根据请求里的**租户**，去读该租户在 CMS 里配置的**页面**和**组件**，再按组件表字段 `type` 选渲染器，把 tenantdoc 上的皮（HTML/CSS/JS）拼成站点。

组件可跨页、跨租户复用，是因为大家遵守同一套 **type 契约**和同一套主题 token，不是零依赖。`components_code` 只是实例名，会变；内核**不靠名字**猜测类型。

---

## 依托环境

运行在 **Cloudflare Workers for Platforms**（Dispatch）。访问绑定到本项目的域名时，父 Worker 会在子请求上带上租户：

```
X-GT6-Tenant-Id: {租户 UUID}
```

本项目 `src/middleware.ts` 读取该头，写入 `locals.tenantId`，后续所有静态 JSON、皮文件都按这个租户取。

- 生产：必须有该请求头。页面一律 `prerender = false`，否则适配器会走静态 ASSETS，middleware 不执行，拿不到租户。
- 本地 / 头缺失：回退环境变量 `TENANT_ID`，再没有则用 `src/config/app.ts` 里的默认 UUID（参考库租户）。此时控制台会打警告。

部署：`npm run deploy`（`wrangler deploy --dispatch-namespace gy1225`）。

---

## 本项目通过访问路径来判断页面

路径只决定 **page_code**（以及详情页的内容 id）。用哪套页面壳，看该页在 CMS 里的表字段 **`type`**，不看路径字符串猜。

未知 `page_code`（不在该租户 `web_pages.json` 索引里）→ 404。

| 路径 | 入口 | 取出的 page_code | 要求的页面 type |
|------|------|------------------|-----------------|
| `/` | `src/pages/index.astro` | 固定 `home` | `general` |
| `/{page_code}` | `src/pages/[...slug].astro` | 路径第一段（仅字母数字） | `general` 或 `list` |
| `/{page_code}-{id}` | `src/pages/[prefix]-[id].astro` | `-` 前一段；id 为其后整段（UUID 可含 `-`） | `postsingle` 或 `productsingle` |

说明：

- `page_code` 仅字母数字，创建后不可改。不要连字符（`verifyemail` 对，`verify-email` 错）。
- `/{page_code}` 若对应页的 type 是详情类，直接 404，必须走 `/{page_code}-{id}`。
- 反之，详情入口若页 type 不是 `postsingle` / `productsingle`，也 404。

常用固定页码（内核或默认跳转写死，不要改名）：

| page_code | 路径 | 页面 type |
|-----------|------|-----------|
| `home` | `/` | `general` |
| `login` / `signup` / `verifyemail` | `/{code}` | `general` |
| `dashboard` / `cart` / `wishlist` / `checkout` / `subscriptioncheckout` | `/{code}` | `general` |
| `bloglist` | `/bloglist` | `list` |
| `product` | `/product`（产品**列表**） | `list` |
| `article` | `/article-{id}` | `postsingle` |
| `productsingle` | `/productsingle-{id}` | `productsingle` |

`product` 是列表，`productsingle` 才是产品详情。不要用 `/product-{id}`。

展示页（关于、联系、隐私等）没有硬跳转，编码可自定，但仍须字母数字，且必须出现在该租户页面索引里。

---

## 页面 type 与组件 type

两套枚举，不要混：

| | 页面 `type` | 组件 `type` |
|--|-------------|-------------|
| 作用 | 选页面壳 | 选区块渲染器 |
| 取值 | `general` / `list` / `postsingle` / `productsingle` | `layout`、`header`、`static`、`postlist`… 见 `skill/components.md` |
| 位置 | 页面表字段，禁止写入页面 metadata | 组件表字段，禁止写入组件 metadata |

`list` 页抽出 pageheader / listfilter / postlist：宽屏筛选在左、网格在右。`general` 按关联 `sort_order` 排正文。详情页把 URL 里的 id 交给对应 single 组件。

---

## 一页如何拼出来

1. 用路径得到 `page_code`，拉 `https://gt6json.shopasb.io/tenant_{租户id}/web_pages/{page_code}.json`。
2. 按关联列表（`sort_order` 升序）取组件；每条再读组件详情，用组件 **`type`** 选 Astro 实现。
3. 皮文件在 tenantdoc：`https://tenantdoc.gt6ai.xyz/{租户id}/website/{组件type}/{components_code}/{html\|css\|js\|media}/…`。
4. 关联 metadata 可覆盖本页文案、数据 id、`list_path` 等；默认不要在关联里再抄 `html_url` / `css_url`。
5. `layout` 只注入主题 CSS/JS，不进正文。`chrome`、`dashboardpanel` 不挂页面，写在壳 HTML 的 `{{code}}` 里。

建议关联顺序：layout 1 → header 2 → pageheader 5 → 主组件 10+ → footer 20。`sort_order` 默认 100，创建关联时必须显式传。

---

## 本地开发

```bash
npm install
npm run dev
```

无 Dispatch 头时会用 `.env` 的 `TENANT_ID` 或默认参考库租户。改内核后按 Cloudflare 流程 `npm run build` / `npm run deploy`。

上传皮、改 CMS 记录：生产环境用 Agent 的 `r2_upload` 与 `web_*` 工具。本机脚本 `npm run upload` / `npm run cms` 仅供仓库维护，不要当作站点运行时的一部分。

---

## 相关文档

| 文档 | 内容 |
|------|------|
| `skill/SKILL.md` | 给改站 Agent 的入口（客户已复制模板后，只改当前租户的页面和组件） |
| `skill/pages.md` | 页面契约 |
| `skill/components.md` | 组件 type 总表 |
| `skill/assets.md` | 皮文件放置与调用 |
| `skill/types/{type}.md` | 单个组件类型：功能 / 用法 / 案例 / 注意 |
| `docs/流程与步骤.md` | 内核与契约的实施记录 |
