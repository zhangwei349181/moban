import { loadComponentsHtmlShell } from './componentsHtml';

export { resolveListFilterClientInit } from '../../../lib/listFilterInit';
export type { ListFilterClientInitConfig } from '../../../lib/listFilterInit';

/** 从 metadata.translations[].html_url（或内联 html）加载 ListFilter 展示模板壳；没有则返回 null。 */
export async function loadListFilterSectionTemplate(
  metadata: Record<string, unknown> | undefined,
  locale: string,
  baseUrl: URL
): Promise<string | null> {
  return loadComponentsHtmlShell(metadata, locale, baseUrl);
}
