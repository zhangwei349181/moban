# type=`postchild`

路径与调用见文档根 `assets.md`。全站搜索预览用 `post`。详情正文用 `postsingle` / `productsingle`。

## 功能

在**文章或产品详情页**上展示当前条目的**下级**时使用。数据来自父级主 JSON 的 `has_children` / `child_article_ids`，不是全站 `/articles/ids`。

没有下级，或过滤后一条都没有 → **整块不渲染**。只出 `status=published`。顺序保持 `child_article_ids`。

`child_article_ids` 可以混有文章和产品。不配 `article_type` 时下级里所有类型都可出（与 `post` 不同）。

---

## 使用方法

1. 创建组件，显式 `type=postchild`。挂在页面 `type=postsingle` 或 `productsingle` 上，通常排在详情主组件之后。
2. HTML 合同与 `post` 相同：`{{#POST_ITEMS}}`、可选 Tab 钩子。可从任意 `type=post` 的皮拷结构，但 type 必须是 `postchild`。
3. 父级 id：详情路由里的 id；一般不必写 metadata `article_id`。
4. metadata：`article_type`、`article_limit`（默认 8，最大 24）、`template_id`、`category_ids`、`tag_ids`、`publish_status`、`path_url`、`tabs` / `groups`。
5. 不配 `path_url` 时，按该条自己的 `article_type` 走 `/article-{id}` 或 `/productsingle-{id}`。
6. 要同时展示「关联文章」和「关联产品」：挂两个 postchild 用 `article_type` 分开；或一个组件用 `tabs`。上下分块可用 `{{#POST_TAB_PANEL_{组id}}}`。不要用 CSS 藏未激活面板。
7. 有自定义 init 时默认不再跑平台 Tab UI，除非 `use_platform_ui: true`。

文件在 `website/postchild/{code}/`。不要把 `status` 写进 metadata。

---

## 使用案例

**产品详情下出关联配件。** 关联 metadata：`article_type` 为产品类，`path_url=/productsingle-{id}`。

**文章详情下用 Tab 切「相关文章 / 相关产品」。** 一组 tabs：文章类 + `/article-{id}`，一组产品类 + `/productsingle-{id}`。

**父级没有下级。** 整块消失，属正常，不要改成 `post` 去全站搜。

---

## 注意细节

- 漏传 type 不会读下级。
- 不要用本组件做全站搜索。
- 详情页没把 `articleId` 传下来时，才考虑 metadata `article_id`（调试用）。
