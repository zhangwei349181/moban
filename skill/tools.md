# 工具用法

鉴权与当前租户由运行时注入。不要向用户要 token，不要手写 HTTP。

---

## 1. `r2_upload`（文档 / 皮文件）

`mode`：`url` | `content` | `list` | `delete`。

上传时自己填 `title`、`description`、`tags`（AI 根据文件内容写，**不要问用户**）。

`directory` + `filename` 拼成存储 key。工具会自动加租户前缀。**不要**在 `directory` / `path` / `key` 里拼租户 id。

| 参数 | 何时 |
|------|------|
| `mode` | 必填 |
| `directory` | 上传时：`website/{type}/{code}/{html\|css\|js\|media}` |
| `filename` | 上传必填，必须带扩展名。key 末段等于 filename |
| `content_type` | `mode=content` 必填 |
| `content` | `mode=content` 必填 |
| `url` | `mode=url` 必填（从已有 URL 拉进租户） |
| `path` | `mode=list` 的前缀，如 `website/static/{code}` |
| `list_mode` | `hierarchical` 或 `flat` |
| `key` | `mode=delete` 必填（不要带租户前缀） |

MIME：

| 资源 | `content_type` |
|------|----------------|
| HTML | `text/html; charset=utf-8` |
| CSS | `text/css; charset=utf-8` |
| JS | `text/javascript` |
| Markdown | `text/markdown` 或 `text/plain; charset=utf-8` |
| PNG / JPEG / WebP | `image/png` / `image/jpeg` / `image/webp` |
| SVG | `image/svg+xml` |

不要用 `application/octet-stream` 传 CSS/HTML，浏览器会当下载而不是样式/页面。

上传成功后用返回的完整 `url` 写入组件 `translations[].html_url` / `css_url`。改已有文件时在 URL 上 bump `?v=`（如 `?v=2`），再**整份替换**组件 metadata。

列举当前组件目录：

```
mode=list
path=website/static/{code}
list_mode=hierarchical
```

---

## 2. 读：当前租户静态 JSON

写成功后异步刷新。若仍是旧值，等几十秒再读。不要用写接口的返回值当最终验收。

| 工具 | 用途 | 关键参数 |
|------|------|----------|
| `web_static_components_list` | 组件索引（id、code、type、gallery、parent_id） | 无（租户注入） |
| `web_static_components_get` | 单组件详情（type、metadata、children） | `components_code` |
| `web_static_pages_list` | 页面索引（id、page_code、type） | 无 |
| `web_static_pages_get` | 单页 + `components[]`（按 sort 升序） | `page_code` |

静态详情里的 `component.type` / `page.type` 是表字段。关联列表**没有** type；渲染前内核会再读组件详情。

---

## 3. 读：参考库（只读）

固定租户 `c36a188f-9971-4304-8659-f8048451fb2c`。无 `tenant_id` 参数。

| 工具 | 用途 |
|------|------|
| `web_ref_resource_components_list` | 可复制的参考组件索引 |
| `web_ref_resource_components_get` | 单组件 metadata + children |
| `web_ref_resource_pages_list/get` | 参考页面怎么挂组件（学结构，不要改参考库） |

复制时把 list/get 拿到的 **id** 传给 `web_components_copy` 的 `componentId`。参考库的 templates 只读工具存在，但改站摸底**不要**用来推断当前租户有什么。

---

## 4. 写：组件

| 工具 | 要点 |
|------|------|
| `web_components_create` | 必填 `components_code`。**显式传 `type`**。可选 description、parent_id、gallery、metadata |
| `web_components_update` | **metadata 必填且整份替换**。改 type 用独立字段，空串视为 `static`。`components_code` 不可改 |
| `web_components_delete` | 子组件随级联策略删除。先确认没有页面还在用 |
| `web_components_copy` | `componentId` = 源组件 UUID（通常来自参考库）。超时建议长。返回新 component 与 `files_copied` |

更新前先 `web_static_components_get`，在返回的 metadata 上改，再整份写回。漏掉 `translations` 会把皮 URL 抹掉。

---

## 5. 写：页面与关联

| 工具 | 要点 |
|------|------|
| `web_pages_create` | 必填 `page_code`。**显式传页面 `type`**。metadata 只放 SEO |
| `web_pages_update` | metadata 整份替换。改 type 用独立字段，空串视为 `general`。`page_code` 不可改 |
| `web_pages_delete` | 会删关联（若级联） |
| `web_page_components_create` | `pageId` + `component_id`。`sort_order` 默认 100（太大，正文会跑到 footer 后面——**务必显式传** 1/2/5/10/20） |
| `web_page_components_update` | metadata 与 sort_order 至少一项。关联 metadata 也是整份替换 |
| `web_page_components_delete` | 只删关联，不删组件 |

不要给 `chrome` / `dashboardpanel` 做 create 关联。

---

## 6. 页面模板工具（当前租户不要用）

`web_templates_*` / `web_page_templates_*` / `web_static_templates_*` 管 **gt6_web_template**，与文章内容模板、表单 `template_id` 不是一回事。

客户在客户端「复制模板」之后，**当前租户不会留下模板记录**，只有页面和组件。改站时：

- 不要 `web_static_templates_list/get`
- 不要 `web_templates_create/update/delete`
- 不要 `web_page_templates_*`
- 不要根据页面 JSON 里的 `templates[]` 做决策（通常为空）

空站请客户先在客户端复制模板；Agent 只处理复制后的页面和组件。

---

## 7. 其它内置

| 工具 | 用途 |
|------|------|
| `fetch` | 读 tenantdoc 上已上传的 HTML/CSS/MD，核对内容 |
| `doc_md_extract` / `doc_md_convert` | 从用户文档抽/转 Markdown，再上传给 `markdown` 组件 |
| `agent_task_status` | 长流程报进度 |
| `language_languages_static_list` | 取项目真实语言编码后再写 translations |

---

## 8. 验收

1. 等异步刷新（通常几十秒）。
2. `web_static_components_get`：`component.type` 正确；metadata **没有** `type`；`translations` URL 指向**当前租户** `website/{type}/{code}/…`，且能 `fetch` 到、Content-Type 正确。
3. `web_static_pages_get`：`data.page.type` 正确；`components[]` 的 code / sort / 关联 metadata 符合预期；没有 chrome / dashboardpanel。
4. 动态页：列表有 `listfilter`+`postlist`；详情有对应 single；功能页 page_code 与主组件 type 对齐。
