# type=`markdown`

路径与调用见文档根 `assets.md`。

## 功能

在需要**远程 Markdown 长文**（隐私政策、条款、帮助）时使用。内核按语言取 `md_url`，GFM 解析后注入 `{{MARKDOWN_CONTENT}}`。

页面**禁止**再写 `content` / `content_{locale}` / `markdowncode` / `htmlcode`。换一篇文档：换组件或只改该组件 `translations[].md_url`。

不要用本类型做文章详情（那是 `postsingle`）。

---

## 使用方法

1. 创建组件，显式 `type=markdown`。壳 `html_url` 必填。
2. `.md` 用 `r2_upload` 传到 `website/markdown/{code}/md`，`content_type` 用 `text/markdown`。
3. `translations[].md_url` 指向该文件的完整 URL。`language_code` 与项目启用语言一致。
4. 一页通常：layout、header、pageheader、本组件、footer。

---

## 使用案例

**隐私政策页。** 页面只做 SEO 与关联。中英文两份 md + 一份壳 HTML。

**更新条款正文。** 只覆盖 md 文件并 bump `md_url` 的 `?v=`，不要把正文贴进页面 metadata。

---

## 注意细节

- 漏传 type 不会拉 MD。
- 壳和 md 都在该组件目录下，不要写到页面目录。
