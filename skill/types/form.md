# type=`form`

路径与调用见文档根 `assets.md`。登录/注册不是本文。

## 功能

在需要**后台模板驱动的表单**（联系、咨询、报名）时使用。内核按 `template_id` 拉字段定义，注入 `{{FORM_*}}`，提交由内核处理。

不要用 `static` 手写 `<form>` 去提交。不要改皮来增删字段——改后台表单模板。

`template_id` 是后台**表单**模板 UUID，不是 `gt6_web_template`，也不是文章内容模板。`form_type` 是提交业务类型（默认 `contact`），不要写成组件 `type`。

---

## 使用方法

1. 创建组件，显式 `type=form`。`html_url` 必填。
2. metadata **必须有** `template_id`。没有或拉不到字段 → 走 `{{#FORM_IS_PENDING}}`，不报错。
3. 还可写 `form_type`、`header.title` / `subtitle`、`submit_label` 或 `cta.label`。
4. 可挂任意展示页。联系页 `page_code` 可自定（无内核硬跳转）。
5. 关联默许覆盖：`template_id`、`form_type`、标题/按钮。

文件在 `website/form/{code}/`。

---

## 使用案例

**联系页。** 页面 SEO + pageheader + 本组件。关联只写真实的 `template_id`。

**同一皮、两个不同后台模板。** 两个页面挂同一个 form 组件，关联分别写不同 `template_id`。

---

## 注意细节

- 漏传组件 type 不会拉字段、不会提交。
- 页面 metadata 禁止 `content` / `markdowncode` / `htmlcode`。
