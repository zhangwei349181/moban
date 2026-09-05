# type=`cart`

路径与调用见文档根 `assets.md`。头底购物车**图标**是 `chrome`。结账是 `checkout`。

## 功能

在购物车页展示条目、数量、合计，并跳转结算。页面 `type=general`，`page_code` 必须是 `cart`（URL `/cart`）。不要用 `/shopcart`。

---

## 使用方法

1. 创建组件，显式 `type=cart`。
2. HTML 必须含规定的 `data-cart-*`（空态、表格、合计等）。不要用自定义 init 重写加购同步。
3. metadata：`checkout_url`（默认 `/checkout`）、`continue_shopping_url`、`product_page_code`（默认详情页码 `productsingle`）。
4. 关联覆盖标题、按钮、URL。sort 建议 layout 1、header 2、pageheader 5、本组件 10、footer 20。

文件在 `website/cart/{code}/`。`css_url` 必填。

---

## 使用案例

**底栏「去购物车」。** chrome 链到 `/cart`。本页挂 `type=cart` 组件。

**结算。** 本组件的结算按钮指向 `/checkout`，不要另开路径。

---

## 注意细节

- 漏传 type 不会同步购物车状态。
- 不要把整页 cart 挂进每页正文；数量角标用 chrome。
