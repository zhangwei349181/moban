# type=`layout`（全局 / 主题）

Skill 可读的组件类型契约。改全站颜色、字体、版心，或新建/切换主题时读本文。不要从 a0005 的 SKILL / workflows 抄布局约定。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 2、1.3、1.4。

---

## 0. 读本文的 Agent 环境（先读）

假定你**已经具备**下列能力，鉴权与当前租户由工具处理，**不要**改用手写 HTTP、curl、密钥文件或「当前这台机器上的上传脚本」来完成本文任务。

1. **文档管理工具**：可直接在 `https://tenantdoc.gt6ai.xyz/{租户id}/` 下上传、覆盖、列举、删除、读取文件。传路径时**不要**自己拼租户 id；工具会写到 `{租户id}/…`，成功结果里的完整 `url` 才写入组件 metadata。
2. **CMS 工具**：可直接创建、读取、更新、删除 **组件**、**页面**，以及 **页面↔组件关联**。更新组件 metadata 是**整份替换**（先读后写）。`type` 是组件记录的独立字段，创建/更新时与 `metadata` 分开传。

工具具体名称因环境而异，按「文档 / 组件 / 页面 / 关联」四类对照即可。站点前端读的是 CDN 静态 JSON（写成功后异步刷新，验收时若仍是旧值，稍等再读）。

---

## 1. 何时读 / 何时不读

| 任务 | 读本文？ |
|------|----------|
| 换全站颜色、字体、版心、间距 | 是：改该 layout 的 CSS token **值** |
| 新建一套主题（如 `theme02`） | 是：新组件 + 新目录，不要覆盖旧文件 |
| 某几页换肤、其余保持默认 | 是：用页面关联选 layout |
| 改 Hero / 头底 / 列表的样子 | 否：去对应 type 的组件文档，不要往 layout 里堆 class |
| 加 Swiper、购物车 store | 否：走组件 `depends` / `global_js`，禁止塞进 layout |

---

## 2. 它是什么

`layout` 是**主题层**：只向 `<head>` 注入 CSS（以及极少的全站 JS）。**不进 `<body>`**，不输出 HTML 区块。

内核不会自动挂站点 `/assets/theme.css`。正式来源永远是 tenantdoc 上该组件目录里的文件。

一页请求只注入**一套** layout。库里可以同时存在 `theme01`、`theme02`、`layout` 等多个实例。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。创建时不传则默认为 `static`。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 / 组件详情 JSON 的 `component.type` | 有，layout 必须为 `"layout"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有。** 关联只有 `component_id`、`components_code`、`sort_order`、关联 `metadata` |

内核用组件记录的 `type` 判断是不是 layout，不读 metadata 里的同名键。历史数据若误把 `type` 写进 metadata，视为无效，以组件字段为准。

---

## 4. 加载规则（没有第三档）

按顺序，命中即停：

1. **本页关联了 `type=layout` 的组件**（以该组件记录的 `type` 为准，不是关联行、也不是 metadata）→ 注入它的 CSS/JS。多份时取 `sort_order` 最小的一份（同序再比关联创建时间）。关联只为选主题，仍不在正文渲染。
2. **本页没有关联任何 layout** → 加载 `components_code` 恰好为 `layout` 的组件。
3. **2 也不存在** → 不注入任何 layout CSS/JS。**禁止**回退到 `/assets/theme.css` 或其它主题。

### 怎么选用法

| 目标 | 做法 |
|------|------|
| 全站同一套皮 | 租户内保留一个 `components_code=layout` 且 `type=layout` 的组件；**各页不要再关联**其它 layout |
| 全站用 `theme01`，没有 code=`layout` | 必须给**每一个会出站的页面**关联 `theme01`，否则这些页没有主题 CSS |
| 仅某页换肤 | 只给该页关联目标 layout（如 `theme01`）；未关联页走规则 2 |

`components_code` 创建后不可改。名叫 `theme01` 的组件**不会**自动变成规则 2 的默认主题。

---

## 5. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`，租户内唯一。用 `theme01`、`layout`、`a0005`，不要 `theme-01` |
| 目录名 | 与 `components_code` 相同 |
| 组件字段 `type` | 必填（创建时显式传），恒为 `"layout"`。漏传会变成默认 `static`，主题不会按 layout 加载 |

建议：库里的可切换主题用 `theme01`、`theme02`…；站点默认主题额外做一个 code=`layout` 的组件（可与某套 theme 指向同一 CSS URL，或复制一份）。

---

## 6. 资源路径

