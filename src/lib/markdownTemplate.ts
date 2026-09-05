const MARKDOWN_CONTENT_TOKENS = ['{{MARKDOWN_CONTENT}}', '{{PAGE_CONTENT}}'];

export function injectMarkdownContent(templateShell: string, contentHtml: string): string {
  const shell = templateShell || '';
  for (const token of MARKDOWN_CONTENT_TOKENS) {
    if (shell.includes(token)) return shell.split(token).join(contentHtml);
  }
  return `${shell}${contentHtml}`;
}
