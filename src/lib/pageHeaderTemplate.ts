import type { PageHeaderSectionData } from './pageHeaderSection';

export interface PageHeaderSectionLabels {
  breadcrumbAriaLabel: string;
}

export interface RenderPageHeaderSectionOptions {
  data: PageHeaderSectionData;
  labels: PageHeaderSectionLabels;
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
  for (let pass = 0; pass < 16; pass += 1) {
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

function expandBreadcrumbItems(template: string, data: PageHeaderSectionData): string {
  const pattern = /\{\{#BREADCRUMB_ITEM\}\}([\s\S]*?)\{\{\/BREADCRUMB_ITEM\}\}/g;
  const separatorPattern =
    /\{\{#BREADCRUMB_SEPARATOR\}\}([\s\S]*?)\{\{\/BREADCRUMB_SEPARATOR\}\}/g;

  return template.replace(pattern, (_, body) =>
    data.breadcrumbs
      .map((item, index) => {
        let html = expandConditionalBlocks(body, {
          BREADCRUMB_IS_CURRENT: item.current,
          BREADCRUMB_IS_LINK: Boolean(item.href) && !item.current,
        });
        html = applyTemplate(html, {
          BREADCRUMB_LABEL: escapeHtml(item.label),
          BREADCRUMB_HREF: escapeHtml(item.href ?? ''),
          BREADCRUMB_INDEX: String(index),
        });
        if (index > 0) {
          html = html.replace(separatorPattern, '$1');
        } else {
          html = html.replace(separatorPattern, '');
        }
        return html;
      })
      .join('\n')
  );
}

function renderDescriptionBlock(description: string): string {
  if (!description.trim()) return '';
  return `<p data-pageheader-desc>${escapeHtml(description)}</p>`;
}

export function renderPageHeaderSectionHtml(options: RenderPageHeaderSectionOptions): string {
  const { data, labels, templateShell } = options;

  let html = expandBreadcrumbItems(templateShell, data);

  html = expandConditionalBlocks(html, {
    PAGE_HAS_DESCRIPTION: data.showDescription && Boolean(data.description.trim()),
    PAGE_HAS_BREADCRUMBS: data.breadcrumbs.length > 0,
    PAGE_HAS_TITLE: data.showTitle && Boolean(data.title.trim()),
  });

  const descriptionText = data.showDescription ? data.description : '';

  return applyTemplate(html, {
    PAGE_TITLE: escapeHtml(data.title),
    PAGE_DESCRIPTION: escapeHtml(descriptionText),
    PAGE_DESCRIPTION_BLOCK: renderDescriptionBlock(descriptionText),
    BREADCRUMB_ARIA_LABEL: escapeHtml(labels.breadcrumbAriaLabel),
  });
}