公网（写入 metadata 的必须是这种完整 URL）：

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/layout/{components_code}/{css|js|media}/{文件名}
```

文档工具的目录（**不含**租户 id）：

```
website/layout/{components_code}/css
website/layout/{components_code}/js
website/layout/{components_code}/media
```

| 资源 | 放哪 | 说明 |
|------|------|------|
| 主题 CSS | `css/` | 如 `theme01.css`；metadata 的 `css_url` 必须指向这里 |
| 极少全站 JS | `js/` | 主题级脚本才放；不是业务组件脚本 |
| 全站字体/装饰图 | `media/` | CSS 里用完整 tenantdoc URL |
| vendor（Swiper 等） | **禁止**放本目录 | 在 moban 库租户 `website/vendor/{库名}/` |

layout **通常没有** `html/`：没有可渲染 HTML。不要为 layout 填 `html_url`。

禁止把 URL 写成站点相对路径（`/assets/theme.css`、`./theme.css`）。内核 `/assets/` 只保留编辑态等内核文件。

改文件：换新文件名上传 → 改组件 metadata 的 URL → 确认后再删旧文件（避免 CDN 缓存）。

---

## 7. 组件字段与 metadata

### 7.1 组件记录（与 metadata 并列）

| 字段 | 必填 | 说明 |
|------|------|------|
| `components_code` | 是 | 创建后不可改 |
| `type` | 是 | `"layout"`。走创建/更新组件工具的 **type 参数**，不进 metadata |
| `components_description` | 否 | 可读说明，如「空模板主题 token」 |
| `parent_id` | 否 | layout 用顶级，不传 |

### 7.2 metadata（只放皮的 URL 与脚本）

写在**组件自身**。关联行默许为空（只为选中这个组件）。更新 metadata 必须先读出当前对象，改完整份写回。

| 字段 | 必填 | 含义 |
|------|------|------|
| `css_url` | 有样式时是 | 主题 CSS 的完整公网 URL |
| `css_urls` | 否 | 额外样式表数组，同须落在本组件 `css/` |
| `init_script_url` / `script_urls` / `global_js` | 否 | 主题级脚本；文件在本组件 `js/`。能不写就不写 |
| `depends` | 否 | **不要**在 layout 上声明 vendor |
| `html_url` / `html` / `translations[].html_url` | 禁止 | layout 不渲染 HTML |
| `type` | **禁止** | 不是 metadata 字段 |

主题 CSS 无语言差异时，`css_url` 放顶层即可，不必套 `translations[]`。

创建时示例（字段分层，不是都塞进 metadata）：

```json
{
  "components_code": "theme01",
  "components_description": "layout 主题：reset + token",
  "type": "layout",
  "metadata": {
    "css_url": "https://tenantdoc.gt6ai.xyz/{tenant_id}/website/layout/theme01/css/theme01.css"
  }
}
```

关联行示例（无 type）：

```json
{
  "component_id": "{layout组件uuid}",
  "sort_order": 0,
  "metadata": {}
}
```

不要在关联行再抄一份 `css_url`。要换皮：解绑旧 layout、绑定另一个；或改组件自身 `css_url`。

---

## 8. CSS 合同（冻结 token）

layout CSS **只允许**：极简 reset + `:root` 里已冻结的变量。换肤 = 改**值**，不改**名**，不增变量。

### 8.1 允许出现的变量（完整表）

| 变量 | 职责 | 样例值（空模板） |
|------|------|------------------|
| `--color-bg` | 页底 | `#ffffff` |
| `--color-surface` | 卡片/条带底 | `#f5f5f5` |
| `--color-text` | 主文字 | `#111111` |
| `--color-text-muted` | 次级文字 | `#666666` |
| `--color-border` | 线 | `#e5e5e5` |
| `--color-brand` | 品牌色 | `#111111` |
| `--color-brand-ink` | 落在品牌色上的字/图标 | `#ffffff` |
| `--font-sans` | 正文族 | `system-ui, -apple-system, "Segoe UI", sans-serif` |
| `--font-heading` | 标题族 | 可 `var(--font-sans)` |
| `--fs-body` | 正文字号 | `1rem` |
| `--fs-h1` / `--fs-h2` | 标题字号 | `2rem` / `1.5rem` |
| `--lh-body` | 行高 | `1.6` |
| `--page-max` | **外框**最大宽：圆角灰底、色带等区块外壳 | `1200px`（`theme01` 现为 `1880px`） |
| `--content-max` | **内容**最大宽：头栏、底栏内文、Hero/Features 卡片栅格 | `960px`（`theme01` 现为 `1290px`） |
| `--head-max` | **区块标题栏**最大宽：`__head` / `__copy` 居中标题+说明 | `740px` |
| `--list-max` | **列表页主栏**：`.gt6-list-main`（筛选+网格） | `960px`（`theme01` 现为 `1290px`） |
| `--page-pad` | 左右页边 | `1.25rem` |
| `--section-y` | 区块上下留白 | `4rem` |
| `--space-1` … `--space-6` | 间距阶 | `0.25rem` … `2.5rem` |
| `--radius` / `--radius-pill` | 圆角 | `0.5rem` / `999px` |
| `--line` | 边框粗细 | `1px` |
| `--ease` / `--t-fast` | 动效 | cubic-bezier / `180ms` |
| `--btn-bg` / `--btn-fg` / `--btn-pad` / `--btn-radius` | 按钮 token | 指向 brand，**不是** `.btn` class |

