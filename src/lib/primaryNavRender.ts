/**
 * 主导航 HTML 字符串渲染（SSR 与逻辑共用）
 */
import type { MenuItem } from './menu.js';
import { getTranslationByLocale } from './menu.js';

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function sortMenuItems(items: MenuItem[]): MenuItem[] {
  const list = Array.isArray(items) ? [...items] : [];
  list.sort((a, b) => {
    const ao = typeof a?.sort_order === 'number' ? a.sort_order : Number.POSITIVE_INFINITY;
    const bo = typeof b?.sort_order === 'number' ? b.sort_order : Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    const al = (a?.label || a?.mobile_label || '').toString();
    const bl = (b?.label || b?.mobile_label || '').toString();
    const lc = al.localeCompare(bl, undefined, { numeric: true, sensitivity: 'base' });
    if (lc !== 0) return lc;
    const ai = (a?.id || '').toString();
    const bi = (b?.id || '').toString();
    return ai.localeCompare(bi);
  });
  return list;
}

export function sortMenuTree(items: MenuItem[]): MenuItem[] {
  const sorted = sortMenuItems(items);
  for (const item of sorted) {
    if (Array.isArray(item?.children) && item.children.length > 0) {
      item.children = sortMenuTree(item.children);
    }
  }
  return sorted;
}

function getMenuItemLabel(item: MenuItem, locale: string) {
  const translation = getTranslationByLocale(item.translations, locale);
  return translation?.label || item.label || '';
}

function getMenuItemHtmlContent(item: MenuItem, locale: string) {
  const translation = getTranslationByLocale(item.translations, locale);
  return translation?.html_content || item.html_content || '';
}

function getMenuItemUrl(item: MenuItem) {
  if (item.url) return item.url;
  if (item.article_id) return `/article-${item.article_id}`;
  if (item.category_id) return `/category-${item.category_id}`;
  return '#';
}

function linkTargetAttr(item: MenuItem) {
  if (!item.target) return '';
  return ` target="${escapeAttr(item.target)}" rel="noopener noreferrer"`;
}

function topLevelExpandButtonHtml(): string {
  return (
    '<button type="button" class="btn nav-dropdown-expand d-xl-none p-0 ms-1 border-0 bg-transparent text-body" ' +
    'aria-expanded="false" aria-haspopup="true" aria-label="展开子菜单">' +
    '<i class="fa-solid fa-angle-down" aria-hidden="true"></i></button>'
  );
}

function renderSubMenuOnly(items: MenuItem[], locale: string): string {
  const sorted = sortMenuItems(
    (items || []).filter((c) => c.is_active && c.status === 'active')
  );
  if (sorted.length === 0) return '';
  let html = '<ul class="sub-menu">';
  for (const item of sorted) {
    const label = escapeHtml(getMenuItemLabel(item, locale));
    const url = getMenuItemUrl(item);
    const hasChildren = item.children && item.children.length > 0;
    html += '<li>';
    html += `<a href="${escapeAttr(url)}"${linkTargetAttr(item)}>${label}</a>`;
    if (hasChildren) {
      html += renderSubMenuOnly(item.children, locale);
    }
    html += '</li>';
  }
  html += '</ul>';
  return html;
}

function renderBootstrapDropdownMenu(items: MenuItem[], locale: string): string {
  const sorted = sortMenuItems(
    (items || []).filter((c) => c.is_active && c.status === 'active')
  );
  if (sorted.length === 0) return '';
  let html = '<ul class="dropdown-menu">';
  for (const item of sorted) {
    const label = escapeHtml(getMenuItemLabel(item, locale));
    const url = getMenuItemUrl(item);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      html += '<li class="sub-dropdown-hover">';
      html += `<a class="dropdown-item" href="${escapeAttr(url)}"${linkTargetAttr(item)}>${label}</a>`;
      html += renderSubMenuOnly(item.children, locale);
      html += '</li>';
    } else {
      html += '<li>';
      html += `<a class="dropdown-item" href="${escapeAttr(url)}"${linkTargetAttr(item)}>${label}</a>`;
      html += '</li>';
    }
  }
  html += '</ul>';
  return html;
}

