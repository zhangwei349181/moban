import type { BlogListFilterItem, BlogListPageLink } from './articleList';
import type { PostListSectionData } from './postListSection';
import { expandPostItemBlocks } from './postTemplate';

export interface PostListSectionLabels {
  emptyMessage: string;
  errorMessage: string;
  readMoreLabel: string;
  prevLabel: string;
  nextLabel: string;
}

export interface RenderPostListSectionOptions {
  data: PostListSectionData;
  labels: PostListSectionLabels;
  /** 来自 metadata html_url 的模板壳 */
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

function expandFilterItems(template: string, filters: BlogListFilterItem[]): string {
  const pattern = /\{\{#POSTLIST_FILTER_ITEM\}\}([\s\S]*?)\{\{\/POSTLIST_FILTER_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    filters
      .map((filter) =>
        applyTemplate(body, {
          FILTER_ID: escapeHtml(filter.id),
          FILTER_NAME: escapeHtml(filter.name),
          FILTER_HREF: escapeHtml(filter.href),
          FILTER_ACTIVE_CLASS: filter.active ? 'is-active' : '',
          FILTER_ARIA_CURRENT: filter.active ? 'page' : '',
        })
      )
      .join('\n')
  );
}

function expandPageLinks(template: string, links: BlogListPageLink[]): string {
  const pattern = /\{\{#POSTLIST_PAGE_LINK\}\}([\s\S]*?)\{\{\/POSTLIST_PAGE_LINK\}\}/g;
  return template.replace(pattern, (_, body) =>
    links
      .map((link) => {
        if (link.ellipsis) {
          return expandConditionalBlocks(body, {
            PAGE_IS_ELLIPSIS: true,
            PAGE_IS_NUMBER: false,
          });
        }
        return expandConditionalBlocks(
          applyTemplate(body, {
            PAGE_NUMBER: String(link.page),
            PAGE_HREF: escapeHtml(link.href),
            PAGE_ACTIVE_CLASS: link.active ? 'is-active' : '',
            PAGE_ARIA_CURRENT: link.active ? 'page' : '',
          }),
          { PAGE_IS_ELLIPSIS: false, PAGE_IS_NUMBER: true, PAGE_IS_ACTIVE: link.active }
        );
      })
      .join('\n')
  );
}

export function renderPostListSectionHtml(
  options: RenderPostListSectionOptions
): string {
  const { data, labels, templateShell } = options;
  const { posts, filters, pageLinks, prevHref, nextHref, totalPages, currentPage } = data;
  const showPagination = totalPages > 1 && !data.error;

  let html = templateShell;
  html = expandFilterItems(html, filters);
  html = expandPostItemBlocks(html, posts, labels.readMoreLabel);
  html = expandPageLinks(html, pageLinks);

  html = expandConditionalBlocks(html, {
    POSTLIST_HAS_FILTERS: filters.length > 0,
    POSTLIST_ERROR: data.error,
    POSTLIST_EMPTY: !data.error && data.empty,
    POSTLIST_HAS_ITEMS: !data.error && posts.length > 0,
    POSTLIST_HAS_PAGINATION: showPagination,
    POSTLIST_HAS_PREV: Boolean(prevHref),
    POSTLIST_HAS_NEXT: Boolean(nextHref),
    POST_SECTION_EMPTY: data.empty && !data.error,
    POST_SECTION_HAS_ITEMS: posts.length > 0 && !data.error,
  });

  return applyTemplate(html, {
    POSTLIST_EMPTY_MESSAGE: escapeHtml(labels.emptyMessage),
    POSTLIST_ERROR_MESSAGE: escapeHtml(labels.errorMessage),
    READ_MORE_LABEL: escapeHtml(labels.readMoreLabel),
    POSTLIST_PREV_HREF: escapeHtml(prevHref ?? ''),
    POSTLIST_NEXT_HREF: escapeHtml(nextHref ?? ''),
    POSTLIST_PREV_LABEL: escapeHtml(labels.prevLabel),
    POSTLIST_NEXT_LABEL: escapeHtml(labels.nextLabel),
    POSTLIST_CURRENT_PAGE: String(currentPage),
    POSTLIST_TOTAL_PAGES: String(totalPages),
    POSTLIST_TOTAL: String(data.total),
    POST_SECTION_EMPTY_MESSAGE: escapeHtml(labels.emptyMessage),
  });
}
