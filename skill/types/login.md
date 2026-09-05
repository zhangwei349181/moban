# type=`login`

路径与调用见文档根 `assets.md`。

## 功能

在登录页收集账号口令并提交。页面 `type=general`，`page_code` 必须是 `login`（URL `/login`）。结账、会员中心未登录会跳到这里，并可能带 `?return=`。

不要用 `static` 手写登录框。

---

## 使用方法

1. 创建组件，显式 `type=login`。
2. HTML 必须含规定的 `data-login-*` 与字段名（标识符、密码）。不要写自定义 init 重写登录。
3. metadata：`success_url`（默认 `/dashboard`；`?return=` 优先）、`signup_url`（默认 `/signup`）、忘记密码地址。
4. 若租户 `metadata.email_verify===true` 且邮箱未验证，成功后先去 `/verifyemail`。
5. 关联顺序建议：layout 1、header 2、pageheader 5、本组件 10、footer 20。

文件在 `website/login/{code}/`。

---

## 使用案例

**标准登录。** 复用租户已有的 `type=login` 组件，只改 SEO 或关联标题。

**登录后回活动页。** 依赖入口带的 `?return=`，不要改 `page_code`。

---

## 注意细节

- 改名 `page_code` 会导致全站回跳失败。
- 漏传组件 type 表单不会按登录逻辑提交。
