# type=`login`（登录）

Skill 可读的组件类型契约。做会员登录页时读本文。不要从 a0005 的 Tailwind `login` HTML 直接入库。不要用 `form` 或 `static` 手写登录提交。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头见 [pageheader.md](./pageheader.md)。注册见 [signup.md](./signup.md)。邮箱验证见 [verifyemail.md](./verifyemail.md)。

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
| 会员登录页 | 是 |
| 把 a0005 某个 `login` 收进 moban 库 | 是：对照视觉**重写** HTML/CSS，占位符与 `data-*` 必须留下 |
| 注册 | 否：`signup` |
| 联系我们 / 咨询表单 | 否：`form` |

---

## 2. 它是什么

`login` 是**登录区块**：内核把文案与 URL 注入 `html_url` 的 `{{LOGIN_*}}`，提交由内核 `login.client` 处理（校验、`login()`、再按租户 `metadata.email_verify` 决定去验证页还是 `success_url` / `?return=`）。

- 页面只做 SEO 壳 + 组件关联。禁止页面 metadata 的 `content` / `markdowncode` / `htmlcode`。
- 登录页 `page_code=login`（URL `/login`）通常只挂一个。

内核：组件记录 `type===login` → `login.astro`。不再要求名字是 `login` / `login01`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"login"` |
| 组件 `metadata` | **没有组件 type** |
| 页面-组件关联行 | **没有组件 type** |

创建时**显式传** `type=login`。漏传会变成默认 `static`，占位符原样输出、不会登录。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `login01`，**不要** `login-form` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.login01` |
| 组件字段 `type` | `"login"` |

旧 code `loginform` / `authlogin` 仅兼容已有租户。

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/login/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/login/{components_code}/html
website/login/{components_code}/css
website/login/{components_code}/js
website/login/{components_code}/media
```

硬性：`css_url` **必填**。禁止 `/images/…`、站点相对路径、其它业务租户、内核 fallback 的 `/assets/login.css`。皮 CSS 必须覆盖输入框、提交按钮、`[data-login-error]`，不要假设全局有 `.btn`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-login-section>`。
2. **必须留下本文占位符与 data 钩子**。改的是皮，不是契约。
3. **禁止** Tailwind / Bootstrap class。禁止 `data-ns-animate`。
4. 多语言 = 两份 HTML，class 与占位符一致，只换可见文案 / `aria-label`。
5. 内核以经典 `<script src>` 加载自定义 `init_script_url`（非 module）。若写自定义 JS，必须包 IIFE。登录逻辑**不要**在自定义 init 里重写。
6. 不要在 HTML 注释里写 `{{...}}` 字面量。

### 6.1 必须保留的钩子

| 选择器 / 占位 | 说明 |
|---------------|------|
| `[data-login-section]` | 根 |
| `[data-login-form]` | `<form>` |
| `data-login-i18n` / `data-success-url` | 提交与跳转 |
| `name="login_identifier"` / `name="password"` | 账号、密码 |
| `name="remember_me"` `value="true"` | 记住我（可选） |
| `[data-login-error]` | 失败提示 |
| `[data-login-submit]` | 提交按钮 |
| `[data-login-submit-text]` | 按钮文案（提交中会被替换） |

### 6.2 标量与条件

| 占位符 | 说明 |
|--------|------|
| `{{LOGIN_TITLE}}` / `{{LOGIN_SUBTITLE}}` | 标题 / 副标题 |
| `{{LOGIN_IDENTIFIER_LABEL}}` / `{{LOGIN_PASSWORD_LABEL}}` | 字段标签 |
| `{{LOGIN_SUBMIT_LABEL}}` | 提交按钮 |
| `{{LOGIN_REMEMBER_LABEL}}` | 记住我 |
| `{{LOGIN_FORGOT_LABEL}}` / `{{LOGIN_FORGOT_URL}}` | 忘记密码 |
| `{{LOGIN_SIGNUP_PROMPT}}` / `{{LOGIN_SIGNUP_LINK_TEXT}}` / `{{LOGIN_SIGNUP_URL}}` | 去注册 |
| `{{LOGIN_HOME_URL}}` | 回首页 |
| `{{LOGIN_SUCCESS_URL}}` | `data-success-url`，默认 `/dashboard` |
| `{{LOGIN_I18N_JSON}}` | 已转义的 `data-login-i18n` |
| `{{#LOGIN_HAS_TITLE}}` / `HAS_SUBTITLE` / `HAS_HEADER` | 条件块 |

最小结构：

```html
<section class="login01" data-login-section>
  <form
    data-login-form
    data-login-i18n="{{LOGIN_I18N_JSON}}"
    data-success-url="{{LOGIN_SUCCESS_URL}}"
    novalidate
  >
    <input name="login_identifier" required autocomplete="username" />
    <input type="password" name="password" required autocomplete="current-password" />
    <input type="checkbox" name="remember_me" value="true" />
    <div data-login-error hidden role="alert"></div>
    <button type="submit" data-login-submit>
      <span data-login-submit-text>{{LOGIN_SUBMIT_LABEL}}</span>
    </button>
    <a href="{{LOGIN_SIGNUP_URL}}">{{LOGIN_SIGNUP_LINK_TEXT}}</a>
  </form>
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 下；`[data-login-error]`、输入、提交按钮写在**本组件 CSS**。只引用 layout token。自己用 `max-width` + `padding-inline: var(--page-pad)`。

**默认不必写 `init_script_url`。** 未配置自定义 init 时，内核始终跑登录逻辑。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `login01` |
| `type` | `"login"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止组件 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `header.title` / `header.subtitle` | 卡片标题 |
| `success_url` | 登录成功跳转，默认 `/dashboard`；URL 有 `?return=/path` 时优先。若租户 `metadata.email_verify === true` 且邮箱未验证，先去 `/verifyemail` |
| `signup_url` | 默认 `/signup` |
| `forgot_url` | 默认 `/forgot` |
| `translations[]` | 每语言 `html_url`、`css_url` |

关联行默许覆盖：标题、按钮文案、`success_url`。不要在关联里再抄一份 `html_url` / `css_url`。

### 8.3 登录页

`page_code` 用 `login`（URL `/login`）。页面 metadata **只留 SEO**。

关联顺序建议：theme `1`、header `2`、**pageheader `5`**、**login `10`**、footer `20`。

pageheader 关联示例：

```json
{
  "header": { "title": "Log in" },
  "show_title": true,
  "breadcrumb": {
    "items": [
      { "label_key": "breadcrumb_home", "href": "/" },
      { "label_key": "login_title", "current": true }
    ]
  }
}
```

---

## 9. 入库清单

- [ ] `type=login`（组件字段，不在 metadata）
- [ ] `website/login/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-login-section`、`data-login-form`、`data-login-submit`、`login_identifier` / `password`
- [ ] CSS 无 Tailwind；`css_url` 必填；覆盖输入 / 按钮 / 错误态
- [ ] 无自定义 init，或不重写登录
- [ ] 登录页 `page_code=login`，只关联 code + sort
