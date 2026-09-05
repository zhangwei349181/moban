# type=`static`

路径与调用见文档根 `assets.md`。

## 功能

在需要 **Hero、特性、CTA、图文、评语** 等**没有服务端数据契约**的展示区块时使用。不调文章/产品 API，没有 `template_id`、`list_path`、`article_id`、`tabs`。

可挂任意展示页（通常页面 `type=general`）。一页可以挂多个，按关联 `sort_order` 排列。

不要用本类型做：列表/详情/表单/登录/结账/头底。那些必须用对应动态 type，否则占位符不会被注入。

---

## 使用方法

1. 创建组件，显式 `type=static`（这也是漏传时的默认值，但其它类型更要显式传，以免误成 static）。
2. 文案写在 HTML 里。`html_url` 必填。`bare` 建议 `true`。
3. 根：一根 `<section class="{code}">`。多语言多份 HTML，class 一致，只换可见文案。
4. 挂到页面：`web_page_components_create`，sort 放在 header 与 footer 之间。
5. 同一皮挂到另一页、只换本页句子：改**关联**或改 HTML，不改 type。

文件在 `website/static/{code}/`。

---

## 使用案例

**首页加一块宣传区。** 本租户已有合适的 `type=static` 就直接关联；没有再 copy 或新建。不要为这一块再挂一套 layout/header。

**两页共用一块结构、文案不同。** 同一个 static 组件挂两页，用关联 metadata 覆盖约定文案字段；或改 HTML（会两页一起变）。

---

## 注意细节

- 不要在 static 的 metadata 上写 `article_type` / `tabs` / `list_path`。
- 拉不到 `html_url` 显示「没有可加载的模板」。
- 图必须走本组件 `media/` 的完整 URL。
