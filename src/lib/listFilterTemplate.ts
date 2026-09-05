import type { ListFilterSectionData } from './listFilterSection';

export interface ListFilterSectionLabels {
  categoriesTitle: string;
  tagsTitle: string;
  attributesTitle: string;
  priceTitle: string;
  priceMinLabel: string;
  priceMaxLabel: string;
  applyLabel: string;
  clearLabel: string;
  filterAriaLabel: string;
}

export interface RenderListFilterSectionOptions {
  data: ListFilterSectionData;
  labels: ListFilterSectionLabels;
  templateShell: string;
}

const BLOCK_PATTERN = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

function escapeHtml(value: string | null | undefined): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.split(`{{${key}}}`).join(value),
    template
  );
}

function expandConditionalBlocks(
  template: string,
  conditions: Record<string, boolean>
): string {
  let html = template;
  const maxPasses = 16;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    html = html.replace(BLOCK_PATTERN, (match, tag, body) => {
      if (!(tag in conditions)) return match;
      changed = true;
      return conditions[tag] ? body : '';
    });
    if (!changed) break;
  }
  return html;
}

function expandCategoryItems(template: string, data: ListFilterSectionData): string {
  const pattern = /\{\{#FILTER_CATEGORY_ITEM\}\}([\s\S]*?)\{\{\/FILTER_CATEGORY_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.categories
      .map((item) => {
        let html = expandConditionalBlocks(body, {
          CATEGORY_HAS_CHILDREN: item.hasChildren,
          CATEGORY_NO_CHILDREN: !item.hasChildren,
        });
        return applyTemplate(html, {
          CATEGORY_ID: escapeHtml(item.id),
          CATEGORY_NAME: escapeHtml(item.name),
          CATEGORY_PARENT_ID: escapeHtml(item.parentId),
          CATEGORY_DEPTH: String(item.depth),
          CATEGORY_CHECKED_ATTR: item.checked ? 'checked' : '',
          CATEGORY_HIDDEN_ATTR: item.hidden ? 'hidden' : '',
          CATEGORY_ARIA_EXPANDED: item.expanded ? 'true' : 'false',
        });
      })
      .join('\n')
  );
}

function expandTagItems(template: string, data: ListFilterSectionData): string {
  const pattern = /\{\{#FILTER_TAG_ITEM\}\}([\s\S]*?)\{\{\/FILTER_TAG_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.tags
      .map((item) =>
        applyTemplate(body, {
          TAG_ID: escapeHtml(item.id),
          TAG_NAME: escapeHtml(item.name),
          TAG_CHECKED_ATTR: item.checked ? 'checked' : '',
        })
      )
      .join('\n')
  );
}

function expandAttributeGroups(template: string, data: ListFilterSectionData): string {
  const groupPattern = /\{\{#FILTER_ATTRIBUTE_GROUP\}\}([\s\S]*?)\{\{\/FILTER_ATTRIBUTE_GROUP\}\}/g;
  const valuePattern = /\{\{#FILTER_ATTRIBUTE_VALUE\}\}([\s\S]*?)\{\{\/FILTER_ATTRIBUTE_VALUE\}\}/g;

  return template.replace(groupPattern, (_, groupBody) =>
    data.attributes
      .map((group) => {
        let body = applyTemplate(groupBody, {
          ATTRIBUTE_ID: escapeHtml(group.id),
          ATTRIBUTE_CODE: escapeHtml(group.code),
          ATTRIBUTE_NAME: escapeHtml(group.name),
        });
        body = body.replace(valuePattern, (__: string, valueBody: string) =>
          group.values
            .map((value) =>
              expandConditionalBlocks(
                applyTemplate(valueBody, {
                  ATTRIBUTE_VALUE_ID: escapeHtml(value.id),
                  ATTRIBUTE_VALUE_NAME: escapeHtml(value.name),
                  ATTRIBUTE_VALUE_COLOR: escapeHtml(value.colorCode || '#cccccc'),
                  ATTRIBUTE_VALUE_CHECKED_ATTR: value.checked ? 'checked' : '',
                }),
                {
                  ATTRIBUTE_VALUE_IS_COLOR: value.isColor && Boolean(value.colorCode),
                  ATTRIBUTE_VALUE_IS_TEXT: !value.isColor || !value.colorCode,
                }
              )
            )
            .join('\n')
        );
        return expandConditionalBlocks(body, {
          ATTRIBUTE_IS_COLOR: group.isColor,
        });
      })
      .join('\n')
  );
}

export function renderListFilterSectionHtml(options: RenderListFilterSectionOptions): string {
  const { data, labels, templateShell } = options;

  let html = expandCategoryItems(templateShell, data);
  html = expandTagItems(html, data);
  html = expandAttributeGroups(html, data);

  const hasCategories = data.showCategories && data.categories.length > 0;
  const hasTags = data.showTags && data.tags.length > 0;
  const hasAttributes = data.showAttributes && data.attributes.length > 0;
  const hasPrice = data.showPrice;
  const hasAnySection = hasCategories || hasTags || hasAttributes || hasPrice;

  html = expandConditionalBlocks(html, {
    FILTER_HAS_SECTIONS: hasAnySection,
    FILTER_HAS_CATEGORIES: hasCategories,
    FILTER_HAS_TAGS: hasTags,
    FILTER_HAS_ATTRIBUTES: hasAttributes,
    FILTER_HAS_PRICE: hasPrice,
    FILTER_HAS_ACTIVE: data.hasActiveFilters,
  });

  return applyTemplate(html, {
    FILTER_FORM_ACTION: escapeHtml(data.formAction),
    FILTER_CLEAR_HREF: escapeHtml(data.clearHref),
    FILTER_PRICE_MIN: escapeHtml(data.priceMin),
    FILTER_PRICE_MAX: escapeHtml(data.priceMax),
    FILTER_PRICE_FIELD_KEY: escapeHtml(data.priceFieldKey),
    FILTER_CATEGORIES_TITLE: escapeHtml(labels.categoriesTitle),
    FILTER_TAGS_TITLE: escapeHtml(labels.tagsTitle),
    FILTER_ATTRIBUTES_TITLE: escapeHtml(labels.attributesTitle),
    FILTER_PRICE_TITLE: escapeHtml(labels.priceTitle),
    FILTER_PRICE_MIN_LABEL: escapeHtml(labels.priceMinLabel),
    FILTER_PRICE_MAX_LABEL: escapeHtml(labels.priceMaxLabel),
    FILTER_APPLY_LABEL: escapeHtml(labels.applyLabel),
    FILTER_CLEAR_LABEL: escapeHtml(labels.clearLabel),
    FILTER_ARIA_LABEL: escapeHtml(labels.filterAriaLabel),
  });
}
