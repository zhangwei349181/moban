# type=`verifyemail`

路径与调用见文档根 `assets.md`。

## 功能

在邮箱 OTP 验证页确认用户邮箱。页面 `type=general`，`page_code` 必须是 `verifyemail`（URL `/verifyemail`）。当租户 `metadata.email_verify=true` 时，登录/注册成功后会进本页。

---

## 使用方法

1. 创建组件，显式 `type=verifyemail`。
2. 保留规定的 `data-*` 与验证码字段，不要重写内核验证流程。
3. 页面编码必须是 `verifyemail`，不要连字符。
4. 关联覆盖标题等文案即可。

文件在 `website/verifyemail/{code}/`。

---

## 使用案例

**租户打开邮箱验证。** 确认该页存在且挂了 `type=verifyemail` 的组件，否则验证流程无处落地。

**租户未打开邮箱验证。** 本页可以存在，但登录成功不会强制跳来。

---

## 注意细节

- 改 `page_code` 会导致验证回跳失败。
- 漏传组件 type 验证码不会按内核逻辑提交。
