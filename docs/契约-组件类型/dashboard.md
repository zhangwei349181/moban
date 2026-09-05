# type=`dashboard` / `dashboardpanel`（会员中心壳与子块）

Skill 可读的组件类型契约。做会员中心页时读本文。不要从 a0005 的 Tailwind `dashboard` HTML 直接入库。不要用 `static` 手写侧栏和面板。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。头底嵌套模式见 [chrome.md](./chrome.md)。结账回跳地址默认 `/dashboard#addresses`。

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
| 会员中心页 `/dashboard` | 是：壳 `dashboard` + 子块 `dashboardpanel` |
| 只改侧栏链接、某块面板文案 | 是：改对应子块 HTML，页面关联不用动 |
| 换一套会员中心皮 | 是：新壳 + 新子块，或只换壳里的 `{{code}}` |
| 登录后跳转、邮箱验证 | 否：`login` / `verifyemail`；落地默认 `/dashboard` |
| 结账填账单地址 | 否：`checkout`；链接到 `/dashboard#addresses` |

newworld 的「等级 > 1 / account-pending」**不在**本契约范围内。未登录由壳客户端跳 `/login?return=`。

---

## 2. 两个 type 怎么分工

| type | 角色 | 页面关联？ | 内核 |
|------|------|------------|------|
| `dashboard` | **壳**：左右布局、移动端抽屉、`data-dashboard-content-panel` 包裹、`{{子组件code}}` | **要**。一页通常只挂一个 | `dashboard.astro` |
| `dashboardpanel` | 壳里的子块：导航、各业务面板、编辑资料弹层 | **不要**挂到页面。只出现在壳 HTML 的 `{{code}}` 里 | 壳渲染时按 code **fetch** 子组件 HTML/CSS/JS |

页面只关联壳（外加 theme / header / pageheader / footer）。子块靠模板占位符拉取。误把 dashboardpanel 挂到页面时，内核从正文过滤掉（开发态会警告）。壳没有 `html_url` 时显示「没有可加载的模板」；子块缺失则该占位为空。

内核选渲染器看组件记录的 `type`。旧名 `userdashboard` / `accountdashboard` / `dashboardaddresses`（无数字后缀）仅兼容已有租户。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"dashboard"` 或 `"dashboardpanel"` |
| 组件 `metadata` | **没有组件 type** |
| 页面-组件关联行 | **没有组件 type** |

创建时**显式传** `type`。漏传会变成默认 `static`，壳不会嵌套子块。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$` |
| 壳 | `dashboard01`（类型名 + 数字）。**不要** `user-dashboard` |
| 子块 | `dashboardnav01`、`dashboardaddresses01`、`dashboardpassword01`、`dashboardorders01`、`dashboardsubscriptionorders01`、`dashboardpayments01`、`dashboardsubscriptionpayments01`、`dashboardprofile01` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同 |
| 页面 `page_code` | `dashboard`（URL `/dashboard`） |

`parent_id`：子块可以挂到壳组件 id 上，便于 CMS 树状浏览；**渲染不靠** parent，只靠 `{{code}}`。

不要把子块命名成 `dashboard01`（那是壳：`dashboard` + 纯数字）。

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/dashboard/{code}/{html|css|js|media}/{文件名}
https://tenantdoc.gt6ai.xyz/{租户id}/website/dashboardpanel/{code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/dashboard/{code}/html|css|js|media
website/dashboardpanel/{code}/html|css|js|media
```

硬性：壳走 `website/dashboard/`，子块走 `website/dashboardpanel/`。`css_url` **必填**。禁止 Tailwind / Bootstrap / `.btn`。皮 CSS 必须覆盖内核注入的 `.dashboard-section__*`、`.dashboard-nav__*`、`.dashboard-address-card`、`.dashboard-list-card`、`.dashboard-status`、`.dashboard-modal`、`.dashboard-section__hidden`。

---

## 6. 壳 HTML 合同

1. **一根语义根** `<section class="{code}" data-dashboard-section data-dashboard-config="{{DASHBOARD_CONFIG_JSON}}">`。
2. 子块用 **`{{components_code}}`**，花括号内只有字母数字。全大写的 `{{DASHBOARD_CONFIG_JSON}}` 是内核标量，**不是**子组件。
3. 内容区每个面板外包一层 `[data-dashboard-content-panel="{id}"]`。id 固定为：`addresses` / `password` / `orders` / `subscription_orders` / `payments` / `subscription_payments`。默认可见的那层加 `dashboard-content-panel--active`，其余加 `dashboard-section__hidden`。
4. 侧栏根留 `[data-dashboard-sidebar]`；小屏开关：`[data-dashboard-menu-open]` / `[data-dashboard-menu-close]`。
5. 页头已有 H1 时，壳内不要再放 H1。
6. 内核以经典 `<script src>` 加载自定义 init（非 module）。会员中心读写不要在自定义 init 里重写，除非 `use_platform_ui=false`。

最小壳：

```html
<section class="dashboard01" data-dashboard-section data-dashboard-config="{{DASHBOARD_CONFIG_JSON}}">
  <button type="button" data-dashboard-menu-open>Menu</button>
  <aside data-dashboard-sidebar>{{dashboardnav01}}</aside>
  <div>
    <div data-dashboard-content-panel="addresses" class="dashboard-content-panel--active">{{dashboardaddresses01}}</div>
    <div data-dashboard-content-panel="password" class="dashboard-section__hidden">{{dashboardpassword01}}</div>
    <div data-dashboard-content-panel="orders" class="dashboard-section__hidden">{{dashboardorders01}}</div>
    <div data-dashboard-content-panel="subscription_orders" class="dashboard-section__hidden">{{dashboardsubscriptionorders01}}</div>
    <div data-dashboard-content-panel="payments" class="dashboard-section__hidden">{{dashboardpayments01}}</div>
    <div data-dashboard-content-panel="subscription_payments" class="dashboard-section__hidden">{{dashboardsubscriptionpayments01}}</div>
  </div>
  {{dashboardprofile01}}
