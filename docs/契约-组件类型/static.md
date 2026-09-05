# type=`static`（静态展示区块）

Skill 可读的组件类型契约。做 Hero、特性、CTA、图文等**无服务端数据契约**的区块时读本文。不要从 a0005 的 `components01–99` 编号体系或 Tailwind HTML 直接入库。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 3、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。

---

## 0. 读本文的 Agent 环境（先读）

假定你**已经具备**下列能力，鉴权与当前租户由工具处理，**不要**改用手写 HTTP、curl、密钥文件或「当前这台机器上的上传脚本」来完成本文任务。

1. **文档管理工具**：可直接在 `https://tenantdoc.gt6ai.xyz/{租户id}/` 下上传、覆盖、列举、删除、读取文件。传路径时**不要**自己拼租户 id。成功结果里的完整 `url` 才写入 metadata。
2. **CMS 工具**：可直接创建、读取、更新、删除 **组件**、**页面**，以及 **页面↔组件关联**。更新 metadata 是**整份替换**（先读后写）。`type` 是组件记录的独立字段，与 `metadata` 分开传。

工具名因环境而异，按「文档 / 组件 / 页面 / 关联」四类对照。站点读 CDN 静态 JSON，写成功后可能短暂延迟，验收时若仍是旧值，稍等再读。

上传时务必带对 MIME，否则浏览器会下载而不是当 HTML/CSS 打开：

| 资源 | `content_type` |
|------|----------------|
| HTML | `text/html` 或 `text/html; charset=utf-8` |
| CSS | `text/css` 或 `text/css; charset=utf-8` |
| JS | `text/javascript` |
| PNG / JPEG / WebP | `image/png` / `image/jpeg` / `image/webp` |
| SVG | `image/svg+xml` |

不要用默认的 `application/octet-stream` 传 CSS/HTML。

---

## 1. 何时读 / 何时不读

| 任务 | 读本文？ |
|------|----------|
| 新建 Hero / 特性 / CTA / 关于我们等固定区块 | 是 |
| 把 a0005 某个 `componentsNN` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，禁止展开 Tailwind |
| 同一区块挂到另一页、只换文案 | 是：改关联或组件 HTML，不改 type |
| 换全站颜色字体 | 否：改 layout 的 token **值**，见 [layout.md](./layout.md) |
| 头底壳、导航、购物车图标 | 否：`header` / `footer` / `chrome` |
| 文章列表、详情、表单、结账 | 否：对应动态 type，HTML 必须留占位符与 `data-*` |

---

## 2. 它是什么

`static` 是**静态 HTML 插槽**：内核按当前语言拉取 `html_url`（或内联 `html`），插入页面正文，并加载该组件自己的 CSS / 可选 JS。

- **不调文章/产品 API**，没有 `template_id`、`list_path`、`article_id`。
- 文案写在 HTML 里（或后续用关联覆盖约定字段）；皮（结构与样式）写在组件目录。
- 可挂到任意展示页，**不要求**特定 `page_type`。
- 一页可以挂多个 `type=static` 的组件，按关联 `sort_order` 排列。

内核实现：组件记录 `type===static` → `_ComponentsHtmlSection.astro`。不再要求名字是 `components01–99`。`html_url`（或内联 `html`）**必填**；拉不到时显示「没有可加载的模板」，内核没有 HTML 回退。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 / 组件详情 JSON 的 `component.type` | 有，必须为 `"static"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |

创建时**显式传** `type=static`。创建接口不传 `type` 时服务端默认也是 `static`，但不要依赖「漏传」：其它类型漏传会错成 static。

内核用组件记录的 `type` 选渲染器。关联列表不含 type，渲染前会再读组件详情。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`，租户内唯一，创建后不可改。用 `hero01`、`features01`、`cta01`，**不要** `hero-split`（连字符非法） |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.hero01`；子元素用 BEM：`.hero01__title`、`.hero01__btn--primary` |
| 组件字段 `type` | `"static"` |

按职能命名，不要继续 `components01`、`components02` 这种序号。同一职能多套皮用数字后缀：`hero01`、`hero02`。

---

## 5. 资源路径

公网（写入 metadata 的必须是完整 URL）：

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/static/{components_code}/{html|css|js|media}/{文件名}
```

