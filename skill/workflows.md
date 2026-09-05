# 工作流

长流程用 `agent_task_status` 记步骤。每步写完后等静态 JSON 再读，不要连写连验。

---

## 前提：客户已经复制过模板

参考库（moban）里按风格和功能把页面编成不同套装。客户端有模板库；客户会先**复制一套模板**到自己的租户。

复制落到当前租户的**只有页面和组件**（以及页面↔组件关联）。**不会**写入模板记录，也**没有**页面↔模板关联。因此不要去查 `web_static_templates_*`，不要读页面上的 `templates[]`，也不要 `web_page_templates_*`。

Agent **不是**从零设计一个站，也 **不要**默认从参考库再拼一整站。默认工作是：

1. 摸清**当前租户**已有的页面和组件
2. 按客户需求做 **新增 / 修改 / 删除**
3. 只有「租户里没有这种皮、客户明确要加」时，才从参考库 `web_components_copy` **补一块**

若摸底发现几乎没有页面：先告诉客户去客户端模板库复制一套，**不要**替他从参考库搭整站。除非客户明确说「不要用模板库、请按参考组件现拼」。

---

## A. 每次任务先摸底（必做）

只看当前项目的页面和组件，再动手。

```
1. language_languages_static_list
2. web_static_pages_list
3. 对客户点名的页（或相关页）web_static_pages_get
   → data.page.type、SEO
   → data.components[]（code、sort、关联 metadata）
4. web_static_components_list
   → 已有 type / code；头底看 parent_id 子树
```

对照客户需求，归到下面一类再执行：

| 客户意图 | 走 |
|----------|----|
| 改文案、换区块、改 SEO、改查询 | B |
| 改样子（HTML/CSS/图） | C |
| 加一页 | D |
| 已有页上加一块 | E |
| 去掉一页或一块、删组件 | F |
| 租户缺某种皮 | G |

动手前向客户确认要动哪些 `page_code`。全站共用的 header/footer/theme 一改会影响到所有挂了它们的页。

---

## B. 改已有页的结构或文案（不改皮）

租户里的页已经挂好了，优先改关联，不要新建一套平行页。

1. `web_static_pages_get` 看现有关联。
2. 换区块：`web_page_components_delete` 旧的，再 `create`（**显式 sort**，对齐相邻区块）。新组件优先用**本租户已有**的同 type。
3. 改本页文案/数据 id：`web_page_components_update`，先读关联 metadata 再整份写回。
4. 不要在关联里抄 `html_url` / `css_url`。
5. 改 SEO：`web_pages_update`（先读页面 metadata）。
6. 不要改固定功能页的 `page_code`。不要给 chrome / dashboardpanel 做页面关联。

---

## C. 改某个已有组件的皮

改的是**当前租户**这份皮（复制模板时已经落到本租户目录），不是去改参考库。

1. `web_static_components_get` 拿到完整 metadata 与当前 URL。
2. `r2_upload` `mode=list` 看目录；`fetch` 现有 HTML/CSS。
3. 动态类型：保留全部 `{{占位符}}` 与 `data-*`。static 可改结构和文案。
4. `r2_upload` `mode=content` 覆盖或新文件。`directory=website/{type}/{code}/{html|css|js|media}`。
5. 同一文件名必须 bump `?v=`。
6. `web_components_update`：**整份** metadata，只改对应 translations URL。不要丢其它语言、不要写入 `type`。
7. `web_static_components_get` + `fetch` 新 URL，确认 MIME 与内容。

全站共用的 layout / header / footer 一改会影响到**所有挂了它们的页**。只想动一页时：换该页关联到另一份同 type 组件，或只改关联文案，不要直接改共用壳。

---

## D. 新增一页

1. 定 `page_code`（功能页必须用固定名）和页面 `type`（见 [pages.md](pages.md)）。
2. `web_static_pages_list` 确认不存在；已有则走 B，不要再造一个平行页。
3. `web_pages_create`：`page_code`、`type`、SEO metadata。
4. 组件**复用本租户已有的**：layout、header、footer、pageheader 与现有页同一套，不要再 copy 一套头底。
5. 主组件：本租户已有同 type 就复用（或先 copy 本租户那份再改皮）；没有再走 G。
6. `web_page_components_create`，**显式 sort_order**：

```
layout 1 → header 2 → pageheader 5 → 主组件 10 → footer 20
```

列表页再挂 listfilter `10`、postlist `11`，关联写 `list_path` / `article_type` / `path_url`。
7. `web_static_pages_get` 验收：组件与 sort 齐全。不要去挂模板。

---

## E. 已有页上新增一块

1. `web_static_pages_get` 看现有 sort，新块插在 header 与 footer 之间（常见 11、12…）。
2. 本租户已有合适的 `static` / `post` / `pricing` 就直接关联；只换本页文案用关联 metadata。
3. 没有才走 G 或 `web_components_create`（显式 `type`）。
4. 不要为这一块再挂一套 layout/header/footer。

