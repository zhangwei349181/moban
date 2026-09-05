import { formatArticleTypeLabel, type PostSectionItem, type PostSectionGroup } from './postSection';
import type { PostSectionMeta } from '../components/sections/resolvers/post';

export interface PostSectionLabels {
  emptyMessage: string;
  sectionBadge: string;
  readMoreLabel: string;
}

export interface RenderPostSectionOptions {
  locale: string;
  meta: PostSectionMeta;
  subtitle: string;
  groups: PostSectionGroup[];
  labels: PostSectionLabels;
  /** 来自 metadata html_url 的模板壳（含 {{POST_SECTION_*}} / {{#POST_ITEM_*}} / {{#POST_ITEMS}} 占位符） */
  templateShell: string;
}

const BLOCK_PATTERN = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
const POST_SUMMARY_LENGTH_PATTERN = /\{\{POST_SUMMARY_(\d+)\}\}/g;
const POST_FIELD_PATTERN = /\{\{POST_FIELD_([a-z0-9_]+)\}\}/gi;
const POST_FIELD_LENGTH_PATTERN = /\{\{POST_FIELD_([a-z0-9_]+)_(\d+)\}\}/gi;

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

function truncateText(text: string, maxChars: number): string {
  if (!text || maxChars <= 0) return text;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
}

function postConditions(post: PostSectionItem): Record<string, boolean> {
  const conditions: Record<string, boolean> = {
    POST_HAS_DATE: Boolean(post.date),
    POST_HAS_SUMMARY: Boolean(post.summary),
    POST_HAS_PRICE: Boolean(post.price),
    POST_HAS_ARTICLE_TYPE: Boolean(post.articleType),
    POST_HAS_AUTHOR: Boolean(post.authorName),
    POST_HAS_BADGE: Boolean(post.badge),
  };
  for (const [slug, value] of Object.entries(post.templateFields)) {
    conditions[`POST_HAS_FIELD_${slug}`] = Boolean(value);
  }
  return conditions;
}

function applyTemplateFieldPlaceholders(html: string, post: PostSectionItem): string {
  let result = html.replace(POST_FIELD_LENGTH_PATTERN, (_, slug, digits) => {
    const max = parseInt(digits, 10);
    const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
    const value = post.templateFields[slug.toLowerCase()] ?? '';
    return escapeHtml(truncateText(value, safeMax));
  });
  result = result.replace(POST_FIELD_PATTERN, (_, slug) => {
    const value = post.templateFields[slug.toLowerCase()] ?? '';
    return escapeHtml(value);
  });
  return result;
}

function applyPostPlaceholders(
  html: string,
  post: PostSectionItem,
  replacements: Record<string, string>
): string {
  let result = html.replace(POST_SUMMARY_LENGTH_PATTERN, (_, digits) => {
    const max = parseInt(digits, 10);
    const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
    return escapeHtml(truncateText(post.summary, safeMax));
  });
  result = applyTemplateFieldPlaceholders(result, post);
  result = applyTemplate(result, {
    ...replacements,
    POST_SUMMARY: escapeHtml(post.summary),
    POST_PRICE: escapeHtml(post.price),
  });
  return result;
}

function postReplacements(
  post: PostSectionItem,
  index: number,
  animationDelay: string,
  readMoreLabel: string
): Record<string, string> {
  const clipScope = index === 0 ? 'featured' : `side-${index}`;
  return {
    POST_ID: escapeHtml(post.id),
    POST_TITLE: escapeHtml(post.title),
    POST_HREF: escapeHtml(post.href),
    POST_ARTICLE_TYPE: escapeHtml(formatArticleTypeLabel(post.articleType ?? '')),
    POST_IMAGE: escapeHtml(post.image),
    POST_IMAGE_ALT: escapeHtml(post.imageAlt),
    POST_DATE: escapeHtml(post.date),
    POST_DATETIME: escapeHtml(post.datetime),
    POST_INDEX: String(index),
    POST_INDEX_1: String(index + 1),
    POST_ANIMATION_DELAY: animationDelay,
    POST_CALENDAR_CLIP_ID: `post-cal-${clipScope}-${post.id}`,
    READ_MORE_LABEL: escapeHtml(readMoreLabel),
    POST_AUTHOR: escapeHtml(post.authorName ?? ''),
    POST_BADGE: escapeHtml(post.badge ?? ''),
    POST_CATEGORY_IDS: escapeHtml((post.categoryIds ?? []).join(',')),
  };
}

