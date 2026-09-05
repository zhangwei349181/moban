import type { PostSingleSectionData } from './postSingleSection';

export interface PostSingleSectionLabels {
  authorByPrefix: string;
}

export interface RenderPostSingleSectionOptions {
  data: PostSingleSectionData;
  labels: PostSingleSectionLabels;
  templateShell: string;
}

const BLOCK_PATTERN = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
const POST_SINGLE_FIELD_PATTERN = /\{\{POST_SINGLE_FIELD_([a-z0-9_]+)\}\}/gi;
const POST_SINGLE_FIELD_LENGTH_PATTERN = /\{\{POST_SINGLE_FIELD_([a-z0-9_]+)_(\d+)\}\}/gi;
const POST_FIELD_PATTERN = /\{\{POST_FIELD_([a-z0-9_]+)\}\}/gi;
const POST_FIELD_LENGTH_PATTERN = /\{\{POST_FIELD_([a-z0-9_]+)_(\d+)\}\}/gi;
const POST_SINGLE_SUMMARY_LENGTH_PATTERN = /\{\{POST_SINGLE_SUMMARY_(\d+)\}\}/g;

function truncateText(text: string, maxChars: number): string {
  if (!text || maxChars <= 0) return text;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
}

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

function applyRawHtml(template: string, key: string, html: string): string {
  return template.split(`{{${key}}}`).join(html);
}

function expandConditionalBlocks(
  template: string,
  conditions: Record<string, boolean>
): string {
  let result = template;
  for (let pass = 0; pass < 16; pass += 1) {
    let changed = false;
    result = result.replace(BLOCK_PATTERN, (match, tag, body) => {
      if (!(tag in conditions)) return match;
      changed = true;
      return conditions[tag] ? body : '';
    });
    if (!changed) break;
  }
  return result;
}