对照 a0005 / ai-application：外框 ≈ `max-w-[1880px]`，内容 ≈ `.main-container` 的 `max-w-[1290px]`。两层都要：不要只用 `--page-max` 当头栏宽度。以后做 Features 等带灰底外壳的 static：根/色带用 `--page-max`，标题和卡片栅格包一层 `max-width: var(--content-max); margin-inline: auto`。区块居中标题（`__head` / `__copy`）用 `--head-max`，不要借用 `--page-max` / `--content-max`。列表页 `.gt6-list-main` 用 `--list-max`，同样不要借用那两个。

可从库租户已有 `theme01.css` 复制后只改值。不要另发明变量名。

### 8.2 Reset 范围

只做文档级归一：`box-sizing`、`html/body` 吃 token、图片块级、链接继承色、按钮去默认皮、列表去点、标题去浏览器字号。不要在 reset 里写布局、网格、组件外观。

### 8.3 断点

合同写死为 **640 / 768 / 1024 / 1280**。写在**各业务组件自己的** `@media` 里，**不要**做成 CSS 变量，也不要在 layout 里为组件写媒体查询。

### 8.4 禁止（CSS）

- Tailwind、Bootstrap、其它框架
- `.btn`、`.container`、`.row`、utility class
- `--background-1`…`--background-14`、任意未在上表的 token
- 把某个 Hero/header 的选择器写进 layout
- `@import` 其它租户或站点 `/assets/main.css`

业务组件 CSS：选择器挂在自己的根 class 上，值只用上表 `var(--…)`。

---

## 9. JS 合同

layout 默认**无脚本**。只有「每页都必须、且不属于任何业务组件」的主题脚本才进 `website/layout/{code}/js/`。

禁止放进 layout：Swiper、购物车、表单校验、语言切换、统计 SDK。这些分别走 `depends`（库租户 vendor）或该业务组件的 `global_js` / `init_script_url`。

注入顺序（全站，供对照，layout 只占第一段）：

```
layout 的 CSS/JS
→ 本页组件树的 depends（vendor，去重）
→ 本页组件树的 global_js（去重）
→ 各区块 init_script_url
```

---

## 10. 操作规程（用工具，不要手写接口）

下列步骤一律走 §0 的文档工具与 CMS 工具。不要拼上传 API、不要拼 `/api/v1/gt6-web/…`。

### 10.1 新建一套主题

1. 用组件列表工具确认目标 `components_code`（如 `theme02`）未被占用。
2. 以现有主题 CSS 为底，**只改 token 值**，另存为例如 `theme02.css`。
3. 用文档工具上传文本到目录 `website/layout/theme02/css`、文件名 `theme02.css`、类型 `text/css`。记下返回的完整 `url`。
4. 用**创建组件**工具提交：
   - `components_code` = `theme02`
   - `type` = `layout`（独立字段，必传）
   - `metadata` = `{ "css_url": "<上一步的 url>" }`（不要带 `type`）
   - 编码冲突则改为更新已有组件，不要再创建。
5. 按 §4 决定：做成全站默认（再做一个 code=`layout`，或给所有页面关联），还是只给部分页关联。
6. 按 §12 验收。

### 10.2 只改现有主题的颜色/字体

1. 用组件详情工具读出 `id`、`type`、当前 `metadata.css_url`。确认 `type` 仍是 `layout`。
2. 用文档工具读取该 CSS，只改 §8.1 表内变量的值。
3. **换新文件名**上传到同一 `css/` 目录（如 `theme01-v2.css`）。
4. 用更新组件工具：`metadata` 在原对象上只改 `css_url`（整份写回，**不要**往 metadata 里加 `type`）。`type` 参数不传（保持 `layout`）。
5. 打开任意应使用该主题的页面，看 head 里主题 `<link>` 是否指向新 URL，`:root` 是否新值。