function expandPostBlock(
  template: string,
  tag: string,
  posts: PostSectionItem[],
  readMoreLabel: string,
  delayForIndex: (index: number) => string
): string {
  const pattern = new RegExp(`\\{\\{#${tag}\\}\\}([\\s\\S]*?)\\{\\{\\/${tag}\\}\\}`, 'g');
  return template.replace(pattern, (_, body) => {
    if (posts.length === 0) return '';
    return posts
      .map((post, index) => {
        const replacements = postReplacements(post, index, delayForIndex(index), readMoreLabel);
        let html = expandConditionalBlocks(body, postConditions(post));
        html = applyPostPlaceholders(html, post, replacements);
        return html;
      })
      .join('\n');
  });
}

function expandSinglePostBlock(
  template: string,
  tag: string,
  post: PostSectionItem | undefined,
  readMoreLabel: string,
  animationDelay: string
): string {
  const pattern = new RegExp(`\\{\\{#${tag}\\}\\}([\\s\\S]*?)\\{\\{\\/${tag}\\}\\}`, 'g');
  return template.replace(pattern, (_, body) => {
    if (!post) return '';
    const replacements = postReplacements(post, 0, animationDelay, readMoreLabel);
    let html = expandConditionalBlocks(body, postConditions(post));
    html = applyPostPlaceholders(html, post, replacements);
    return html;
  });
}

function tabIdToSlug(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'tab';
}

