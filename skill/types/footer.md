# type=`footer`

路径与调用见文档根 `assets.md`。子块见 `types/chrome.md`。

## 功能

在需要**站点底部壳**时使用：品牌区、多列链接、语言/货币、版权、购物车入口等，用 `{{子组件code}}` 嵌套 `type=chrome` 子块。

一页通过页面关联挂**一个** footer。不要用本类型做正文 CTA，也不要把版权条文案建成 `footer`（那是 `chrome`）。

---

## 使用方法

1. 创建组件，表字段 `type=footer`，code 仅字母数字。
2. 页面关联该组件，建议 `sort_order=20`（必须显式传；默认 100 会排到正文前面）。`bare` 建议 `true`。
3. 壳 HTML 一根 `<footer class="{code}">`。子块 `{{子块code}}` 只引用**本套** chrome。
4. 文件在 `website/footer/{code}/`。`html_url` / `css_url` 必填。

漏传 `type` 会变成 `static`，底会进正文、不会嵌套子块。

---

## 使用案例

**全站共用一底。** 各页关联同一个 footer。改某列链接：改对应 chrome HTML。

**换底不换头。** 只改各页关联的 footer 组件。新底必须带自己的 chrome 套，不要复用头部那套 `{{code}}`。

---

## 注意细节

- 与 `header` 相同：子块不挂页面；禁止跨套、跨头底借用 `{{code}}`。
- `parent_id` 挂到本套壳，渲染不靠 parent。
- `sort_order` 忘记显式传时，底会跑到主内容前面。