### 10.3 全站默认主题（code=`layout`）

1. 若不存在 code=`layout`：按 10.1 创建，`components_code` 必须是 `layout`，`type` 必须是 `layout`。`css_url` 可与某套 theme 相同。
2. 各页**不要**再关联其它 layout，否则规则 1 会盖掉默认。
3. 验收：未关联 layout 的页也能在 head 里看到该 CSS。

### 10.4 单页换肤

1. 用页面详情工具取页面 id，用组件详情确认目标组件 `type=layout`。
2. 用**创建关联**工具：传入该 layout 的 `component_id`，`sort_order` 用较小值（如 `0`），关联 `metadata` 为空对象。同一页不要挂多个 layout。
3. 验收：仅该页 head 指向该主题；其它未关联页不受影响。

### 10.5 从某页撤掉换肤

用**删除关联**工具解除该页与该 layout 组件的关联（不删除组件本身）。该页回到规则 2（有 code=`layout` 则用它，否则无主题）。

---

## 11. 库租户上的样例

moban 库租户可有一套 `theme01`：`type=layout`，CSS 在 `website/layout/theme01/css/`。

若租户里**没有** `components_code=layout` 的组件，未给页面关联任何 layout 时，该页不会出现主题 CSS。这是规则 3，不是故障。

复制到业务租户时：用文档工具把 `website/layout/{code}/` 拷到**当前租户**，创建/更新组件时 `css_url` 用当前租户的 tenantdoc 地址。不要引用其它业务租户的文件。vendor 仍指向库租户（layout 本身不应有 `depends`）。

---

## 12. 验收

做完必须能逐条勾选：

- [ ] 组件记录 `type` 为 `"layout"`；`metadata` 里**没有** `type` 键
- [ ] `metadata.css_url` 为 `https://tenantdoc.gt6ai.xyz/{本租户}/website/layout/{code}/css/…`
- [ ] 用文档工具或公网读取该 CSS：内容为 reset + `:root` 变量，无 `.btn` / `.container` / 框架 class
- [ ] `:root` 只有 §8.1 的变量名（值可变）
- [ ] 页关联该 layout 时：head 有指向该 `css_url` 的 stylesheet，body **没有**该组件的 HTML
- [ ] 未关联且不存在 code=`layout`：head **没有**主题 CSS，也没有 `/assets/theme.css`
- [ ] 未关联但存在 code=`layout`：注入的是 `layout` 的 CSS，不是库里另一个 theme
- [ ] 同一页多个 layout 关联时：只注入 `sort_order` 最先的那一份
- [ ] 业务组件 class 不出现在 layout 文件里

---

## 13. 禁止清单（执行时对照）

- 用手写上传 HTTP / CMS REST 代替 §0 的工具
- 把 `type` 写进 metadata 或关联行
- 创建 layout 时漏传 `type`（会变成默认 `static`）
- 在内核里写死 `/assets/theme.css` 作为回退
- 用 `is_default` 或「加载全部 type=layout」来选主题
- 把 Hero、header、列表 CSS 打进 layout
- 把 vendor 拷进 `website/layout/` 或业务租户 `website/vendor/`
- 在页面 metadata 里再贴一份主题 CSS
- 关联行覆盖 `html_url` / `css_url`（换皮请换组件）
- 为 layout 编写可渲染 HTML
- 新增 token 名、或把 Tailwind 展开成「假主题」

---

## 14. 内核对照（改契约时同步改代码）

站点渲染读 CDN：`web_components/{code}.json` 的 `component.type` + `component.metadata`；页面关联列表**不含** type，须再读组件详情。

| 行为 | 位置 |
|------|------|
| 规则 1–3 | `loadLayoutComponentFrameAssets`（`src/lib/pageFrame.ts`） |
| `type===layout` | `isLayoutComponentType`：看**组件记录**的 `type`，不看 metadata |
| 正文过滤 | `filterPageBodySlots`（`src/lib/pageBodySlots.ts`） |
| head 注入 | `src/layouts/Layout.astro` 的 `frame.cssUrls`；**没有**主题 fallback link |
| 旧 code 兼容 | `isLayoutSectionCode`：`layout` / `layout01`–`layout99` 不进正文。**新组件禁止靠名字**，必须写组件字段 `type` |

实现若改字段或加载顺序，同一天改本文。
