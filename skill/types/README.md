# 组件类型契约

先 `fetch` 文档根的 `components.md` 看总表，再只打开**一个** `types/{type}.md`。文件放置与调用另开 `assets.md`。不要一次读完，不要 `fetch` `types/` 目录。

文档根：`https://tenantdoc.gt6ai.xyz/04987bc8-e8e6-432a-b592-430efbe164fc/webdoc/skill/`

完整 URL：`{文档根}types/{type}.md`。`{type}` 必须是组件表字段，不是某个实例的 `components_code`。

每篇结构：功能（何时用）→ 使用方法 → 使用案例 → 注意细节。

| type | 文件 |
|------|------|
| `layout` | `types/layout.md` |
| `header` | `types/header.md` |
| `footer` | `types/footer.md` |
| `chrome` | `types/chrome.md` |
| `static` | `types/static.md` |
| `post` | `types/post.md` |
| `postlist` | `types/postlist.md` |
| `postchild` | `types/postchild.md` |
| `listfilter` | `types/listfilter.md` |
| `pageheader` | `types/pageheader.md` |
| `postsingle` | `types/postsingle.md` |
| `productsingle` | `types/productsingle.md` |
| `markdown` | `types/markdown.md` |
| `form` | `types/form.md` |
| `pricing` | `types/pricing.md` |
| `login` | `types/login.md` |
| `signup` | `types/signup.md` |
| `verifyemail` | `types/verifyemail.md` |
| `dashboard` | `types/dashboard.md` |
| `dashboardpanel` | `types/dashboardpanel.md` |
| `cart` | `types/cart.md` |
| `wishlist` | `types/wishlist.md` |
| `checkout` | `types/checkout.md` |
| `subscriptioncheckout` | `types/subscriptioncheckout.md` |

创建时 `type` 走组件表字段，禁止写入 metadata。`components_code` 只是实例名，会变；不要按某个历史 code 写死文档或流程。
