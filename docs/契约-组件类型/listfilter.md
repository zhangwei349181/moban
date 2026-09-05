# type=`listfilter`（列表筛选）

Skill 可读的组件类型契约。做整页列表的分类/标签/属性/价格筛选时读本文。必须与 `postlist` 同页，同时读 [postlist.md](./postlist.md)。不要从 a0005 的 Tailwind HTML 直接入库。

相关总则：[流程与步骤.md](../流程与步骤.md) 步骤 5、1.3、1.4。主题 token 以 [layout.md](./layout.md) 为准。

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

不要用默认的 `application/octet-stream` 传 CSS/HTML。

---

## 1. 何时读 / 何时不读

| 任务 | 读本文？ |
|------|----------|
| 列表页侧栏/顶栏筛选（分类、标签、属性、价格） | 是 |
| 把旧 listfilter Tailwind 皮收进 moban 库 | 是：重写 HTML/CSS，占位符与表单字段名必须留下 |
| 文章列表只要分类+标签 | 是：metadata 关掉属性和价格 |
| 产品列表要属性/价格 | 是：打开对应开关（下一步产品皮再做） |
| 列表网格与分页 | 否：`postlist` |
| 首页 Tab 切分类 | 否：`post` |

---

## 2. 它是什么

`listfilter` 是**列表筛选表单**：内核 SSR 拉分类/标签/属性，勾选状态来自当前 URL。表单 **GET** 提交到 `list_path`，与同页 `postlist` 共用查询参数：`category_ids`、`tag_ids`、`attribute_value_ids`、`price_min` / `price_max`。

- 不自己拉文章。提交后整页刷新，由 `postlist` 按 URL 筛选。
- **须与 `postlist` 同页**。内核放进 `.gt6-list-main` 左列（窄屏上下叠）。
- 一页通常只挂一个。

内核：组件记录 `type===listfilter` → `listfilter.astro`。不再要求名字是 `listfilter` / `listfilter01`。`html_url` **必填**；拉不到模板时显示「没有可加载的模板」，内核没有 HTML 回退。

---

## 3. `type` 在哪

`type` 是组件表的**独立字段**，与 `components_code`、`metadata` 并列。

| 位置 | 有没有 `type` |
|------|----------------|
| 组件记录 `component.type` | 有，必须是 `"listfilter"` |
| 组件 `metadata` | **没有。禁止写入 `type`** |
| 页面-组件关联行 | **没有** |

创建时**显式传** `type=listfilter`。漏传会变成默认 `static`，表单不会注入选项。

---

## 4. 身份与命名

| 项 | 规则 |
|----|------|
| `components_code` | 仅字母数字 `^[a-zA-Z0-9]+$`。用 `listfilter01` |
| 目录名 | 与 `components_code` 相同 |
| 根 class | 与 code 相同，如 `.listfilter01` |
| 组件字段 `type` | `"listfilter"` |

---

## 5. 资源路径

```
https://tenantdoc.gt6ai.xyz/{租户id}/website/listfilter/{components_code}/{html|css|js|media}/{文件名}
```

文档工具目录（**不含**租户 id）：

```
website/listfilter/{components_code}/html
website/listfilter/{components_code}/css
website/listfilter/{components_code}/js
website/listfilter/{components_code}/media
```

| 资源 | 放哪 | 文件名建议 |
|------|------|------------|
| 英文 HTML | `html/` | `{code}_en.html` |
| 中文 HTML | `html/` | `{code}_cn.html` |
| 组件 CSS | `css/` | `{code}.css` |
| 区块 init（可选） | `js/` | `{code}.js` |

内核不注入全局 `/assets/listfilter.css`，也没有 HTML 回退模板。`html_url` 与 `css_url` **必填**。

---

## 6. HTML 合同

1. **一根语义根** `<section class="{code}" data-listfilter-section>`。
2. **表单必须** `method="get"` `action="{{FILTER_FORM_ACTION}}"`，并带 class **`listfilter-form`**（平台读 action）。
3. **字段 name 不许改**：`category_ids`、`tag_ids`、`attribute_value_ids`、`price_min`、`price_max`、`price_field_key`。
4. **禁止** Tailwind / Bootstrap class。
5. 多语言 = 两份 HTML，只换可见文案 / `aria-label`。
6. 自定义 JS 必须包 IIFE；经典 `<script src>`。

### 6.1 标量