</section>
```

---

## 7. 子块 HTML 合同与钩子

| 子块 | 根 / 关键钩子 | 内核 |
|------|----------------|------|
| `dashboardnav01` | `[data-dashboard-nav-link][data-dashboard-section]`、`[data-dashboard-logout]`、`[data-dashboard-user-avatar]`、`[data-dashboard-user-name]`、`[data-dashboard-user-email]`、`[data-dashboard-menu-close]` | 侧栏资料、面板切换、登出 |
| `dashboardaddresses01` | `[data-dashboard-loading]` / `error` / `empty` / `[data-dashboard-address-list]` / `[data-dashboard-address-add]`；弹层 `data-dashboard-modal="address-form"` | 地址 CRUD |
| `dashboardpassword01` | `[data-dashboard-password-form]`、`current_password` / `new_password` / `confirm_password`、`[data-dashboard-password-submit]` | 改密 |
| `dashboardorders01` 等列表 | `[data-dashboard-table]` / `[data-dashboard-tbody]` / `[data-dashboard-cards]` / `[data-dashboard-pagination]`；弹层 `data-dashboard-detail-content` | 订单 / 订阅 / 支付列表 |
| `dashboardprofile01` | `data-dashboard-modal="edit-profile"`、`[data-dashboard-profile-save]`、`[data-dashboard-avatar-upload]` | 点头像打开 |

列表弹层 `data-dashboard-modal` 取值：`order-detail` / `subscription-order-detail` / `payment-detail` / `subscription-payment-detail`。

导航 `data-dashboard-section` 必须与壳上的 `data-dashboard-content-panel` 一致（下划线，不要 `subscription-orders`）。

---

## 8. CSS / JS

选择器挂在根 class 与 `[data-dashboard-section]` 下。只引用 layout token。断点写死 1024（侧栏抽屉 / 桌面表与移动卡片）。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核始终跑 `dashboard*.client`（`use_platform_ui` 默认 true）。

---

## 9. 组件字段与 metadata

### 9.1 壳

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `dashboard01` |
| `type` | `"dashboard"` |
| `bare` | 根为 `<section>` 时建议 `true` |
| `login_url` | 默认 `/login` |
| `home_url` | 登出后，默认 `/` |
| `default_panel` | 无 hash 时打开的面板，默认 `addresses` |
| `translations[]` | 每语言 `html_url`、`css_url` |

### 9.2 子块

| 字段 | 说明 |
|------|------|
| `type` | `"dashboardpanel"` |
| `parent_id` | 可选，壳组件 id |
| `translations[]` | 每语言 `html_url`、`css_url` |

### 9.3 页面

`page_code` 用 `dashboard`。页面 metadata **只留 SEO**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**、**dashboard 壳 `10`**、footer `20`。**不要**再把 nav / 面板关联到页面。

pageheader 关联示例：

```json
{
  "header": { "title": "Account" },
  "show_title": true,
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "dashboard_title", "current": true }
    ]
  }
}
```

---

## 10. 入库清单

- [ ] 壳 `type=dashboard`，子块 `type=dashboardpanel`（都不在 metadata）
- [ ] 壳 HTML 含 `data-dashboard-section`、`{{DASHBOARD_CONFIG_JSON}}`、各 `{{dashboard*01}}` 与 `data-dashboard-content-panel`
- [ ] 子块 HTML 含上表钩子；CSS 无 Tailwind；覆盖注入 class
- [ ] 会员中心页 `page_code=dashboard`，只关联壳 + chrome，不关联子块
