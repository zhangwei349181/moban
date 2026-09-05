# type=`chrome`

路径与调用见文档根 `assets.md`。壳见 `types/header.md`、`types/footer.md`。

## 功能

在需要**头或底里的一块独立 UI**时使用：logo、主导航、语言切换、货币、购物车图标、愿望清单图标、版权等。

**不要挂到页面。** 只出现在 header / footer 壳 HTML 的 `{{code}}` 里。误挂到页面时，内核从正文滤掉。

不要用本类型做整行头/底（那是 `header` / `footer`），也不要做正文区块（那是 `static` 等）。

---

## 使用方法

1. 创建组件，表字段 `type=chrome`，code 仅字母数字。
2. `parent_id` 设为本套壳的组件 id（整套复制用）。渲染不读 parent，只读壳里的 `{{code}}`。
3. 文件在 `website/chrome/{code}/`，不要放进 `website/static/` 或壳目录。
4. `translations` 的 `html_url` / `css_url` 必填。根 class = code。
5. 壳要换子块：改壳 HTML 里的 `{{code}}` 字符串，使它等于新子块的 `components_code`。

子块缺失时该占位为空，不回退。

---

## 使用案例

**只改 logo 图。** 改该 chrome 组件 `media/` 与 HTML 里的 img URL，bump `?v=`。页面关联不用动。

**新做一套头。** 新建 header 壳 + 若干 chrome（logo、nav…）。壳 HTML 只写这批新 code。即使视觉与旧套相同，也不要引用旧套 `{{code}}`。

**购物车数量角标。** 做成 chrome，嵌在头或底上。购物车**页面**本身是 `type=cart`，不要把整页购物车当 chrome。

---

## 注意细节

- 创建时必须显式 `type=chrome`。漏传变成 `static`，若再被挂到页面会变成正文垃圾块。
- 禁止跨套复用：每套壳的子块 code 独立。
- 同一 `{{code}}` 在壳里可以出现多次。