---

## F. 删除页面、卸掉区块、删除组件

先查谁在用，再删。共用壳（theme / header / footer）删了会搞垮其它页。

**只要这页不要某区块（组件留给别的页）：**

1. `web_page_components_delete`
2. 不要删组件本身，除非确认没有任何页面再关联

**整页不要了：**

1. 确认不是客户仍需要的固定功能页（`login`、`checkout`、`home`…）。这类必须客户明确说删。
2. `web_pages_delete`（页面-组件关联随页走）
3. 仅被这一页使用的正文组件，客户要求清掉时再 `web_components_delete`
4. 不要顺手删 header/footer/theme/chrome

**删组件：**

1. `web_static_pages_list` + 各页 get，确认无关联
2. chrome / dashboardpanel：改壳 HTML 的 `{{code}}` 或整套换壳，不要只删子块留下空占位
3. `web_components_delete`（子树可能级联）

---

## G. 从参考库补一块皮（例外）

仅当本租户没有可用的该 type（或客户点名参考库某个 code）。

1. `web_static_components_list` 再确认一次没有。
2. `web_ref_resource_components_list/get` 找到目标。
3. header/footer/dashboard：**拷壳**（含子树）。不要只拷一个 chrome。租户已有头时不要无故再拷一整套新头，除非客户要换头。
4. `web_components_copy`（`componentId` = 参考库 id）。
5. 等静态 JSON。抽查 URL 已换成当前租户。
6. 挂到目标页（或先改皮再挂）。本页文案用关联覆盖。

编码冲突会得到带后缀的新 code。页面关联用**新** id。壳 HTML 里的 `{{子块code}}` 随拷贝改过；若你随后改了子块 code，必须同步改壳 HTML。

`depends` 仍指向参考库 vendor，不要把 vendor 拷进业务租户。

---

## H. 换主题或换头底

优先改**租户里已有的** `type=layout` / `header` / `footer` 组件，或把部分页的关联换成租户里另一套已有壳。

- 只改 token **值**，不改变量名，不加 `.btn`。
- 列表页可用另一份 layout（例如更宽的 `--list-max`），不要往普通主题里堆列表 class。
- 不要往 layout 里堆 Hero/头底 class。
- 新建一整套头（新壳 + 本套专用 chrome，禁止跨套 `{{code}}`）只在客户明确要「另一套头」且租户没有时才做。

---

## I. 列表页与详情页配套

先看租户是否已经有这些页（复制模板时通常已有）。有则只改关联查询；没有再按 D 补。

文章：

| 页 | 页面 type | 关联要点 |
|----|-----------|----------|
| `bloglist` | `list` | listfilter + postlist：`article_type` 文章类，`list_path=/bloglist`，`path_url=/article-{id}` |
| `article` | `postsingle` | postsingle：`list_path=/bloglist`；可选 postchild |

产品：

| 页 | 页面 type | 关联要点 |
|----|-----------|----------|
| `product` | `list` | listfilter + postlist：产品类 `article_type`，`list_path=/product`，`path_url=/productsingle-{id}`，打开属性/价格筛选 |
| `productsingle` | `productsingle` | productsingle：`list_path=/product`；可选 postchild |

`post`（首页预览）不要当成整页列表。`postchild` 不要当成全站搜索。

---

## J. 常见失败

| 现象 | 原因 |
|------|------|
| 租户已有完整站还去参考库拼一整套 | 没先摸底，把 Agent 当成从零建站 |
| 去查模板列表 / 给新页挂模板 | 复制后租户没有模板记录，只看页面和组件 |
| 同一租户出现两套互不相干的头底 | 加页时又 copy 了 header/footer，没复用已有壳 |
| 占位符原样出现、不拉数据 | 组件漏传 `type`，变成 static |
| 页面没有主题 | 没关联 layout，且没有 code=`layout` 的组件 |
| 头进了正文 / 子块不嵌套 | header 被建成 static，或 chrome 被挂到了页面 |
| footer 跑到主内容前面 | `sort_order` 用了默认 100 |
| 改了 CSS 没变化 | 没 bump `?v=`，或 metadata 整份替换时写回了旧 URL |
| 改了共用 header，所有页都变了 | 把全站壳当成单页皮改了 |
| 详情 404 | 页面 type 不是 postsingle/productsingle，或打开了无 id 的 `/{code}` |
| 产品详情打不开 | 用了 `/product-{id}`，或页面 type 标成 list |
| 筛选不出现 | 页面 type 不是 `list`，或没挂 listfilter |
| 表单只有空壳 | 没写 `template_id` |
| 登录后跳错 | 改了 `page_code=login` / `dashboard` |
| 拷了组件但图 404 | metadata 仍指向参考库或其它租户 |
| 上传的 CSS 被当下载 | `content_type` 不是 `text/css` |
| 删了一个 chrome，头上开洞 | 只删了子块，壳 HTML 还在 `{{code}}` |
