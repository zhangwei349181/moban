# type=`header` / `footer` / `chrome`（头底壳与子块）

Skill 可读的组件类型契约。做全站头部、底部，或 logo / 导航 / CTA / 版权等子块时读本文。不要从 a0005 的 `headerhtml` mega menu 或 Tailwind HTML 直接入库。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 4、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。静态正文区块见 [static.md](./static.md)。

---

## 0. 读本文的 Agent 环境（先读）

假定你**已经具备**下列能力，鉴权与当前租户由工具处理，**不要**改用手写 HTTP、curl、密钥文件或「当前这台机器上的上传脚本」来完成本文任务。

1. **文档管理工具**：可直接在 `https://tenantdoc.gt6ai.xyz/{租户id}/` 下上传、覆盖、列举、删除、读取文件。传路径时**不要**自己拼租户 id。成功结果里的完整 `url` 才写入 metadata。
2. **CMS 工具**：可直接创建、读取、更新、删除 **组件**、**页面**，以及 **页面↔组件关联**。更新 metadata 是**整份替换**（先读后写）。`type` 是组件记录的独立字段，与 `metadata` 分开传。

上传时务必带对 MIME：

| 资源 | `content_type` |
|------|----------------|
| HTML | `text/html` 或 `text/html; charset=utf-8` |
| CSS | `text/css` 或 `text/css; charset=utf-8` |
| JS | `text/javascript` |
| SVG | `image/svg+xml` |
| PNG / JPEG / WebP | `image/png` / `image/jpeg` / `image/webp` |

不要用默认的 `application/octet-stream` 传 CSS/HTML。

---

## 1. 何时读 / 何时不读

| 任务 | 读本文？ |
|------|----------|
| 新建或换一套全站头 / 底 | 是：壳 `header` / `footer` + **本套专用** chrome 子块，不要复用其它头/底的 `{{code}}` |
| 只改 logo、导航链接、CTA、版权文案 | 是：改对应 chrome 子块 HTML，页面关联不用动 |
| 某几页用另一套头 | 是：那些页改关联的 header 壳 |
| 换全站颜色字体 | 否：改 layout 的 token **值** |
| Hero / 特性等正文区块 | 否：`static` |
| 文章列表、详情、表单 | 否：对应动态 type |

---

## 2. 三个 type 怎么分工

| type | 角色 | 页面关联？ | 内核 |
|------|------|------------|------|
| `header` | 头部**壳**：布局 + `{{子组件code}}` + 汉堡/抽屉等壳级交互 | **要**。一页最多挂一个（多份时按 `sort_order` 都渲染，应避免） | `_ChromeHtmlSection`，`chromeKind=header` |
| `footer` | 底部壳，同上 | **要** | 同上，`chromeKind=footer` |
| `chrome` | 壳里的子块：logo、nav、CTA、语言、购物车、版权 | **不要**挂到页面。只出现在壳 HTML 的 `{{code}}` 里 | 壳渲染时按 code **fetch** 子组件 HTML/CSS/JS |

页面只关联壳。子块靠模板占位符拉取，不进 `<main>`。误把 chrome 挂到页面时，内核从正文过滤掉（开发态会警告）。壳或子块没有 `html_url` 时，内核**不回退**内置 HTML：壳缺失显示「没有可加载的模板」，子块缺失则该占位为空。

内核选渲染器看组件记录的 `type`，不再要求名字必须是 `headerhtml`。旧名 `headerhtml` / `footerhtml` 仅兼容已有租户。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `header` / `footer` / `chrome` 之一 |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |

创建时**显式传** `type`。漏传会变成默认 `static`，头会进正文、壳不会嵌套子块。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`，租户内唯一，创建后不可改 |
| 壳 | `header01`、`header02`、`footer01`（类型名 + 数字）。**不要**再用 `headerhtml` 做新组件 |
| 子块 | 与壳编号对齐：`header01` → `headerlogo01` `headernav01` `headercta01` `headerlang01`；`header02` → `headerlogo02` `headernav02` `headercta02` `headerlang02` … |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同；子元素 BEM：`.header01__bar`、`.headernav01__link` |

不要用连字符（`header-main` 非法）。不要把子块命名成 `header01`（那是壳：`header` + 纯数字）。

**一套壳配一套子块，禁止跨壳复用。** 新建 `header02` / `footer02` 时，即使 logo、导航、CTA、语言、购物车与 01 **完全一样**，也要新建 `headerlogo02`、`headernav02`、`headercta02` 等，**不要**在壳 HTML 里写 `{{headerlogo01}}`。子块 `parent_id` **必须**指向本套壳（复制站点/组件时才能整套带走）。禁止跨头/底借用：header 不用 footer 的子块，footer 不用 header 的子块，02 不用 01 的子块。

`parent_id`：新子块必须挂到本套壳的组件 id 上，便于 CMS 树状浏览和整套复制；**渲染不靠** parent，只靠 `{{code}}`。

---

## 5. 资源路径

公网（写入 metadata 的必须是完整 URL）：

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/header/{code}/{html|css|js|media}/{文件名}
https://tenantdoc.gt6ai.xyz/{租户id}/website/footer/{code}/{html|css|js|media}/{文件名}
https://tenantdoc.gt6ai.xyz/{租户id}/website/chrome/{code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/header/{code}/html|css|js|media
website/footer/{code}/html|css|js|media
website/chrome/{code}/html|css|js|media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html`（中英无差可用一份 `{code}.html`，`html_url` 与 translations 都指向它） |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 壳 / 子块 init | `js/` | `{code}.js` |
| logo 等媒体 | `media/` | `{code}-wordmark.svg` |

硬性：

- 壳走 `website/header|footer/…`，子块走 `website/chrome/…`，不要塞进 `website/static/`，不要 `html/a0006/headerhtml/`。
- `<img src>`、CSS `url()` 必须是本组件 `media/` 的完整 tenantdoc URL。禁止 `/images/shared/…`。
- vendor 仍在 moban 库租户 `website/vendor/`，复制站点时不拷。
- 改 CSS/图建议换文件名或 `?v=` 再改 metadata。

---

## 6. 壳 HTML 合同

1. **一根语义根节点**：头部 `<header class="header01">`，底部 `<footer class="footer01">`。
2. 子块用 **`{{components_code}}`**，花括号内只有字母数字（与 CMS code 一致，小写）。只引用**本套壳**的子块。例：`header01` 写 `{{headerlogo01}}` `{{headernav01}}` `{{headercta01}}`；`header02` 写 `{{headerlogo02}}` `{{headernav02}}` `{{headercta02}}`，不要写 `{{headerlogo01}}`。
3. 同一 `{{code}}` 可以出现多次（桌面条 + 抽屉各嵌一次 logo/nav）；内核按 code 只 fetch 一次，替换每一处。
4. **禁止** Tailwind / Bootstrap / `data-ns-animate`。对照 a0005 时重写结构和 class，**不要**把 mega menu 整段搬进来。
5. 汉堡按钮、抽屉、遮罩属于**本套壳**，写在壳 HTML 里，不要拆成 chrome 子块。不要为了「复用」去引用另一套头/底的子块。
6. 多语言 = 两份壳 HTML，class 与占位符必须一致，只换「菜单 / Menu」这类壳上文案。
7. `bare: true`（或根是 `header`/`footer`）：全宽，不要被 main 的 padding 夹住。

最小头部壳：

```html
<header class="header01">
  <div class="header01__bar">
    {{headerlogo01}}
    {{headernav01}}
    {{headerlang01}}
    {{headercta01}}
    <button type="button" data-header01-menu>Menu</button>
  </div>
  <aside data-header01-drawer hidden>
    {{headerlogo01}}
    {{headernav01}}
    {{headerlang01}}
    {{headercta01}}
  </aside>
</header>
```

最小底部壳：

