# type=`verifyemail`（邮箱验证）

Skill 可读的组件类型契约。做登录/注册后的邮箱 OTP 验证页时读本文。不要从 a0005 的 Tailwind `verify` HTML 直接入库。不要用 `form` 或 `static` 手写发码/确认。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。登录见 [login.md](./login.md)。注册见 [signup.md](./signup.md)。

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
| 登录/注册后邮箱 OTP 验证页 | 是 |
| 租户是否要开邮箱验证 | 否：改租户静态 JSON `metadata.email_verify` |
| 登录 / 注册表单 | 否：`login` / `signup` |

---

## 2. 它是什么

`verifyemail` 是**邮箱验证区块**：内核把文案与 URL 注入 `html_url` 的 `{{VERIFYEMAIL_*}}`，发码/确认由内核 `verifyEmail.client` 处理。

闸门：登录或注册成功后，客户端拉租户静态 JSON

```
https://gt6json.shopasb.io/tenant_{租户id}/tenants/tenant-{租户id}.json
```

仅当 `data.metadata.email_verify === true` **且** 本地用户 `email_verified !== true` 时，跳到 `/verifyemail?email={邮箱}&return={原落地页}`。`email_verify` 为 false / 缺省时，仍走 login/signup 的 `success_url`。

- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 验证页 `page_code=verifyemail`（URL `/verifyemail`，**不要** `verify-email`）。通常只挂一个。
- 未登录 → `/login`。租户未开验证或已验证 → `success_url` 或 `?return=`。没有邮箱 → `/signup`。
- 发送接口 409 视为已经验证过：写本地 `email_verified` 并跳转。
- 同一会话同一邮箱只自动发一次码（`sessionStorage`）。

内核：组件记录 `type===verifyemail` → `verifyemail.astro`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"verifyemail"` |
| 组件 `metadata` | **没有组件 type** |
| 页面-组件关联行 | **没有组件 type** |

创建时**显式传** `type=verifyemail`。漏传会变成默认 `static`，占位符原样输出、不会发码。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `verifyemail01`，**不要** `verify-email` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.verifyemail01` |
| 组件字段 `type` | `"verifyemail"` |
| 页面 `page_code` | `verifyemail`（URL `/verifyemail`） |

旧 code `emailverify` / `verifymail` 仅兼容已有租户。

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/verifyemail/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/verifyemail/{components_code}/html
website/verifyemail/{components_code}/css
website/verifyemail/{components_code}/js
website/verifyemail/{components_code}/media
```

硬性：`css_url` **必填**。禁止 `/images/…`、站点相对路径、其它业务租户、内核 fallback 的 `/assets/verifyemail.css`。皮 CSS 必须覆盖输入框、提交/重发按钮、`[data-verifyemail-error]` / `[data-verifyemail-success]`，不要假设全局有 `.btn`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-verifyemail-section>`。
2. **必须留下本文占位符与 data 钩子**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。若写自定义 JS，必须包 IIFE。发码/确认**不要**在自定义 init 里重写。
6. 不要在 HTML 注释里写 `{{...}}` 字面量。

### 6.1 必须保留的钩子

| 选择器 / 占位 | 说明 |
|---------------|------|
| `[data-verifyemail-section]` | 根 |
| `[data-verifyemail-form]` | `<form>` |
| `data-verifyemail-i18n` / `data-success-url` | 文案与验证成功跳转 |
| `data-login-url` / `data-signup-url` | 未登录 / 无邮箱时的去向 |
| `name="code"` | 验证码 |
| `[data-verifyemail-email]` | 展示目标邮箱（客户端填） |
| `[data-verifyemail-hint]` | 有效期提示 |
| `[data-verifyemail-error]` / `[data-verifyemail-success]` | 失败 / 成功 |
| `[data-verifyemail-submit]` / `[data-verifyemail-submit-text]` | 确认 |
| `[data-verifyemail-resend]` / `[data-verifyemail-resend-text]` | 重发（含冷却） |

### 6.2 标量与条件

