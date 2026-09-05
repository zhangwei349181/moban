# type=`signup`

路径与调用见文档根 `assets.md`。登录见 `types/login.md`。

## 功能

在注册页创建账号。页面 `type=general`，`page_code` 必须是 `signup`（URL `/signup`）。登录页「去注册」默认指向这里。

不要用 `static` 手写注册表。

---

## 使用方法

1. 创建组件，显式 `type=signup`。
2. 保留参考实现里的 `data-*` 与字段名，不要自定义 init 重写注册。
3. 成功后的去向与租户 `email_verify` 有关：可能先到 `/verifyemail`，否则按该组件约定的成功地址。
4. 关联默许覆盖标题、按钮、跳转 URL。sort 建议与登录页相同结构。

文件在 `website/signup/{code}/`。

---

## 使用案例

**标准注册。** 复用租户已有 `type=signup` 组件，改文案用关联。

**注册与登录互跳。** 不要改两个固定 `page_code`。

---

## 注意细节

- 漏传 type 不会走注册提交。
- `page_code` 不要写成 `sign-up`。