```html
<footer class="footer01">
  <div class="footer01__brand">{{footerlogo01}}</div>
  {{footernav01}}
  <div class="footer01__bar">
    {{footercopy01}}
    <div class="footer01__tools">
      {{footerlang01}}
      {{footercurr01}}
      {{footercart01}}
      {{footerwish01}}
    </div>
  </div>
</footer>
```

---

## 7. 子块 HTML 合同

1. 一根根节点，class = code。logo 用 `<a class="headerlogo01">`（02 套则 `headerlogo02`），导航用 `<nav class="headernav01">`。
2. **一列导航**：顶层就是链接，不要 mega menu。每套壳自己的 nav 子块（`header01` → `headernav01`，`header02` → `headernav02`），不要共用上一套的 nav。
3. 子块自己的 CSS 只描述自己长什么样；壳 CSS 负责「在 pill 条里横排、在抽屉里竖排、小屏藏桌面 nav」。
4. 中英两份（或一份通用 HTML）。链接路径中英相同，只换可见文案。
5. **工具子块**（语言 / 货币 / 迷你购物车 / 愿望清单）根节点必须带约定 `data-*`，列表由 init 脚本从 `window.__ASTRO_LANGUAGES__` / `__ASTRO_CURRENCIES__` / `localStorage` 填，不要把选项写死在 HTML 里。不要用国旗 `/assets/images/country/`（那是 a0005 站点资源）。

| 子块 | 根钩子 | 脚本读什么 |
|------|--------|------------|
| `headerlang01` / `headerlang02` | `data-headerlang01` / `data-headerlang02` | `window.__ASTRO_LANGUAGES__`，改 cookie `locale` 后刷新 |
| `footerlang01` | `data-footerlang01` | `window.__ASTRO_LANGUAGES__`，改 cookie `locale` 后刷新 |
| `footercurr01` | `data-footercurr01` | `window.__ASTRO_CURRENCIES__`，改 cookie `currency` 后刷新 |
| `footercart01` | `data-footercart01` | `localStorage.cart_items` + 已登录则 Sales `/cart` |
| `footerwish01` | `.footerwish01` | `localStorage.wishlist_product_ids`，链到 `/wishlist` |

---

## 8. CSS / JS

与 [static.md §7–8](./static.md) 相同：选择器挂在根 class 下；只引用 layout token；断点写死 640 / 768 / 1024 / 1280。

头栏 pill、底栏内文用 `max-width: var(--content-max)`（内容栏，`theme01` 为 1290）。不要用 `--page-max`（那是 1880 外框，给 Hero/Features 的灰底外壳）。壳根仍 `padding-inline: var(--page-pad)`。

壳级交互（汉堡）用壳的 `init_script_url`。监听 `gt6:chrome:ready`，从 `event.detail.root` 取插槽根（`data-chrome-kind` 为 `header` 或 `footer`），不要 `querySelector` 全页。

子块一般不需要 JS。语言切换、购物车数量等若必须，用该子块自己的 `init_script_url`，同样只绑本 `data-chrome-part`。内核以经典 `<script src>` 加载这些脚本（非 `type=module`，避免跨域），所以必须包 IIFE：禁止顶层 `function findRoot` / `onReady` 等同名声明，否则后加载的子块会覆盖先加载的，语言/货币会被挂到购物车根上。`gt6:componentshtml:ready` 只在 `event.detail.root` **自身**匹配本子块钩子时挂载，不要对父级 chrome 槽 `querySelector` 后代。

禁止把 Swiper、mega-menu 全局脚本写进 layout。

---

## 9. 组件字段与 metadata

### 9.1 组件记录

| 字段 | 壳 | 子块 |
|------|----|------|
| `components_code` | `header01` | `headerlogo01` 等 |
| `type` | `header` 或 `footer` | `chrome` |
| `parent_id` | 空 | **必须**指向本套壳 id（复制才能整套带走） |
| `components_description` | 说明结构（pill + 抽屉） | 说明用途（logo / 一列 nav） |

### 9.2 metadata（禁止 `type`）

