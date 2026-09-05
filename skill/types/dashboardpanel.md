# type=`dashboardpanel`

路径与调用见文档根 `assets.md`。壳见 `types/dashboard.md`。

## 功能

会员中心**子块**：侧栏导航、资料、密码、地址、订单、支付、订阅订单/支付、编辑资料弹层等。

**不要挂到页面。** 只出现在 dashboard 壳 HTML 的 `{{code}}` 里。误挂会被从正文滤掉。

---

## 使用方法

1. 创建组件，显式 `type=dashboardpanel`，code 仅字母数字。
2. `parent_id` = 本套壳 id。文件在 `website/dashboardpanel/{code}/`。
3. 改某块文案或链接：改该 panel 的 HTML，页面关联不用动。
4. 壳要换块：改壳里的 `{{code}}`。

子块缺失则该占位为空。

---

## 使用案例

**只改「我的地址」文案。** 找到 `type=dashboardpanel` 且承担地址职能的那条，改它的皮。

**增加一块新面板。** 新建 dashboardpanel，写入壳 HTML 对应位置，并保证 hash/导航能指到它。

---

## 注意细节

- 漏传 type 变成 static；若被挂到页面会进正文。
- 与 chrome 一样：一套壳配一套子块，禁止跨套 `{{code}}`。