文档工具的目录（**不含**租户 id）：

```
website/static/{components_code}/html
website/static/{components_code}/css
website/static/{components_code}/js
website/static/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css`（一般中英共用一份） |
| 区块 init | `js/` | `{code}.js` |
| 图 / 字体 / 视频 | `media/` | `{code}-banner.png` 等 |

硬性：

- HTML 里的 `<img src>`、CSS 里的 `url()` **必须**是本组件 `media/` 的完整 tenantdoc URL。禁止 `/images/…`、`./images/…`、站点相对路径、其它业务租户地址。
- 不要把 A 组件的图放到 B 的 `media/`。
- 不要把 layout 主题 CSS 或 vendor 塞进本目录。
- 不要建 `website/home/…` 这种页面目录。
- 改 CSS/图建议换新文件名（或 URL 加 `?v=`）再改 metadata，确认后再删旧文件。HTML 在当前 CDN 上通常不按扩展名长缓存，仍建议改完验收。

---

## 6. HTML 合同

1. **一根语义根节点**，class 等于 code。推荐 `<section class="hero01">`。根是 `section` / `header` 时内核会按全宽插槽渲染（见 §7 `bare`）。
2. **语义标签**：`h1`–`h3`、`p`、`a`、`figure`/`img`、`ul`/`li`。不要用一串无意义 `div` + utility class。
3. **禁止** Tailwind / Bootstrap class（`flex`、`pt-20`、`bg-background-12`、`btn-xl-v2` 等）。视觉对照 a0005 时**重写**结构和 class，禁止把 utility 展开成「假独立 CSS」。
4. **禁止** `data-ns-animate` 等旧模板动画钩子（那是 a0005 全局 JS）。交互走本组件 `init_script_url`。
5. 装饰层（网格线、背景形）用带 `aria-hidden="true"` 的元素 + 根 class 下的 CSS，不要靠全局框架。
6. 小图标可用内联 SVG（`aria-hidden`）；大图、照片走 `media/`。
7. 多语言 = **两份 HTML**，结构 class 必须一致，只换文案与 `alt`。
8. 静态类型**没有**强制 `{{占位符}}` 表（那是动态类型的契约）。不要在 static 里发明一套未文档化的模板语法。
9. HTML 内的 `<script>` 会被内核剥离后另执行。交互逻辑优先外链 `init_script_url`，不要把大段脚本写进 HTML。

最小结构示例（根 class = code）：

```html
<section class="hero01">
  <div class="hero01__panel">
    <div class="hero01__inner">
      <h1 class="hero01__title">…</h1>
      <p class="hero01__lead">…</p>
      <a class="hero01__btn hero01__btn--primary" href="/services">…</a>
      <figure class="hero01__media">
        <img src="https://tenantdoc.gt6ai.xyz/{tenant_id}/website/static/hero01/media/hero01-banner.png" alt="…" />
      </figure>
    </div>
  </div>
</section>
```

**宽度分层**（对照 a0005 `max-w-[1880px]` + `.main-container` 1290；token 见 [layout.md §8.1](./layout.md)）：

| 层 | class 习惯 | token |
|----|------------|--------|
| 外框（圆角灰底、色带） | `.{code}__panel` | `max-width: var(--page-max)` |
| 内容（卡片栅格、主图） | `.{code}__inner` | `max-width: var(--content-max); margin-inline: auto` |
| 区块标题栏（badge + 标题 + 说明） | `.{code}__head` / `.{code}__copy` | `max-width: var(--head-max)` |

