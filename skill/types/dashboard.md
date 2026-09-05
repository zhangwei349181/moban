# type=`dashboard`

路径与调用见文档根 `assets.md`。子块见 `types/dashboardpanel.md`。

## 功能

在会员中心页提供**壳**：左右布局、移动端抽屉、内容面板包裹，并用 `{{子组件code}}` 嵌套各业务面板。

页面 `type=general`，`page_code` 必须是 `dashboard`（URL `/dashboard`）。头底账户入口、登录成功默认落到这里。未登录由壳客户端跳 `/login?return=/dashboard`。

**只挂壳，不要把 panel 挂到页面。**

---

## 使用方法

1. 创建组件，显式 `type=dashboard`。
2. 页面只关联本组件（外加 layout / header / pageheader / footer）。
3. 壳 HTML 用 `{{panel的code}}` 引入 `type=dashboardpanel`。`parent_id` 挂到壳，渲染只靠 `{{code}}`。
4. 文件在 `website/dashboard/{code}/`。`html_url` 必填。
5. 结账填地址等深链常用 `/dashboard#addresses` 这类 hash，对应 panel 要能响应。

漏传 type 变成 static，壳不会嵌套子块。

---

## 使用案例

**标准会员中心。** 复用租户已有 dashboard 壳。改侧栏链接：改对应 panel HTML。

**换一套会员中心皮。** 新壳 + 新一套 panel，壳里只写新 `{{code}}`。不要混用旧套子块。

---

## 注意细节

- 不要把子块命名成「dashboard + 纯数字」这种壳形态。
- 不要改 `page_code=dashboard`。