function renderMegaMenuGrid(item: MenuItem, locale: string) {
  const children = sortMenuItems(
    (item.children || []).filter((c) => c.is_active && c.status === 'active')
  );
  if (children.length === 0) return '';

  const columnCount = children.length <= 6 ? 2 : 3;
  const itemsPerColumn = Math.ceil(children.length / columnCount);
  const colClass = columnCount === 2 ? 'col-xl-6' : 'col-xl-4';

  let html = '<div class="dropdown-menu dropdown-menu-2"><div class="row">';
  for (let col = 0; col < columnCount; col++) {
    const start = col * itemsPerColumn;
    const slice = children.slice(start, start + itemsPerColumn);
    if (slice.length === 0) continue;
    html += `<div class="dropdown-column ${colClass}">`;
    for (const child of slice) {
      const label = escapeHtml(getMenuItemLabel(child, locale));
      const url = getMenuItemUrl(child);
      html += `<a class="dropdown-item" href="${escapeAttr(url)}"${linkTargetAttr(child)}>${label}</a>`;
    }
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

function buildLiClasses(item: MenuItem, hasChildren: boolean, isMega: boolean) {
  const parts = ['nav-item'];
  if (item.badge_text || item.is_highlighted) parts.push('new-nav-item');
  if (hasChildren || isMega) parts.push('dropdown');
  if (isMega) parts.push('dropdown-mega');
  if (item.css_class) {
    item.css_class
      .split(/\s+/)
      .filter(Boolean)
      .forEach((c) => {
        if (!parts.includes(c)) parts.push(c);
      });
  }
  return parts.join(' ');
}

function renderTopLevelItem(item: MenuItem, locale: string): string {
  if (!item.is_active || item.status !== 'active') return '';

  const label = escapeHtml(getMenuItemLabel(item, locale));
  const url = getMenuItemUrl(item);
  const hasChildren = !!(item.children && item.children.length > 0);
  const htmlContent = getMenuItemHtmlContent(item, locale);
  const isMega = !!item.is_mega_menu;
  const badgeHtml = item.badge_text
    ? ` <label class="new-dropdown">${escapeHtml(item.badge_text)}</label>`
    : '';

  const liClass = buildLiClasses(item, hasChildren, isMega);

  if (!hasChildren && !isMega) {
    return `<li class="nav-item"><a class="nav-link" href="${escapeAttr(url)}"${linkTargetAttr(item)}>${label}${badgeHtml}</a></li>`;
  }

  if (isMega && htmlContent) {
    const megaInner = htmlContent;
    const toggleClass = 'nav-link dropdown-toggle ps-xl-2 ps-0';
    return `<li class="${escapeAttr(liClass)}">
        <a class="${toggleClass}" href="${escapeAttr(url)}"${linkTargetAttr(item)}>${label}${badgeHtml}</a>
        ${topLevelExpandButtonHtml()}
        <div class="dropdown-menu dropdown-menu-3 dropdown-menu-2">${megaInner}</div>
      </li>`;
  }

  if (isMega && hasChildren) {
    const toggleClass = 'nav-link dropdown-toggle ps-xl-2 ps-0';
    return `<li class="${escapeAttr(liClass)}">
        <a class="${toggleClass}" href="${escapeAttr(url)}"${linkTargetAttr(item)}>${label}${badgeHtml}</a>
        ${topLevelExpandButtonHtml()}
        ${renderMegaMenuGrid(item, locale)}
      </li>`;
  }

  if (
    item.css_class &&
    String(item.css_class).includes('su-mega-menu-small') &&
    hasChildren
  ) {
    const toggleClass = 'nav-link dropdown-toggle ps-xl-2 ps-0';
    return `<li class="${escapeAttr(liClass)}">
        <a class="${toggleClass}" href="${escapeAttr(url)}"${linkTargetAttr(item)}>${label}${badgeHtml}</a>
        ${topLevelExpandButtonHtml()}
        ${renderMegaMenuGrid(item, locale)}
      </li>`;
  }

  if (hasChildren) {
    return `<li class="${escapeAttr(liClass)}">
        <a class="nav-link dropdown-toggle" href="${escapeAttr(url)}"${linkTargetAttr(item)}>${label}${badgeHtml}</a>
        ${topLevelExpandButtonHtml()}
        ${renderBootstrapDropdownMenu(item.children, locale)}
      </li>`;
  }

  return '';
}

/** 生成主导航 `<ul>` 内联 HTML（供 SSR set:html） */
export function renderPrimaryNavListHtml(menuItems: MenuItem[], locale: string): string {
  let html = '';
  for (const item of menuItems) {
    html += renderTopLevelItem(item, locale);
  }
  return html || '<!-- empty menu -->';
}