| 占位符 | 说明 |
|--------|------|
| `{{VERIFYEMAIL_TITLE}}` / `{{VERIFYEMAIL_SUBTITLE}}` | 标题 / 副标题 |
| `{{VERIFYEMAIL_SENT_TO_LABEL}}` | 「验证码已发送至」 |
| `{{VERIFYEMAIL_CODE_LABEL}}` / `{{VERIFYEMAIL_CODE_PLACEHOLDER}}` | 验证码字段 |
| `{{VERIFYEMAIL_SUBMIT_LABEL}}` / `{{VERIFYEMAIL_RESEND_LABEL}}` | 确认 / 重发 |
| `{{VERIFYEMAIL_HOME_URL}}` | 回首页 |
| `{{VERIFYEMAIL_LOGIN_URL}}` / `{{VERIFYEMAIL_SIGNUP_URL}}` | 登录 / 注册 |
| `{{VERIFYEMAIL_SUCCESS_URL}}` | `data-success-url`，默认 `/dashboard`；URL 有 `?return=/path` 时优先 |
| `{{VERIFYEMAIL_I18N_JSON}}` | 已转义的 `data-verifyemail-i18n` |
| `{{#VERIFYEMAIL_HAS_TITLE}}` / `HAS_SUBTITLE` / `HAS_HEADER` | 条件块 |

最小结构：

```html
<section class="verifyemail01" data-verifyemail-section>
  <form
    data-verifyemail-form
    data-verifyemail-i18n="{{VERIFYEMAIL_I18N_JSON}}"
    data-success-url="{{VERIFYEMAIL_SUCCESS_URL}}"
    data-login-url="{{VERIFYEMAIL_LOGIN_URL}}"
    data-signup-url="{{VERIFYEMAIL_SIGNUP_URL}}"
    novalidate
  >
    <strong data-verifyemail-email></strong>
    <input name="code" required autocomplete="one-time-code" />
    <p data-verifyemail-hint></p>
    <div data-verifyemail-error hidden role="alert"></div>
    <div data-verifyemail-success hidden role="status"></div>
    <button type="submit" data-verifyemail-submit>
      <span data-verifyemail-submit-text>{{VERIFYEMAIL_SUBMIT_LABEL}}</span>
    </button>
    <button type="button" data-verifyemail-resend>
      <span data-verifyemail-resend-text>{{VERIFYEMAIL_RESEND_LABEL}}</span>
    </button>
  </form>
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 下；错误/成功、输入、提交与重发按钮写在**本组件 CSS**。只引用 layout token。自己用 `max-width` + `padding-inline: var(--page-pad)`。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核始终跑发码/确认逻辑。

发码 / 确认走邮箱服务 `PUBLIC_EMAIL_API_BASE`（默认 `https://email.goodsoftwarepro.com/api/v1`）：

- `POST /mailbox/verification/email/send` `{ email, purpose }`
- `POST /mailbox/verification/email/confirm` `{ email, code, purpose }`
- `purpose`：`register_email`（默认）或 `login_email`

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `verifyemail01` |
| `type` | `"verifyemail"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止组件 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `header.title` / `header.subtitle` | 卡片标题 |
| `success_url` | 验证成功跳转，默认 `/dashboard`；URL 有 `?return=/path` 时优先 |
| `login_url` | 默认 `/login` |
| `signup_url` | 默认 `/signup` |
| `translations[]` | 每语言 `html_url`、`css_url` |

关联行默许覆盖：标题、按钮文案、`success_url`。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 验证页

`page_code` 用 `verifyemail`（URL `/verifyemail`）。页面 metadata **只留 SEO**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**、**verifyemail `10`**、footer `20`。

pageheader 关联示例：

```json
{
  "header": { "title": "Verify email" },
  "show_title": true,
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "verifyemail_title", "current": true }
    ]
  }
}
```

---

## 9. 入库清单

- [ ] `type=verifyemail`（组件字段，不在 metadata）
- [ ] `website/verifyemail/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-verifyemail-section`、`data-verifyemail-form`、`data-verifyemail-submit`、`data-verifyemail-resend`、`name="code"`
- [ ] CSS 无 Tailwind；`css_url` 必填；覆盖输入 / 按钮 / 错误与成功态
- [ ] 无自定义 init，或不重写发码/确认
- [ ] 验证页 `page_code=verifyemail`，只关联 code + sort