以后做 `features01` 等同结构：灰底外壳走 `--page-max`，卡片栅格走 `--content-max`，居中标题走 `--head-max`。不要用 `--page-max` / `--content-max` 去限标题栏。根 `section` 用 `--page-pad` 做视口边距。

---

## 7. CSS 合同

1. **所有选择器挂在根 class 下**（`.hero01`、`.hero01__title`）。禁止定义全局 `.btn`、`.container`、`h1 { … }`（标题重置已在 layout）。
2. **颜色、字号、间距、圆角、按钮**只引用 layout 已冻结的 token（见 [layout.md §8.1](./layout.md)）。换肤改 layout 的值，不在本文件发明 `--hero-bg` 这类新变量。
3. 允许：`calc(var(--fs-h1) * 1.35)`、本组件自己的布局（flex/grid）、装饰（伪元素、网格线）。
4. **断点写死** 640 / 768 / 1024 / 1280，写在本文件 `@media` 里，不要做成 CSS 变量。
5. 禁止 Tailwind、Bootstrap、`@import` 站点 `/assets/main.css` 或其它业务租户 CSS。

按钮用 token，不要用全局 class：

```css
.hero01__btn--primary {
  background: var(--btn-bg);
  color: var(--btn-fg);
  padding: var(--btn-pad);
  border-radius: var(--btn-radius);
}
```

---

## 8. JS 合同（可选）

多数 static **不需要 JS**（`hero01` 即是）。

| 字段 | 何时用 | 加载 |
|------|--------|------|
| `init_script_url` | 只绑本区块 DOM（轮播、手风琴） | 跟在该组件 HTML 后；本页有几处该组件就几次 |
| `global_js` | 必须先于多个区块的共享状态 | Layout，本页树包含该组件时每个 URL 一次 |
| `depends` | Swiper 等共用库 | 解析到 **moban 库租户** `website/vendor/{id}/`，本页有人声明则一次 |

init 脚本监听 `gt6:componentshtml:ready`，从 `event.detail.root` 取本插槽根节点，不要 `querySelector` 全页。HTML 里不要假设 layout 已注入 Swiper；要库就写 `depends`。

禁止把 Swiper、购物车 store 写进 static 的 CSS 文件或 layout。

---

## 9. 组件字段与 metadata

### 9.1 组件记录

| 字段 | 必填 | 说明 |
|------|------|------|
| `components_code` | 是 | 如 `hero01` |
| `type` | 是 | `"static"`，独立字段 |
| `components_description` | 否 | 说明结构与适用场景，便于选组件 |
| `parent_id` | 否 | 顶级，不传 |

### 9.2 metadata（写在组件自身）

关联行默许为空。更新 metadata 先读后整份写回，**不要**带 `type`。

| 字段 | 必填 | 含义 |
|------|------|------|
| `bare` | 全宽 Hero 建议 `true` | `true`：无额外 `main-container` 包裹。根节点已是 `<section>` 时内核也会按全宽处理 |
| `translations[]` | 多语言时是 | 按 `language_code` 分发 URL |
| `translations[].html_url` | 是 | 该语言 HTML，须在本组件 `html/` |
| `translations[].css_url` | 有样式时是 | 通常中英同一份 CSS |
| `translations[].init_script_url` | 否 | 区块 init |
| `translations[].language_code` | 是 | 如 `en-US`、`zh-CN` |
| `translations[].is_primary` | 主语言一行是 | 主语言 `true` |
| 顶层 `html_url` / `css_url` | 单语言可替代 translations | 少用；有多语言就走数组 |
| `depends` | 否 | 如 `["swiper"]`，不要指向业务租户 vendor |
| `global_js` | 否 | 完整 URL 数组，文件仍在本组件 `js/` |
| `type` | **禁止** | 不是 metadata 字段 |

关联行允许：本页文案类覆盖（若以后约定了字段）。**默认不允许**在关联行再抄 `html_url` / `css_url`。换皮：换另一个 static 组件，或改组件自身文件。

