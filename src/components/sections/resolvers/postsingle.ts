import { loadComponentsHtmlShell } from './componentsHtml';

export { resolvePostSingleClientInit } from '../../../lib/postSingleInit';
export type { PostSingleClientInitConfig } from '../../../lib/postSingleInit';

/** 从 metadata.translations[].html_url（或内联 html）加载 PostSingle 展示模板壳；没有则返回 null。 */
export async function loadPostSingleSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