| 占位符 | 说明 |
|--------|------|
| `{{FILTER_FORM_ACTION}}` | GET 目标，等于 `list_path` |
| `{{FILTER_CLEAR_HREF}}` | 清除全部筛选 |
| `{{FILTER_ARIA_LABEL}}` | 表单 aria-label |
| `{{FILTER_CATEGORIES_TITLE}}` `{{FILTER_TAGS_TITLE}}` `{{FILTER_ATTRIBUTES_TITLE}}` `{{FILTER_PRICE_TITLE}}` | 分组标题 |
| `{{FILTER_PRICE_MIN}}` `{{FILTER_PRICE_MAX}}` `{{FILTER_PRICE_FIELD_KEY}}` | 价格 |
| `{{FILTER_PRICE_MIN_LABEL}}` `{{FILTER_PRICE_MAX_LABEL}}` | 最低/最高 |
| `{{FILTER_APPLY_LABEL}}` `{{FILTER_CLEAR_LABEL}}` | 应用 / 清除 |

### 6.2 条件块

| 块 | 何时出现 |
|----|----------|
| `{{#FILTER_HAS_SECTIONS}}` | 至少有一块筛选 |
| `{{#FILTER_HAS_CATEGORIES}}` | 开了分类且有项 |
| `{{#FILTER_HAS_TAGS}}` | 开了标签且有项 |
| `{{#FILTER_HAS_ATTRIBUTES}}` | 开了属性且有项 |
| `{{#FILTER_HAS_PRICE}}` | 开了价格 |
| `{{#FILTER_HAS_ACTIVE}}` | URL 上已有筛选（显示清除） |

### 6.3 循环

| 块 | 占位符 |
|----|--------|
| `{{#FILTER_CATEGORY_ITEM}}` | `CATEGORY_ID` `CATEGORY_NAME` `CATEGORY_CHECKED_ATTR`（`checked` 或空） `CATEGORY_PARENT_ID` `CATEGORY_DEPTH` `CATEGORY_HIDDEN_ATTR`（子级默认 `hidden`） `CATEGORY_ARIA_EXPANDED` |
| `{{#CATEGORY_HAS_CHILDREN}}` / `{{#CATEGORY_NO_CHILDREN}}` | 有无下级。有下级时放 `button[data-listfilter-cat-toggle]` |
| `{{#FILTER_TAG_ITEM}}` | `TAG_ID` `TAG_NAME` `TAG_CHECKED_ATTR` |
| `{{#FILTER_ATTRIBUTE_GROUP}}` | `ATTRIBUTE_ID` `ATTRIBUTE_CODE` `ATTRIBUTE_NAME` |
| `{{#FILTER_ATTRIBUTE_VALUE}}` | `ATTRIBUTE_VALUE_ID` `ATTRIBUTE_VALUE_NAME` `ATTRIBUTE_VALUE_COLOR` `ATTRIBUTE_VALUE_CHECKED_ATTR` |
| `{{#ATTRIBUTE_VALUE_IS_COLOR}}` / `{{#ATTRIBUTE_VALUE_IS_TEXT}}` | 色块 / 文本值 |
| `{{#ATTRIBUTE_IS_COLOR}}` | 该组是颜色属性 |

可选：`fieldset[data-listfilter-collapsible]` 让平台 UI 折叠分组。**默认收缩**（皮上带 `listfilter-fieldset--collapsed` + `aria-expanded="false"`）；点击 legend 展开。该组已有勾选或价格填写时，平台 UI 会自动展开。

分类若有下级：条目用 `data-listfilter-cat`，展开按钮用 `data-listfilter-cat-toggle`。**子分类默认收起**；URL 里已勾选某下级时，祖先自动展开。平台 UI 负责点击展开/收起。

最小结构（文章皮可保留属性/价格块，靠 metadata 关掉）：

