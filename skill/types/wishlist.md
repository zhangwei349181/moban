# type=`wishlist`

路径与调用见文档根 `assets.md`。列表/详情上的心形是各预览/详情皮上的钩子，与本页共用同一把本地存储钥匙。

## 功能

在愿望清单页列出已收藏产品。页面 `type=general`，`page_code` 必须是 `wishlist`（URL `/wishlist`）。

---

## 使用方法

1. 创建组件，显式 `type=wishlist`。
2. 保留规定的 `data-*`。与产品卡片心形读写同一 `localStorage` 键。
3. 关联覆盖标题等。不要自定义 init 拆掉同步。

文件在 `website/wishlist/{code}/`。

---

## 使用案例

**底栏愿望清单入口。** chrome 链到 `/wishlist`。本页只挂本类型组件。

**从产品卡点心形后回到本页。** 应能看到同一批 id，不要换存储键。

---

## 注意细节

- 漏传 type 清单不会按内核逻辑渲染。
- 心形按钮不要包在商品详情链接里面。
