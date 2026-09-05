/**
 * Markdown → HTML（服务端 SSR）
 */

import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

/** 是否像远程 Markdown 资源地址 */
export function isRemoteMarkdownUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  // 支持站点内 public 资源：/html/xxx.md
  if (trimmed.startsWith('/')) {
    const p = trimmed.toLowerCase();
    return p.endsWith('.md') || p.endsWith('.markdown') || /\.md($|[?#])/i.test(trimmed);
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const path = url.pathname.toLowerCase();
    return path.endsWith('.md') || path.endsWith('.markdown') || /\.md($|[?#])/i.test(trimmed);
  } catch {
    return false;
  }
}

/** 是否像远程 HTML 页面地址（仅用于 metadata.content* 的富文本展示） */
export function isRemoteHtmlUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  // 支持站点内 public 资源：/html/xxx.html
  if (trimmed.startsWith('/')) {
    const p = trimmed.toLowerCase();
    return p.endsWith('.html') || p.endsWith('.htm') || /\.html?($|[?#])/i.test(trimmed);
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const path = url.pathname.toLowerCase();
    return path.endsWith('.html') || path.endsWith('.htm') || /\.html?($|[?#])/i.test(trimmed);
  } catch {
    return false;
  }
}

/** 拉取远程 Markdown 原文 */
export async function fetchRemoteMarkdown(url: string, baseUrl?: URL): Promise<string | null> {
  try {
    const input = url.trim();
    const resolved = input.startsWith('/') && baseUrl ? new URL(input, baseUrl) : input;
    const response = await fetch(resolved, {
      cache: 'no-store',
      headers: { Accept: 'text/markdown, text/plain, */*' },
    });
    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) return null;

    const text = await response.text();
    return text.trim() ? text : null;
  } catch (error) {
    console.error('[markdown] fetch failed:', url, error);
    return null;
  }
}

/** 拉取远程 HTML 原文（用于页面 metadata.content* 直接展示） */
export async function fetchRemoteHtml(url: string, baseUrl?: URL): Promise<string | null> {
  try {
    const input = url.trim();
    const resolved = input.startsWith('/') && baseUrl ? new URL(input, baseUrl) : input;
    const response = await fetch(resolved, {
      cache: 'no-store',
      headers: { Accept: 'text/html, text/plain, */*' },
    });
    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    // 若明确不是 HTML（例如 application/json），直接拒绝，避免误把接口响应塞进 set:html
    if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const text = await response.text();
    return text.trim() ? text : null;
  } catch (error) {
    console.error('[html] fetch failed:', url, error);
    return null;
  }
}

/**
 * GFM 会把 `[https://example.com]` 误解析为链接（href 含 `%5D`，并残留 `[`）。
 * 将方括号内的裸 URL / 邮箱转为标准 `[text](url)`，占位符如 `[Company Name]` 不受影响。
 */
function normalizeBracketedAutolinks(markdown: string): string {
  return markdown
    .replace(/\[(https?:\/\/[^\]\s]+)\](?!\()/g, '[$1]($1)')
    .replace(/\[([^\]\s@]+@[^\]\s]+)\](?!\()/g, '[$1](mailto:$1)');
}

/** 仅当整篇文档本身就是 HTML 页面时才跳过 Markdown 解析（避免代码示例里的标签误判） */
function isStandaloneHtmlDocument(input: string): boolean {
  const s = input.trim();
  if (!s.startsWith('<')) return false;
  if (/^#{1,6}\s/m.test(s)) return false;
  if (/^```/m.test(s)) return false;
  if (/^[-*+]\s+\S/m.test(s)) return false;
  return /^<(!DOCTYPE|html|article|main|section)\b/i.test(s);
}

/** 将 Markdown 或已是 HTML 的字符串转为可安全插入的 HTML */
export function renderMarkdownToHtml(input: string): string {
  const raw = (input || '').trim();
  if (!raw) return '';
  if (isStandaloneHtmlDocument(raw)) return raw;
  const normalized = normalizeBracketedAutolinks(raw);
  return marked.parse(normalized, { async: false }) as string;
}
