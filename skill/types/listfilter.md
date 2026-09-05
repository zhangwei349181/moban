# type=`listfilter`

路径与调用见文档根 `assets.md`。网格见 `types/postlist.md`。

## 功能

在列表页提供分类 / 标签 / 属性 / 价格等**筛选表单**时使用。必须与 `postlist` 同页，`list_path` 一致，页面 `type=list`。

不调列表网格本身的渲染；提交后靠 URL 查询参数驱动同页的 `postlist`。

---

## 使用方法

1. 创建组件，显式 `type=listfilter`。
2. 根带 `data-listfilter-section`。表单控件的 `name` 必须是规定字段（如 `category_ids`、`tag_ids`）。
3. metadata：
   - `list_path`：与同页 postlist 相同
   - `category_type` / `tag_type`：文章用 `article`，产品用 `product`
   - `show_categories` / `show_tags`
   - `show_attributes` / `show_price_filter`：文章关、产品开
   - `category_parent_id` / `root_category_id`：可选。只显示该顶级分类的**下级**（不含自身）
   - `max_categories` / `max_tags`：可选上限
4. 默认不必写 `init_script_url`。平台 UI：可折叠 fieldset，**默认收缩**。自定义 init 后除非 `use_platform_ui: true`，否则不再跑平台 UI。

文件在 `website/listfilter/{code}/`。不要再给筛选加水平 `--page-pad`（`.gt6-list-main` 已有版心，宽度走 `--list-max`）。

---

## 使用案例

**文章列表侧栏。** `category_type=article`，关掉属性/价格。`list_path` 与文章列表页路径一致。

**产品列表且只要某品类树。** 填 `root_category_id`（或 `category_parent_id`）为该顶级分类 id，打开属性/价格。

---

## 注意细节

- 不与 postlist 同页、或 `list_path` 不一致，筛选会指错页。
- 页面 type 不是 `list` 时左右栏不会出现。
- 漏传组件 type 不会注入筛选项。