function findNamedTabPanelSlugs(template: string): Set<string> {
  const slugs = new Set<string>();
  const re = /\{\{#POST_TAB_PANEL_([a-z0-9_]+)\}\}/gi;
  let match = re.exec(template);
  while (match) {
    slugs.add(match[1].toLowerCase());
    match = re.exec(template);
  }
  return slugs;
}

function hasGenericPostTabPanel(template: string): boolean {
  return /\{\{#POST_TAB_PANEL\}\}/.test(template);
}

function buildTabIdConditions(
  activeGroupId: string,
  allGroups: PostSectionGroup[]
): Record<string, boolean> {
  const active = tabIdToSlug(activeGroupId);
  const out: Record<string, boolean> = {};
  for (const group of allGroups) {
    out[`TAB_IS_${tabIdToSlug(group.id)}`] = tabIdToSlug(group.id) === active;
  }
  return out;
}

function tabConditions(index: number): Record<string, boolean> {
  return {
    TAB_IS_FIRST: index === 0,
    TAB_IS_ACTIVE: index === 0,
  };
}

function applyTabPlaceholders(
  html: string,
  group: PostSectionGroup,
  index: number,
  allGroups: PostSectionGroup[]
): string {
  let result = expandConditionalBlocks(html, {
    ...tabConditions(index),
    ...buildTabIdConditions(group.id, allGroups),
  });
  result = applyTemplate(result, {
    TAB_ID: escapeHtml(group.id),
    TAB_LABEL: escapeHtml(group.label),
    TAB_INDEX: String(index),
    TAB_INDEX_1: String(index + 1),
    TAB_BUTTON_ATTRS: index === 0 ? 'data-active aria-selected="true"' : 'aria-selected="false"',
    TAB_PANEL_ATTRS: index === 0 ? 'data-active' : '',
  });
  return result;
}

function expandPostTabNav(template: string, groups: PostSectionGroup[]): string {
  const pattern = /\{\{#POST_TAB_NAV\}\}([\s\S]*?)\{\{\/POST_TAB_NAV\}\}/g;
  return template.replace(pattern, (_, body) =>
    groups
      .map((group, index) => applyTabPlaceholders(body, group, index, groups))
      .join('\n')
  );
}

/** 按 Tab id 独立定义面板结构：{{#POST_TAB_PANEL_finance}}…{{/POST_TAB_PANEL_finance}} */
function expandNamedPostTabPanels(
  template: string,
  groups: PostSectionGroup[],
  readMoreLabel: string
): string {
  const pattern = /\{\{#POST_TAB_PANEL_([a-z0-9_]+)\}\}([\s\S]*?)\{\{\/POST_TAB_PANEL_\1\}\}/gi;
  return template.replace(pattern, (_, slug, body) => {
    const group = groups.find((g) => tabIdToSlug(g.id) === slug.toLowerCase());
    if (!group) return '';
    const index = groups.findIndex((g) => g.id === group.id);
    let html = applyTabPlaceholders(body, group, index, groups);
    html = expandPostItemBlocks(html, group.posts, readMoreLabel);
    return html;
  });
}

function expandPostTabPanels(
  template: string,
  groups: PostSectionGroup[],
  readMoreLabel: string
): string {
  if (!hasGenericPostTabPanel(template)) return template;

  const namedSlugs = findNamedTabPanelSlugs(template);
  const genericGroups = groups.filter((g) => !namedSlugs.has(tabIdToSlug(g.id)));

  const pattern = /\{\{#POST_TAB_PANEL\}\}([\s\S]*?)\{\{\/POST_TAB_PANEL\}\}/g;
  return template.replace(pattern, (_, body) =>
    genericGroups
      .map((group, index) => {
        const globalIndex = groups.findIndex((g) => g.id === group.id);
        let html = applyTabPlaceholders(body, group, globalIndex, groups);
        html = expandPostItemBlocks(html, group.posts, readMoreLabel);
        return html;
      })
      .join('\n')
  );
}

export function expandPostItemBlocks(
  template: string,
  posts: PostSectionItem[],
  readMoreLabel: string
): string {
  const first = posts[0];
  const rest = posts.slice(1);

  let html = expandSinglePostBlock(template, 'POST_ITEM_FIRST', first, readMoreLabel, '0.1');
  html = expandPostBlock(html, 'POST_ITEM_REST', rest, readMoreLabel, (i) =>
    String(0.2 + i * 0.1)
  );
  html = expandPostBlock(html, 'POST_ITEMS', posts, readMoreLabel, (i) =>
    String(0.1 + i * 0.1)
  );

  html = expandConditionalBlocks(html, {
    POST_SECTION_EMPTY: posts.length === 0,
    POST_SECTION_HAS_ITEMS: posts.length > 0,
    POST_SECTION_HAS_MORE_ITEMS: posts.length > 1,
  });

  return html;
}

function renderDescriptionBlock(subtitle: string): string {
  if (!subtitle.trim()) return '';
  return `<p data-post-section-desc itemprop="description">${escapeHtml(subtitle)}</p>`;
}

export function renderPostSectionHtml(options: RenderPostSectionOptions): string {
  const { meta, subtitle, groups, labels, templateShell } = options;
  const primaryPosts = groups[0]?.posts ?? [];

  let html = templateShell;
  html = expandPostTabNav(html, groups);
  html = expandNamedPostTabPanels(html, groups, labels.readMoreLabel);
  html = expandPostTabPanels(html, groups, labels.readMoreLabel);
  html = expandPostItemBlocks(html, primaryPosts, labels.readMoreLabel);

  html = expandConditionalBlocks(html, {
    POST_SECTION_HAS_TABS: groups.length > 1,
    POST_SECTION_HAS_SINGLE_GROUP: groups.length === 1,
  });

  return applyTemplate(html, {
    POST_SECTION_BADGE: escapeHtml(labels.sectionBadge),
    POST_SECTION_TITLE: escapeHtml(meta.title),
    POST_SECTION_DESCRIPTION_BLOCK: renderDescriptionBlock(subtitle),
    POST_SECTION_EMPTY_MESSAGE: escapeHtml(labels.emptyMessage),
    READ_MORE_LABEL: escapeHtml(labels.readMoreLabel),
    CTA_HREF: escapeHtml(meta.cta.href),
    CTA_LABEL: escapeHtml(meta.cta.label),
    CTA_ARIA_LABEL: escapeHtml(meta.cta.label),
  });
}
