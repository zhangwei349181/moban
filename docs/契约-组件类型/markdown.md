# type=`markdown`（远程 Markdown 正文）

Skill 可读的组件类型契约。做隐私政策、服务条款、关于我们长文等**远程 Markdown 文档页**时读本文。不要把 MD/HTML 写进页面 metadata。不要从 a0005 的页面 `content` / `markdowncode` 直接搬到页面上。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.2、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。页头用 [pageheader.md](./pageheader.md)。

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
| Markdown | `text/markdown` 或 `text/plain; charset=utf-8` |

不要用默认的 `application/octet-stream`。

---

## 1. 何时读 / 何时不读

| 任务 | 读本文？ |
|------|----------|
| 隐私政策 / 服务条款 / 帮助文档等长文页 | 是 |
| 把旧页面 `metadata.content` / `content_en` / `markdowncode` 迁走 | 是：改成组件 + 关联 |
| 静态 Hero、特性块 | 否：`static` |
| 文章列表 / 详情 | 否：`postlist` / `postsingle` |

---

## 2. 它是什么

`markdown` 是**远程 Markdown 展示区块**：内核 SSR 按当前语言取 `md_url`，拉取 `.md` 原文，GFM 解析成 HTML，注入 `html_url` 壳里的 `{{MARKDOWN_CONTENT}}`，再加载该组件 CSS。

- **页面不再加载文档。** 页面只做 SEO 与组件关联。禁止页面 metadata 的 `content`、`content_{locale}`、`markdowncode`、`htmlcode`。
- 一页通常挂一个 `type=markdown`（可与 `pageheader`、header、footer、theme 同页）。
- 换一篇文档：换组件，或只改该组件 `translations[].md_url`。不要把 MD 地址写到页面上。

内核：组件记录 `type===markdown` → `markdown.astro`。不再要求名字是 `markdown` / `markdown01`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"markdown"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |
| 页面 `metadata` | **没有文档 URL、没有 markdowncode** |

创建时**显式传** `type=markdown`。漏传会变成默认 `static`，不会拉 MD。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。通用皮用 `markdown01`；一份文档一份实例也可用 `privacy01` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.markdown01` |
| 组件字段 `type` | `"markdown"` |

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/markdown/{components_code}/{html|css|md|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/markdown/{components_code}/html
website/markdown/{components_code}/css
website/markdown/{components_code}/md
website/markdown/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML 壳 | `html/` | `{code}_en.html` |
| 中文 HTML 壳 | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 英文 Markdown | `md/` | `{code}_en.md` 或文档名如 `privacy_en.md` |
| 中文 Markdown | `md/` | `{code}_cn.md` |

硬性：`md_url` 必须是本租户完整公网 URL，且路径以 `.md` / `.markdown` 结尾。禁止把 MD 写进页面 metadata。禁止内核再读页面 `content_*`。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-markdown-section>`。
2. **必须留下** `{{MARKDOWN_CONTENT}}`（内核注入已解析的 HTML，不要再 escape）。
3. **禁止** Tailwind / Bootstrap class。
4. 多语言壳 class 与占位符一致；正文差异在 `md_url`，不在 HTML 里写死政策条文。
5. 不必写 `init_script_url`。

最小结构：

```html
<section class="markdown01" data-markdown-section>
  <article class="markdown01__body">
    {{MARKDOWN_CONTENT}}
  </article>
</section>
```

兼容：壳里写 `{{PAGE_CONTENT}}` 也注入同一段 HTML。

---

## 7. CSS

选择器挂在根 class 下；只引用 layout token；断点写死 640 / 768 / 1024 / 1280。正文排版（标题、段落、列表、链接、引用、表格、代码）写在本组件 CSS，不要依赖全局 `.prose`。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `markdown01` |
| `type` | `"markdown"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `translations[]` | 每语言 `html_url`、`css_url`、**`md_url`** |
| 顶层 `md_url` | 单语言可替代；有多语言走数组 |

`translations[].language` 与 `language_code` 都写上（`en` / `zh-CN`）。缺翻译时回退英文 `md_url`。

关联行默许覆盖：`md_url`（本页换一篇文档、皮不变）。不要在关联里再抄 `html_url` / `css_url`，除非本页明确换皮。

文档页关联顺序建议：theme `1`、header `2`、pageheader `5`、markdown `10`、footer `20`。

联系页关联顺序建议：theme `1`、header `2`、**pageheader `5`**、form `10`、footer `20`。pageheader 用关联覆盖标题与面包屑（Home → Contact），不要另做一套皮。

页面 metadata **只留 SEO**（`title` / `description` / `keywords` 或 `translations`）。`page_code` 用字母数字，如 `privacy`。

---

## 9. 入库清单

- [ ] `type=markdown`（组件字段，不在 metadata）
- [ ] `website/markdown/{code}/html|css|md/`，URL 写入 `translations`
- [ ] HTML 含 `data-markdown-section`、`{{MARKDOWN_CONTENT}}`
- [ ] CSS 无 Tailwind；正文选择器在根 class 下
- [ ] 页面无 `content` / `markdowncode` / `htmlcode`
- [ ] 页面只关联 theme + header + pageheader + markdown + footer