| 字段 | 壳 | 子块 |
|------|----|------|
| `html_url` | 默认语言 HTML | 同左 |
| `css_url` | 壳 CSS | 子块 CSS |
| `init_script_url` | 汉堡等壳脚本 | 通常没有 |
| `translations[]` | `{ locale, html_url }` | 同左 |
| `bare` | `true` | `true`（单根插入，避免额外 wrapper 破坏 flex） |
| `depends` / `global_js` | 仅当多块共享库 | 少用 |

`translations[]` 必须同时写 `language_code`（`en-US` / `zh-CN`）和 `locale`（`en` / `cn`）。内核按 `language_code` 匹配当前语言；只写 `locale: cn` 时中文会落到第一份（通常是英文）。缺翻译时回退 `html_url`。

---

## 10. 页面怎么挂

1. **只关联壳**（`type=header` 的 `header01`，以及以后的 `footer01`）。`sort_order` 小于正文 static（例如 theme layout=1，header=2，hero=10）。
2. **不要**把 `headerlogo01`、`headernav01` 等 chrome 加到页面关联。
3. 换头：该页改关联到另一套 `type=header` 的壳（如 `header02`）。新壳必须自带完整子块（`headerlogo02` 等），不要指望还去拉 `header01` 的子块。
4. 某页不要头：不关联任何 header。内核**不会**回退 `headerhtml` 或本地文件。
5. layout 仍按 [layout.md](./layout.md) 的 1-2-3 加载；头不是 theme，不能代替 token。

样例（moban 库）：

- 头 01：`header01` + `headerlogo01` + `headernav01` + `headercta01` + `headerlang01`（语言切换；不要加货币/购物车）
- 头 02：`header02` + `headerlogo02` + `headernav02` + `headercta02` + `headerlang02` + `headercurr02` + `headercart02` + `headerwish02`（即使 logo/nav/CTA 与 01 相同，也是独立组件，`parent_id` 指向 `header02`）
- 底 01：`footer01` + `footerlogo01` + `footernav01` + `footercopy01` + `footerlang01` + `footercurr01` + `footercart01` + `footerwish01`

导航都是一列链接（对照 a0005 顶层项压平），没有 mega menu。底栏工具四件对照 a0005 的 language / currency / minicart / wishlist，但 code 用 `footerlang01` 这类字母数字。深色底栏用 token（`--color-text` 作底、`--color-bg` 作文），logo 用浅色字标；footer 不要引用 `headerlogo01`，应自备 `footerlogo01`。

---

## 11. 禁止

- 新组件继续叫 `headerhtml` / `footerhtml`，或靠名字正则当 type。
- 把 `type` 写进 metadata。
- 页面关联 chrome 子块当正文。
- 把 Tailwind mega menu 展开成「独立 CSS」。
- 子块 HTML 引用 `/images/shared/main-logo.svg` 或其它租户地址。
- 壳 HTML 里写不存在的 `{{code}}`（会替换成空）。
- 在壳里嵌套另一个 `type=header` / `footer` 壳。
- 新壳复用其它头/底的子块（例如 `header02` 写 `{{headerlogo01}}` / `{{headernav01}}`），即使 HTML 完全一样。复制组件时带不走别人的子块。

---

## 12. 入库核对清单

- [ ] 壳 `type=header` 或 `footer`，子块 `type=chrome`，都是独立字段
- [ ] metadata 无 `type`；有 `html_url`、`css_url`、`bare: true`；壳若有汉堡则有 `init_script_url`
- [ ] 文件在 `website/{header\|footer\|chrome}/{code}/…`，MIME 正确
- [ ] 壳只有 `{{字母数字}}`；引用的全是**本套**子块；子块 code 已创建、`parent_id` 指向本壳、能 fetch 到 HTML
- [ ] 页面只关联壳；home 上可见 logo + 一列 nav + CTA；小屏汉堡能打开抽屉；页底可见 logo + 一列 nav + 版权
- [ ] 无 Tailwind class、无 `/images/` 相对路径
- [ ] 不关联 header / footer 的页面没有这套头底
