# 参考库组件索引

本文是**参考库当前实例清单**，`components_code` 会变，不是类型契约。决策按 `type`，先读 `components.md` 与 `types/{type}.md`。

参考租户 `c36a188f-9971-4304-8659-f8048451fb2c`。实时以 `web_ref_resource_components_list` 为准。客户复制模板后，同类皮通常已在当前租户；**先查本租户**。只有缺某 **type** 时才 `web_components_copy`。不要按旧 `components01–99` 再造一套。

`components_code` 仅字母数字。复制后若冲突会带 6 位后缀。

---

## layout

| code | 用途 |
|------|------|
| `theme01` | 默认主题（token）。全站页 sort=1 |
| `theme01list` | 列表页主题（`--list-max`）。`bloglist` / `product` 用这个替代 theme01 |

没有 `components_code=layout` 的默认项。每页必须关联一个 layout，否则无主题 CSS。

---

## header / footer / chrome

**header01 套**（壳 + 子块必须整套拷）：

| type | code |
|------|------|
| header | `header01` |
| chrome | `headerlogo01` `headernav01` `headercta01` `headerlang01` |

**header02 套**（含购物车/货币/愿望清单）：

| type | code |
|------|------|
| header | `header02` |
| chrome | `headerlogo02` `headernav02` `headercta02` `headerlang02` `headercart02` `headercurr02` `headerwish02` |

**footer01 套**：

| type | code |
|------|------|
| footer | `footer01` |
| chrome | `footerlogo01` `footernav01` `footerlang01` `footercurr01` `footercart01` `footerwish01` `footercopy01` |

chrome **不要**挂到页面。壳 HTML 用 `{{code}}`。一套壳只用本套子块。

---

## static（展示区块）

按常见落地页分组。都是 `type=static`，可挂任意 `general` 页。

| 职能 | code |
|------|------|
| Hero | `hero01` |
| 特性 / 服务 | `features01` `services01` `whatwedo01` `howitworks01` |
| CTA | `cta01` `aboutcta01` `careercta01` `svccta01` `uccta01` `whycta01` |
| 关于 / 使命 | `aboutintro01` `mission01` `vision01` `innovation01` |
| 为何选择 | `whyintro01` `whyfeat01` `whycounter01` `whycomply01` |
| 服务页 | `svcintro01` `svcfeat01` `svcinteg01` `svcusecase01` |
| 用例 / 运营 | `ucintro01` `ucops01` |
| 职业 | `careerintro01` `careerfeat01` `positions01` |
| 信任 | `testimonial01` `teams01` `casestudy01` `faq01` `marquee01` `maparea01` |

首页通常：theme + header + hero01 + 若干特性/CTA + footer。不要一页挂完上表。

---

## 文章 / 产品内容

| type | code | 用途 |
|------|------|------|
| post | `post01` `post02` `post03` | 首页文章预览（可 Tab） |
| post | `product01` | 首页产品预览（价格+心形；`article_type` 产品类，`path_url=/productsingle-{id}`） |
| postlist | `postlist01` | 文章列表网格。挂 `bloglist` |
| postlist | `postlist02` | 产品列表网格。挂 `product` |
| listfilter | `listfilter01` | 文章筛选（关属性/价格） |
| listfilter | `listfilter02` | 产品筛选（开属性/价格） |
| postchild | `postchild01` | 详情下级，Tab 切两组，`use_platform_ui: true` |
| postchild | `postchild02` | 详情下级，上下两块，`use_platform_ui: false` |
| postsingle | `postsingle01` | 文章详情。挂 `article` |
| productsingle | `productsingle01` | 产品详情+交易。挂 `productsingle` |
| pageheader | `pageheader01` | 内页页头。各页用关联覆盖 `context` |

postchild01 / postchild02 的两组数据约定：`articles`（文章类，`/article-{id}`）、`products`（产品类，`/productsingle-{id}`，价格+心形）。可挂在 `article` 或 `productsingle` 页、single 组件之后。

---

## 表单 / 文档 / 定价

| type | code | 用途 |
|------|------|------|
| form | `form01` | 联系表单。关联必写 `template_id` |
| markdown | `markdown01` | 远程 MD 壳。`translations[].md_url` 指向文档 |
| pricing | `pricing01` | 精简套餐卡（可上首页） |
| pricing | `pricing02` | 定价详情（图集+正文） |

定价 CTA 跳 `/subscriptioncheckout`，不是 `/price`。

---

## 账户

| type | code | 挂哪一页 |
|------|------|----------|
| login | `login01` | `login` |
| signup | `signup01` | `signup` |
| verifyemail | `verifyemail01` | `verifyemail` |
| dashboard | `dashboard01` | `dashboard`（只挂壳） |
| dashboardpanel | `dashboardnav01` `dashboardprofile01` `dashboardpassword01` `dashboardaddresses01` `dashboardorders01` `dashboardpayments01` `dashboardsubscriptionorders01` `dashboardsubscriptionpayments01` | **不挂页面**，写在壳 `{{code}}` |

---

## 交易

| type | code | 挂哪一页 |
|------|------|----------|
| cart | `cart01` | `cart` |
| wishlist | `wishlist01` | `wishlist` |
| checkout | `checkout01` | `checkout` |
| subscriptioncheckout | `subscriptioncheckout01` | `subscriptioncheckout` |

---

## 建议最小站

复制模板后租户里通常已有下列角色。缺某一项时再从参考库补：

1. `theme01` `theme01list`
2. `header01`（或电商用 `header02`）+ `footer01`
3. `hero01` + 1～2 个 static
4. `pageheader01` `listfilter01` `postlist01` `postsingle01`
5. 卖货再加：`listfilter02` `postlist02` `productsingle01` `product01` `cart01` `wishlist01` `checkout01`
6. 账户：`login01` `signup01` `verifyemail01` `dashboard01`
7. 订阅：`pricing01` 或 `pricing02` + `subscriptioncheckout01`

先 `web_ref_resource_pages_get` 看参考库对应页的挂法，再把 copy 后的 id 按同样 sort 挂到当前租户。
