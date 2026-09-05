# type=`header`

路径与调用见文档根 `assets.md`。子块见 `types/chrome.md`。

## 功能

在需要**站点头部壳**时使用：整行布局、汉堡/抽屉、以及用 `{{子组件code}}` 嵌套 logo、导航、语言、购物车等。

一页通过页面关联挂**一个** header。不要用本类型做正文 Hero，也不要把 logo 本身建成 `header`（那是 `chrome`）。

---

## 使用方法

1. 创建组件，表字段 `type=header`，code 仅字母数字。
2. 页面关联该组件，建议 `sort_order=2`。`bare` 建议 `true`。
3. 壳 HTML 一根 `<header class="{code}">`。子块写成 `{{子块code}}`，花括号内只有字母数字，且必须是**本套壳**的 `type=chrome` 组件。
4. 汉堡、抽屉、遮罩写在壳 HTML 里，不要拆成 chrome。
5. 同一 `{{code}}` 可出现多次（例如桌面条和抽屉各嵌一次）；内核按 code fetch 一次，替换每一处。
6. 文件在 `website/header/{code}/`。`translations` 的 `html_url` / `css_url` 必填。

漏传 `type` 会变成 `static`，头会进正文、不会嵌套子块。

---

## 使用案例

**全站共用一头。** 各页关联同一个 header 组件。改导航链接：改对应 chrome 子块的 HTML，页面关联不用动。

**某几页换另一套头。** 另建一套 header + 一套专用 chrome，只给那些页改关联。新壳 HTML 只写新套的 `{{code}}`。

**复制到其它租户。** `web_components_copy` 拷**壳**（含子树）。`parent_id` 指向本套壳，便于整套带走。渲染仍只靠 `{{code}}`。

---

## 注意细节

- `chrome` **不要**挂到页面。
- 一套壳配一套子块，禁止跨套引用（A 套壳里不要写 B 套子块的 `{{code}}`）。header 不要引用 footer 的子块。
- 不要把子块的 code 起成「类型名 + 纯数字」这种壳形态，以免和壳抢名。
- 没有 `html_url`：壳显示「没有可加载的模板」。
