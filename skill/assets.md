# 组件资源：放置位置与调用规则

所有皮文件（HTML / CSS / JS / 媒体 / Markdown）按**组件**存放，不按页面存放。本文只讲路径和内核如何调用。某个 `type` 的业务字段、占位符见 `types/{type}.md`。

读本文用 `fetch` 完整 URL：文档根 + `assets.md`。

文档根：

```
https://tenantdoc.gt6ai.xyz/04987bc8-e8e6-432a-b592-430efbe164fc/webdoc/skill/
```

---

## 功能

- 上传、覆盖、列举皮文件时读本文。
- 把返回的公网 URL 写入组件 `translations` 时读本文。
- 解释一页上 CSS/JS 为什么会出现或不会出现时读本文。

不要用本文判断「该用哪个 type」——那是 `components.md` 和各类型文档的事。

---

## 使用方法

### 路径公式

公网（写入 metadata 的必须是完整 URL）：

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/{type}/{code}/{资源类}/{文件名}
```

| 段 | 取值 |
|----|------|
| 租户 id | 由 `r2_upload` 自动加前缀。`directory` / `path` **不要**自己拼 |
| `type` | 组件表字段，与目录段相同：`layout`、`static`、`header`… |
| `code` | 即 `components_code`，仅字母数字，与目录名相同 |
| 资源类 | 固定：`html` / `css` / `js` / `media`；`markdown` 类型另可用 `md` |

`r2_upload` 的 `directory`（不含租户 id）：

```
website/{type}/{code}/html
website/{type}/{code}/css
website/{type}/{code}/js
website/{type}/{code}/media
```

同一组件的目录树：

```
website/{type}/{code}/
  html/     语义 HTML（多语言分文件）
  css/      该组件自己的 CSS
  js/       该组件自己的 JS
  media/    该组件引用的图、字体、视频
```

### 内核如何调用

1. 读组件记录的 `type`，选渲染器。
2. 按当前语言在 `translations[]` 里取 `html_url` / `css_url` / `init_script_url` / `md_url`（以该类型契约为准）。
3. 用完整公网 URL 拉取文件。拉不到 HTML 时显示「没有可加载的模板」，**没有**内核内置回退皮。
4. 本页会渲染的组件树 = 页面关联的组件 + 壳 HTML 里的 `{{子组件code}}` + 本页选中的 `layout`。只收集这棵树上的 `depends` 与 `global_js`。

注入顺序：

```
layout 的 CSS/JS
→ depends 解析出的 vendor（按 URL 去重）
→ 各组件 global_js（去重，整页一次）
→ 各组件 init_script_url（跟在该区块 HTML 后，可每实例一次）
```

| 字段 | 文件放哪 | 何时加载 |
|------|----------|----------|
| `translations[].html_url` | 本组件 `html/` | 渲染该区块 |
| `translations[].css_url` | 本组件 `css/` | 渲染该区块 |
| `init_script_url` | 本组件 `js/` | 该区块之后 |
| `global_js` | 仍在本组件 `js/` | Layout，且本页树包含该组件 |
| `depends` | 参考库 `website/vendor/{id}/` | Layout，本页树有人声明则一次 |

`depends` 默认解析到**参考库租户** `c36a188f-9971-4304-8659-f8048451fb2c` 的 `website/vendor/{id}/js/{id}.js`（及同目录约定 css）。复制组件到业务租户时：**不要**把 vendor 拷过去，也不要把 `depends` 改成业务租户路径。只有客户要改这份共享库时，才拷到业务租户并改成新的完整 URL。

### 上传

- 工具：`r2_upload`。`mode=content` 写正文；`mode=url` 从已有 URL 转入；`mode=list` 看本租户目录。
- `filename` 必须带扩展名。自己填 `title` / `description` / `tags`，不要问用户。
- MIME：HTML `text/html; charset=utf-8`，CSS `text/css; charset=utf-8`，JS `text/javascript`，Markdown `text/markdown`，PNG/JPEG/WebP/SVG 用对应 image 类型。禁止 `application/octet-stream`。
- 成功结果里的完整 `url` 才写入 metadata。改已有文件后 bump `?v=`（或换文件名）再整份替换组件 metadata。

### 写入 metadata 的形状

`type` **不在** metadata。URL 里的 `{租户id}` 用上传返回值，不要手拼。

```json
{
  "bare": true,
  "translations": [
    {
      "language_code": "en-US",
      "is_primary": true,
      "html_url": "https://tenantdoc.gt6ai.xyz/{当前租户id}/website/{type}/{code}/html/{code}_en.html?v=1",
      "css_url": "https://tenantdoc.gt6ai.xyz/{当前租户id}/website/{type}/{code}/css/{code}.css?v=1"
    }
  ]
}
```

---

## 使用案例

**改一块已有皮的 CSS。** `web_static_components_get` → `r2_upload` 覆盖该组件 `css/` → 同一文件名则 URL 加 `?v=` → 整份写回 metadata。

**新建一个有皮的组件。** 先 `web_components_create`（显式 `type` + 字母数字 `code`）→ 按 `website/{type}/{code}/…` 上传 → 把返回 URL 写入 `translations` → 再把组件挂到页面。

**壳嵌套子块。** 子块文件放在 `website/chrome/{子块code}/` 或 `website/dashboardpanel/{子块code}/`，不挂页面。壳 HTML 写 `{{子块code}}`，内核按 code fetch 子组件的 HTML/CSS/JS。

---

## 注意细节

- 禁止 `website/home/…` 这类页面目录。页面没有自己的皮。
- 禁止 `/images/…`、`./…`、站点相对路径。图和字体用**本组件** `media/` 的完整 tenantdoc URL。
- 禁止引用其它**业务**租户的皮。vendor 指向参考库是唯一常规例外。
- 禁止把 A 组件的文件放到 B 的目录，或把 vendor 塞进 layout / 业务组件。
- 自定义 JS 必须包 IIFE；内核用经典 `<script src>`（非 module）。
- 选择器挂在根 class（= `components_code`）下。无 Tailwind / Bootstrap。只引用 layout 的 token，不要发明全站 `.btn`。
- 断点写死 640 / 768 / 1024 / 1280。
- 不要在 HTML 注释里写 `{{...}}` 字面量。服务端已渲染的 HTML 占位符不要再 escape。