```html
<section class="listfilter01" data-listfilter-section>
  {{#FILTER_HAS_SECTIONS}}
  <form class="listfilter-form listfilter01__form" method="get" action="{{FILTER_FORM_ACTION}}" aria-label="{{FILTER_ARIA_LABEL}}">
    {{#FILTER_HAS_CATEGORIES}}
    <fieldset class="listfilter01__group listfilter-fieldset--collapsed" data-listfilter-collapsible>
      <legend class="listfilter01__legend listfilter-collapsible-legend" role="button" tabindex="0" aria-expanded="false">{{FILTER_CATEGORIES_TITLE}}</legend>
      {{#FILTER_CATEGORY_ITEM}}
      <div
        data-listfilter-cat
        data-listfilter-cat-id="{{CATEGORY_ID}}"
        data-listfilter-cat-parent="{{CATEGORY_PARENT_ID}}"
        data-listfilter-cat-depth="{{CATEGORY_DEPTH}}"
        {{CATEGORY_HIDDEN_ATTR}}
      >
        {{#CATEGORY_HAS_CHILDREN}}
        <button type="button" data-listfilter-cat-toggle aria-expanded="{{CATEGORY_ARIA_EXPANDED}}"></button>
        {{/CATEGORY_HAS_CHILDREN}}
        <label>
          <input type="checkbox" name="category_ids" value="{{CATEGORY_ID}}" {{CATEGORY_CHECKED_ATTR}} />
          {{CATEGORY_NAME}}
        </label>
      </div>
      {{/FILTER_CATEGORY_ITEM}}
    </fieldset>
    {{/FILTER_HAS_CATEGORIES}}
    {{#FILTER_HAS_TAGS}}
    <fieldset>
      <legend>{{FILTER_TAGS_TITLE}}</legend>
      {{#FILTER_TAG_ITEM}}
      <label>
        <input type="checkbox" name="tag_ids" value="{{TAG_ID}}" {{TAG_CHECKED_ATTR}} />
        {{TAG_NAME}}
      </label>
      {{/FILTER_TAG_ITEM}}
    </fieldset>
    {{/FILTER_HAS_TAGS}}
    <button type="submit">{{FILTER_APPLY_LABEL}}</button>
    {{#FILTER_HAS_ACTIVE}}
    <a href="{{FILTER_CLEAR_HREF}}">{{FILTER_CLEAR_LABEL}}</a>
    {{/FILTER_HAS_ACTIVE}}
  </form>
  {{/FILTER_HAS_SECTIONS}}
</section>
```

---

## 7. CSS / JS

选择器挂在根 class 下；只引用 layout token；断点写死 640 / 768 / 1024 / 1280。不要再加水平 `--page-pad`（`.gt6-list-main` 已有版心，宽度走 `--list-max`）。

**不必写 `init_script_url`。** 未配置自定义 init 时，内核默认跑平台 UI（颜色勾选态、可折叠 fieldset，**默认收缩**）。

若仍要自定义 init：包 IIFE；监听 `gt6:listfilter:ready`，`event.detail.root` 是本插槽。此时默认**不再**跑平台 UI，除非 `use_platform_ui: true`。

---

## 8. 组件字段与 metadata

### 8.1 组件记录

| 字段 | 说明 |
|------|------|
| `components_code` | 如 `listfilter01` |
| `type` | `"listfilter"` |
| `parent_id` | 空 |

### 8.2 metadata（禁止 `type`）

| 字段 | 说明 |
|------|------|
| `bare` | 根为 `<section>` 时建议 `true` |
| `translations[]` | 每语言 `html_url`、`css_url`；可选 `init_script_url` |
| `list_path` | 与 postlist 相同，文章用 `/bloglist`，产品用 `/product` |
| `category_type` / `tag_type` | 文章用 `article`，产品用 `product` |
| `category_parent_id` / `root_category_id` | 可选。填一个顶级分类 id 后，筛选只显示该分类的**下级及其子级**（不含该顶级自身）。不填则显示全部顶级分类及其子树 |
| `show_categories` / `show_tags` | 建议都 `true` |
| `show_attributes` / `show_price_filter` | 文章 `false`；产品 `true` |
| `max_categories` / `max_tags` | 可选上限（分类含展开后的子级，默认 80） |

关联行默许覆盖：显示开关、`list_path`、`category_type`、`category_parent_id`。不要在关联里再抄皮 URL。

---

## 9. 入库清单

- [ ] `type=listfilter`（组件字段，不在 metadata）
- [ ] `website/listfilter/{code}/html|css/`，URL 写入 `translations`
- [ ] HTML 含 `data-listfilter-section`、`listfilter-form`、规定的 input `name`
- [ ] CSS 无 Tailwind
- [ ] 文章实例关掉属性/价格；产品实例打开
- [ ] 与 `postlist` 同页，`list_path` 一致（文章 `/bloglist`，产品 `/product`）
