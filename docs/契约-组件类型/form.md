# type=`form`（动态表单）

Skill 可读的组件类型契约。做联系我们、咨询、报名等**后台模板驱动的表单**时读本文。不要从 a0005 的 Tailwind `form` HTML 直接入库。不要用 `static` 手写 `<form>` 去提交。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。

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

不要用默认的 `application/octet-stream`。

---

## 1. 何时读 / 何时不读

| 任务 | 读本文？ |
|------|----------|
| 联系我们 / 咨询 / 报名表单 | 是 |
| 把 a0005 某个 `form` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 改表单字段结构 | 否：改后台内容模板（`template_id`），不要改皮去增删字段 |
| 登录 / 注册 | 否：`login` / `signup` |
| 静态 Hero、地址卡片 | 否：`static`（可与 form 同页） |

---

## 2. 它是什么

`form` 是**动态表单区块**：内核 SSR 按 `template_id` 拉后台字段定义，注入 `html_url` 的 `{{FORM_*}}`，提交由内核 `formSection.client` 处理（校验、文件上传、`POST form-submissions`）。

- **必须有 `template_id`**（后台表单模板 UUID）。没有或拉不到字段时，皮走 `{{#FORM_IS_PENDING}}`，不报错。
- 可挂到任意展示页。联系页 `page_code=contact` 通常只挂一个。
- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 字段结构来自模板 API，皮只负责外壳与样式。

内核：组件记录 `type===form` → `form.astro`。不再要求名字是 `form` / `form01`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"form"` |
| 组件 `metadata` | **没有组件 type**。`form_type` 是提交业务类型（如 `contact`），不要写成组件 `type` |
| 页面-组件关联行 | **没有组件 type** |

创建时**显式传** `type=form`。漏传会变成默认 `static`，占位符原样输出、不会拉字段也不会提交。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `form01`，**不要** `contact-form` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.form01` |
| 组件字段 `type` | `"form"` |

旧 code `contactform` / `dynamicform` 仅兼容已有租户。

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/form/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/form/{components_code}/html
website/form/{components_code}/css
website/form/{components_code}/js
website/form/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 区块 init（可选） | `js/` | `{code}.js` |

硬性：`css_url` **必填**。禁止 `/images/…`、站点相对路径、其它业务租户、内核 fallback 的 `/assets/form.css`。皮 CSS 必须覆盖输入框、提交按钮、`[data-form-message]`、`.dynamic-form-field.has-error`，不要假设全局有 `.btn`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-form-section>`。
2. **必须留下本文占位符与 data 钩子**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。若写自定义 JS，必须包 IIFE。提交逻辑**不要**在自定义 init 里重写。
6. `{{FORM_FIELD_HTML}}` **不要再 escape**。不要在 HTML 注释里写 `{{...}}` 字面量。

### 6.1 必须保留的钩子

| 选择器 / 占位 | 说明 |
|---------------|------|
| `[data-form-section]` | 根 |
| `[data-dynamic-form]` | `<form>` |
| `data-template-id` / `data-form-type` / `data-form-i18n` | 提交所需 |
| `[data-form-submit]` | 提交按钮 |
| `[data-form-message]` | 成功 / 失败提示 |
| `{{#FORM_FIELD}}` + `{{FORM_FIELD_HTML}}` | 字段（自带 `data-field-key`） |

### 6.2 标量

| 占位符 | 说明 |
|--------|------|
| `{{FORM_TITLE}}` | 标题 |
| `{{FORM_SUBTITLE}}` | 副标题 |
| `{{FORM_PENDING_MESSAGE}}` | 未配置模板时的提示 |
| `{{FORM_SUBMIT_LABEL}}` | 提交按钮文案 |
| `{{FORM_TEMPLATE_ID}}` | `data-template-id` |
| `{{FORM_TYPE}}` | `data-form-type` |
| `{{FORM_I18N_JSON}}` | 已转义的 `data-form-i18n` |
| `{{FORM_FIELDS}}` | 全部字段 HTML 拼接（无栅格时可用） |

### 6.3 条件块与循环

| 块 | 说明 |
|----|------|
| `{{#FORM_HAS_HEADER}}` | 有标题或副标题 |
| `{{#FORM_HAS_TITLE}}` / `HAS_SUBTITLE` | 标题 / 副标题 |
| `{{#FORM_IS_READY}}` | 模板有效，渲染 `<form>` |
| `{{#FORM_IS_PENDING}}` | 等待配置 |
| `{{#FORM_FIELD}}…{{/FORM_FIELD}}` | 循环。内置 `FORM_FIELD_HTML`、`FORM_FIELD_COL_CLASS`（通栏为 `form-field--wide`）、`FORM_FIELD_KEY` / `TYPE` / `LABEL` |

最小结构：

```html
<section class="form01" data-form-section>
  {{#FORM_IS_PENDING}}<p>{{FORM_PENDING_MESSAGE}}</p>{{/FORM_IS_PENDING}}
  {{#FORM_IS_READY}}
  <form
    data-dynamic-form
    data-template-id="{{FORM_TEMPLATE_ID}}"
    data-form-type="{{FORM_TYPE}}"
    data-form-i18n="{{FORM_I18N_JSON}}"
    novalidate
  >
    {{#FORM_FIELD}}
    <div class="{{FORM_FIELD_COL_CLASS}}">{{FORM_FIELD_HTML}}</div>
    {{/FORM_FIELD}}
    <div data-form-message hidden role="alert"></div>
    <button type="submit" data-form-submit>{{FORM_SUBMIT_LABEL}}</button>
  </form>
  {{/FORM_IS_READY}}
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 下；字段钩子（`.dynamic-form-field`、`.form-field__control`、`.form-field--wide`、`[data-form-message]`）也写在**本组件 CSS**。只引用 layout token；断点写死 640 / 768 / 1024 / 1280。自己用 `max-width` + `padding-inline: var(--page-pad)`。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核始终跑提交逻辑。有自定义 init 时仍加载提交逻辑；**不要**在自定义 init 里写提交。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `form01` |
| `type` | `"form"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止组件 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `template_id` | 后台表单模板 UUID，**必填**才出表单 |
| `form_type` | 提交业务类型，默认 `contact` |
| `header.title` / `header.subtitle` | 区块标题；可用 `header.translations` |
| `submit_label` 或 `cta.label` | 提交按钮；可用 `cta.translations` |
| `translations[]` | 每语言 `html_url`、`css_url`；可选 `init_script_url` |

`translations[].language` 与 `language_code` 都写上（`en` / `zh-CN`）。

关联行默许覆盖：`template_id`、`form_type`、标题/按钮文案。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 联系我们页

`page_code` 用 `contact`（URL `/contact`）。页面 metadata **只留 SEO**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**、**form `10`**、footer `20`。

pageheader 关联示例：

```json
{
  "header": { "title": "Contact Us" },
  "show_title": true,
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label": "Contact", "current": true }
    ]
  }
}
```

form 关联可只写 `template_id`（皮已在组件上）：

```json
{ "template_id": "0c9d6fd7-8e09-48d6-a309-381e073aef9b" }
```

---

## 9. 入库清单

- [ ] `type=form`（组件字段，不在 metadata）
- [ ] `website/form/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-form-section`、`data-dynamic-form`、`data-form-submit`、`FORM_FIELD`
- [ ] CSS 无 Tailwind；`css_url` 必填；覆盖输入 / 按钮 / 消息 / 错误态
- [ ] 无自定义 init，或不重写提交
- [ ] 组件或关联上有有效 `template_id`
- [ ] 联系页 `page_code=contact`，只关联 code + sort