function expandImageItems(template: string, data: PostSingleSectionData): string {
  const pattern = /\{\{#POST_SINGLE_IMAGE_ITEM\}\}([\s\S]*?)\{\{\/POST_SINGLE_IMAGE_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.images
      .map((image) =>
        applyTemplate(body, {
          IMAGE_SRC: escapeHtml(image.src),
          IMAGE_ALT: escapeHtml(image.alt),
          IMAGE_INDEX: String(image.index),
          IMAGE_LOADING: image.index === 1 ? 'eager' : 'lazy',
        })
      )
      .join('\n')
  );
}

function expandTagItems(template: string, data: PostSingleSectionData): string {
  const pattern = /\{\{#POST_SINGLE_TAG_ITEM\}\}([\s\S]*?)\{\{\/POST_SINGLE_TAG_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.tags
      .map((tag) =>
        applyTemplate(body, {
          TAG_ID: escapeHtml(tag.id),
          TAG_NAME: escapeHtml(tag.name),
          TAG_HREF: escapeHtml(tag.href),
        })
      )
      .join('\n')
  );
}

function expandCategoryItems(template: string, data: PostSingleSectionData): string {
  const pattern =
    /\{\{#POST_SINGLE_CATEGORY_ITEM\}\}([\s\S]*?)\{\{\/POST_SINGLE_CATEGORY_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.categories
      .map((cat) =>
        applyTemplate(body, {
          CATEGORY_ID: escapeHtml(cat.id),
          CATEGORY_NAME: escapeHtml(cat.name),
          CATEGORY_HREF: escapeHtml(cat.href),
        })
      )
      .join('\n')
  );
}

function expandMetadataBlocks(template: string, data: PostSingleSectionData): string {
  const pattern =
    /\{\{#POST_SINGLE_METADATA_BLOCK\}\}([\s\S]*?)\{\{\/POST_SINGLE_METADATA_BLOCK\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.metadataBlocks
      .map((block) => {
        let html = applyTemplate(body, {
          METADATA_KEY: escapeHtml(block.key),
        });
        return applyRawHtml(html, 'METADATA_HTML', block.html);
      })
      .join('\n')
  );
}

function expandTemplateFieldItems(template: string, data: PostSingleSectionData): string {
  const pattern =
    /\{\{#POST_SINGLE_TEMPLATE_FIELD_ITEM\}\}([\s\S]*?)\{\{\/POST_SINGLE_TEMPLATE_FIELD_ITEM\}\}/g;
  return template.replace(pattern, (_, body) =>
    data.templateFieldItems
      .map((field) =>
        applyTemplate(body, {
          FIELD_KEY: escapeHtml(field.key),
          FIELD_SLUG: escapeHtml(field.slug),
          FIELD_VALUE: escapeHtml(field.value),
        })
      )
      .join('\n')
  );
}

function templateFieldConditions(data: PostSingleSectionData): Record<string, boolean> {
  const conditions: Record<string, boolean> = {
    POST_SINGLE_HAS_SUMMARY: Boolean(data.summary),
    POST_SINGLE_HAS_PRICE: Boolean(data.price),
    POST_SINGLE_HAS_ARTICLE_TYPE: Boolean(data.articleType),
    POST_SINGLE_HAS_TEMPLATE_FIELDS: data.templateFieldItems.length > 0,
  };
  for (const [slug, value] of Object.entries(data.templateFields)) {
    conditions[`POST_SINGLE_HAS_FIELD_${slug}`] = Boolean(value);
    conditions[`POST_HAS_FIELD_${slug}`] = Boolean(value);
  }
  return conditions;
}

function applyTemplateFieldPlaceholders(html: string, data: PostSingleSectionData): string {
  const replaceField = (slug: string) => data.templateFields[slug.toLowerCase()] ?? '';

  let result = html.replace(POST_SINGLE_FIELD_LENGTH_PATTERN, (_, slug, digits) => {
    const max = parseInt(digits, 10);
    const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
    return escapeHtml(truncateText(replaceField(slug), safeMax));
  });
  result = result.replace(POST_SINGLE_FIELD_PATTERN, (_, slug) =>
    escapeHtml(replaceField(slug))
  );
  result = result.replace(POST_FIELD_LENGTH_PATTERN, (_, slug, digits) => {
    const max = parseInt(digits, 10);
    const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
    return escapeHtml(truncateText(replaceField(slug), safeMax));
  });
  result = result.replace(POST_FIELD_PATTERN, (_, slug) => escapeHtml(replaceField(slug)));
  return result;
}

export function renderPostSingleSectionHtml(options: RenderPostSingleSectionOptions): string {
  const { data, labels, templateShell } = options;

  const hasTags = data.showTags && data.tags.length > 0;
  const hasCategories = data.showCategories && data.categories.length > 0;
  const hasTaxonomy = hasTags || hasCategories;
  const hasImages = data.showImages && data.images.length > 0;
  const hasAuthor = data.showAuthor && Boolean(data.author?.displayName);

  let html = expandImageItems(templateShell, data);
  html = expandTagItems(html, data);
  html = expandCategoryItems(html, data);
  html = expandMetadataBlocks(html, data);
  html = expandTemplateFieldItems(html, data);

  html = expandConditionalBlocks(html, {
    POST_SINGLE_ERROR: data.error,
    POST_SINGLE_HAS_DATE: data.showDate && Boolean(data.dateLine),
    POST_SINGLE_HAS_IMAGES: hasImages,
    POST_SINGLE_HAS_SINGLE_IMAGE: hasImages && data.images.length === 1,
    POST_SINGLE_HAS_GALLERY: hasImages && data.images.length > 1,
    POST_SINGLE_HAS_MAIN_CONTENT: Boolean(data.mainContentHtml),
    POST_SINGLE_HAS_METADATA: data.metadataBlocks.length > 0,
    POST_SINGLE_HAS_TAGS: hasTags,
    POST_SINGLE_HAS_CATEGORIES: hasCategories,
    POST_SINGLE_HAS_TAXONOMY: hasTaxonomy,
    POST_SINGLE_HAS_AUTHOR: hasAuthor,
    POST_SINGLE_AUTHOR_HAS_AVATAR: Boolean(data.author?.avatarUrl),
    POST_SINGLE_AUTHOR_NO_AVATAR: hasAuthor && !data.author?.avatarUrl,
    POST_SINGLE_AUTHOR_HAS_EMAIL: Boolean(data.author?.email),
    POST_SINGLE_AUTHOR_HAS_PHONE: Boolean(data.author?.phone),
    POST_SINGLE_HAS_CONTENT: !data.error,
    ...templateFieldConditions(data),
  });

  html = applyTemplateFieldPlaceholders(html, data);

  html = html.replace(POST_SINGLE_SUMMARY_LENGTH_PATTERN, (_, digits) => {
    const max = parseInt(digits, 10);
    const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
    return escapeHtml(truncateText(data.summary, safeMax));
  });

  html = applyTemplate(html, {
    POST_SINGLE_TITLE: escapeHtml(data.title),
    POST_SINGLE_DATE_LINE: escapeHtml(data.dateLine),
    POST_SINGLE_PUBLISHED_ISO: escapeHtml(data.publishedIso),
    POST_SINGLE_SUMMARY: escapeHtml(data.summary),
    POST_SINGLE_PRICE: escapeHtml(data.price),
    POST_SINGLE_ARTICLE_TYPE: escapeHtml(data.articleTypeLabel),
    POST_SINGLE_AUTHOR_NAME: escapeHtml(data.author?.displayName ?? ''),
    POST_SINGLE_AUTHOR_EMAIL: escapeHtml(data.author?.email ?? ''),
    POST_SINGLE_AUTHOR_PHONE: escapeHtml(data.author?.phone ?? ''),
    POST_SINGLE_AUTHOR_AVATAR: escapeHtml(data.author?.avatarUrl ?? ''),
    POST_SINGLE_AUTHOR_INITIAL: escapeHtml(data.author?.initial ?? ''),
    POST_SINGLE_AUTHOR_BY_PREFIX: escapeHtml(labels.authorByPrefix),
  });

  html = applyRawHtml(html, 'POST_SINGLE_MAIN_CONTENT', data.mainContentHtml);

  if (hasImages && data.images.length === 1) {
    html = applyTemplate(html, {
      POST_SINGLE_FEATURED_IMAGE: escapeHtml(data.images[0].src),
      POST_SINGLE_FEATURED_IMAGE_ALT: escapeHtml(data.images[0].alt),
    });
  } else {
    html = applyTemplate(html, {
      POST_SINGLE_FEATURED_IMAGE: '',
      POST_SINGLE_FEATURED_IMAGE_ALT: escapeHtml(data.title),
    });
  }

  return html;
}
