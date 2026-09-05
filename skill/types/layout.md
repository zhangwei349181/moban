# type=`layout`

路径与调用见文档根 `assets.md`。

## 功能

在需要**全站或单页主题**（颜色、字体、版心、间距、圆角、按钮变量）时使用。只向 `<head>` 注入 CSS（以及极少全站 JS），**不进 `<body>`**，不输出 HTML 区块。

不要用本类型去做 Hero、头底、列表格子或业务脚本（轮播库、购物车 store）。那些分别是 `static` / `header` / `footer` / 各业务 type 的 `depends` 与 `global_js`。

内核不会自动挂站点 `/assets/` 下的主题文件。正式来源永远是该 layout 组件目录里的 CSS。

---

## 使用方法

1. `web_components_create`，表字段 `type=layout`，`components_code` 任意合法字母数字。
2. 主题 CSS 放到 `website/layout/{code}/css/`，完整 URL 写入 `translations[].css_url`。不要写 `html_url`。
3. 一页只注入**一套** layout。选择顺序（命中即停）：
   - 本页关联了 `type=layout` 的组件 → 用 `sort_order` 最小的那份。关联只为选主题，不在正文渲染。
   - 否则加载 `components_code` **恰好等于** `layout` 的那一条（这是编码约定，不是 type）。
   - 再没有 → 不加载，不回退其它文件。
4. 换肤：改该组件 CSS 里 token 的**值**，或另建一个 `type=layout` 的组件并给目标页改关联。不要改变量名，不要把两套主题堆进同一个 code 的目录里互相覆盖。

`metadata` 禁止含 `type`。

---

## 使用案例

**全站同一套主题。** 给每个出站页关联同一个 `type=layout` 组件（sort=1）；或者租户内保留一条 `components_code=layout` 的记录，各页不再关联其它 layout。

**仅某页换肤。** 只给该页关联另一个 `type=layout` 组件。未关联的页走上面的第 2、3 档。

**列表页需要更宽的版心。** 另建一个 layout（另一份 token 值，例如列表 max-width），只挂在页面 `type=list` 的页上。不要往普通主题里堆列表专用 class。

---

## 注意细节

- 创建时必须显式 `type=layout`。漏传会变成 `static` 并试图进正文。
- 库里可以同时存在多个 layout 实例；名字任意。不要假设「某个固定 code 才是主题」。
- `components_code=layout` 才会被当成「未关联时的默认主题」。其它 code 必须靠页面关联才会加载。
- 禁止 Tailwind / Bootstrap、全站 `.btn` / `.container`、把 vendor 或业务 JS 塞进 layout。