创建示例：

```json
{
  "components_code": "hero01",
  "components_description": "静态首屏：标题、说明、双 CTA、主图",
  "type": "static",
  "metadata": {
    "bare": true,
    "translations": [
      {
        "language_code": "en-US",
        "is_primary": true,
        "html_url": "https://tenantdoc.gt6ai.xyz/{tenant_id}/website/static/hero01/html/hero01_en.html",
        "css_url": "https://tenantdoc.gt6ai.xyz/{tenant_id}/website/static/hero01/css/hero01.css"
      },
      {
        "language_code": "zh-CN",
        "html_url": "https://tenantdoc.gt6ai.xyz/{tenant_id}/website/static/hero01/html/hero01_cn.html",
        "css_url": "https://tenantdoc.gt6ai.xyz/{tenant_id}/website/static/hero01/css/hero01.css"
      }
    ]
  }
}
```

关联行：

```json
{
  "component_id": "{hero01的uuid}",
  "sort_order": 10,
  "metadata": {}
}
```

`sort_order` 越小越靠前。layout 主题若也挂在该页，用更小的值（如 `0`/`1`），且 layout **不进正文**。

---

## 10. 操作规程（用工具，不要手写接口）

### 10.1 从视觉稿 / a0005 新建一个 static

1. 选定 `components_code`（字母数字），用组件列表确认未占用。
2. 写 `{code}_en.html` / `{code}_cn.html`：语义根 class、无 utility。图片先占位，等 media 上传后填完整 URL。
3. 写 `{code}.css`：只挂根 class，值只用 layout token。
4. 需要的图：用文档工具传到 `website/static/{code}/media`，把返回 `url` 写入 HTML。
5. 上传 HTML（`text/html`）、CSS（`text/css`）到对应 directory。记下完整 URL。
6. **创建组件**：`type=static`，metadata 如 §9.2，不要带 `type`。code 冲突则改为更新。
7. **创建关联**：目标页面 + 该 `component_id` + `sort_order` + 空 metadata。
8. 按 §13 验收。该页应已有 layout（关联了 `type=layout` 或存在 code=`layout`），否则 token 无值、看起来会「没样式」。

### 10.2 只改文案（中英 HTML）

1. 读组件详情，确认 `type=static` 与当前 `html_url`。
2. 用文档工具读取 HTML，只改可见文案，**不改 class 结构**。
3. 覆盖上传或换新文件名；换名则更新 metadata 里对应 `html_url`（整份 metadata 写回）。

### 10.3 只改皮（CSS / 图）

1. 改 CSS 或换图，上传到本组件 `css/` / `media/`。
2. CSS 建议新文件名或 `?v=`，再改 `translations[].css_url`。
3. 不要去改 layout 的 token 名；要换肤改 layout 的值。

### 10.4 挂到另一页

1. 取目标 `page.id` 与该 static 的 `component_id`。
2. 创建关联，`metadata` 为空（或只放本页允许的文案覆盖）。
3. 不要复制 HTML 文件。同一 `hero01` 可同时出现在 `home` 与 `about`。

### 10.5 从某页撤掉

删除该页与该组件的**关联**，不要删组件（除非确认全站不再使用）。

---

## 11. 库租户样例：`hero01`

对照 a0005 `components01` 重写的首屏：标题 + 说明 + 双 CTA + 主图 + 装饰网格。

| 项 | 值 |
|----|----|
| `components_code` | `hero01` |
| `type` | `static` |
| 组件 id | `ae7aa26f-8275-41a4-84d4-69ad4fd12aa7` |
| HTML | `website/static/hero01/html/hero01_en.html`、`hero01_cn.html` |
| CSS | `website/static/hero01/css/hero01.css` |
| 图 | `website/static/hero01/media/hero01-banner.png` |
| 本地镜像 | `moban/website/static/hero01/` |

