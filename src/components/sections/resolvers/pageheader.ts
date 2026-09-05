import { loadComponentsHtmlShell } from './componentsHtml';

/** 从 metadata.translations[].html_url（或内联 html）加载 PageHeader 展示模板壳；没有则返回 null。 */
export async function loadPageHeaderSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