复制到业务租户：拷 `website/static/hero01/` 下 html/css/media，创建组件时所有 URL 换成**当前租户**；`depends` 若有则仍指向库租户 vendor。不要引用其它业务租户。

首页 static 样例（对照 a0005 `ai-application` 首页，不含头底 / hero / 弹窗）：

| code | 职能 |
|------|------|
| `hero01` | 首屏 |
| `marquee01` | 客户 logo 跑马灯 |
| `whatwedo01` | 深色大标题陈述 |
| `features01` | 功能双列 |
| `howitworks01` | 三步工作原理 |
| `services01` | 服务卡片栅格 |
| `casestudy01` | 案例网格（CSS hover 查看详情） |
| `testimonial01` | 六张评价卡 |
| `faq01` | FAQ 手风琴（`init_script_url`） |
| `cta01` | 应用商店 CTA |

---

## 12. 和 layout / 其它类型的边界

| | layout | static |
|---|--------|--------|
| 进 body？ | 否，只注入 head | 是 |
| HTML | 禁止 | 必填 |
| CSS 内容 | 仅 reset + token | 根 class 下的区块皮，吃 token |
| 一页几份 | 只生效一套 | 可多份 |
| 选中方式 | 页关联 type=layout，否则 code=`layout` | 必须页关联 |

static **不替代**主题：没有 layout 时 token 未定义，区块会难看。做 static 前确认该页能加载到 layout CSS。

---

## 13. 验收

- [ ] 组件记录 `type` 为 `"static"`；metadata **没有** `type` 键
- [ ] `html_url` / `css_url` 均在 `https://tenantdoc.gt6ai.xyz/{本租户}/website/static/{code}/…`
- [ ] HTML 根 class 等于 code；无 Tailwind / Bootstrap / `data-ns-animate`
- [ ] `<img>` 与 CSS `url()` 为本组件 `media/` 完整 URL
- [ ] CSS 选择器均在根 class 下；只用 layout 已有 token 名
- [ ] 上传 CSS 的 MIME 为 `text/css`，HTML 为 `text/html`（公网打开应预览而不是下载）
- [ ] 页关联后正文出现该 HTML，并有指向该 `css_url` 的 `<link>`
- [ ] layout 的 `type=layout` 组件仍不出现在 body
- [ ] 同一组件挂到第二页不必复制文件；只改 layout token 值时该区块颜色跟着变
- [ ] 无 JS 的组件不要填空的 `init_script_url`

---

## 14. 禁止清单

- 用手写上传 HTTP / CMS REST 代替 §0 的工具
- 把 `type` 写进 metadata 或关联行
- 使用带连字符的 code（`hero-split`）
- 继续用 `components01–99` 当新组件名
- 把 a0005 HTML 原样上传（带 utility class）
- 图片用 `/images/ns-img-….png`
- 在关联行或页面 metadata 再贴一份 HTML/CSS
- 把 Hero 样式写进 layout
- 把 vendor 拷进 `website/static/` 或业务租户 `website/vendor/`
- 为 static 编造未文档化的 `{{API}}` 占位符充数据源（那是动态类型的事）

---

## 15. 内核对照（改契约时同步改代码）

| 行为 | 位置 |
|------|------|
| `type===static` → HTML 插槽 | `getSectionComponent`（`src/lib/sectionRegistry.ts`） |
| 解析 `html_url` / `css_url` / `init_script_url` / `bare` | `src/components/sections/resolvers/componentsHtml.ts` |
| 插入 HTML、挂 CSS/init | `src/components/sections/_ComponentsHtmlSection.astro` |
| `section`/`header` 根 → 全宽 | `htmlContentUsesBareRoot` |
| 内联 script 剥离与 ready 事件 | 同上 + `gt6:componentshtml:ready` |
| 旧名 `components01–99` | `isCmsHtmlStaticSlotCode`，仅兼容旧租户。**新组件靠 `type`** |

实现若改字段或加载方式，同一天改本文。
