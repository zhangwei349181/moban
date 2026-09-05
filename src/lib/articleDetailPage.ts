/**
 * 文章详情页（article / article*）共用数据加载
 */

import type { PageComponentSlot } from './pageComponents';
import { loadCmsPageViewModel, type CmsPageViewModel } from './cmsPage';
import { loadArticleDetailViewModel, type ArticleDetailViewModel } from './articleDetail';
import { getSystemPageSeoDefaults } from './pageMetadata';
import { isPostSingleSlot } from './postSingleComponentCode';
import { isPageHeaderSlot } from './pageHeaderComponentCode';
import { isLayoutSectionCode } from './layoutComponentCode';
import { filterPageBodySlots } from './pageBodySlots';
import { isPageFooterChromeSlot, isPageHeaderChromeSlot } from './pageChromeSlots';
import { normalizeDetailPageCode } from './detailPageRoute';

export const DEFAULT_ARTICLE_PAGEHEADER_METADATA = {
  bare: true,
  context: 'article',
  list_path: '/bloglist',
  breadcrumb: {
    items: [
      { label_key: 'breadcrumb_home', href: '/' },
      { label_key: 'new_blog_section_title', href: '/bloglist' },
    ],
  },
};

export const DEFAULT_ARTICLE_POSTSINGLE_METADATA = {
  bare: true,
  list_path: '/bloglist',
};

export interface ArticleDetailPageModel {
  pageCode: string;
  articleId: string;
  locale: string;
  view: ArticleDetailViewModel;
  cms: CmsPageViewModel;
  headerSlots: PageComponentSlot[];
  pageheaderSlots: PageComponentSlot[];
  postsingleSlots: PageComponentSlot[];
  bodySlots: PageComponentSlot[];
  footerSlots: PageComponentSlot[];
  pageHeaderSeoFallback: { title: string; description: string; keywords: string };
}

export async function loadArticleDetailPageModel(
  pageCodeInput: string,
  articleId: string,
  locale: string,
  tenantId: string,
  url: URL
): Promise<ArticleDetailPageModel | null> {
  const pageCode = normalizeDetailPageCode(pageCodeInput);
  if (!pageCode) return null;

  const id = String(articleId || '').trim();
  if (!id) return null;

  const view = await loadArticleDetailViewModel(id, locale, tenantId);
  if (!view) return null;

  const cms = await loadCmsPageViewModel(
    pageCode,
    locale,
    tenantId,
    getSystemPageSeoDefaults(locale, 'article'),
    url,
    { mainClassFallback: '' }
  );

  const headerSlots = cms.pageComponents.filter(isPageHeaderChromeSlot);
  const pageheaderSlots = cms.pageComponents.filter(isPageHeaderSlot);
  const postsingleSlots = cms.pageComponents.filter(isPostSingleSlot);
  const bodySlots = filterPageBodySlots(
    cms.pageComponents.filter(
      (s) =>
        !isPageHeaderChromeSlot(s) &&
        !isPageFooterChromeSlot(s) &&
        !isPostSingleSlot(s) &&
        !isPageHeaderSlot(s) &&
        !isLayoutSectionCode(s.normalizedCode)
    )
  );
  const footerSlots = cms.pageComponents.filter(isPageFooterChromeSlot);

  return {
    pageCode,
    articleId: id,
    locale,
    view,
    cms,
    headerSlots,
    pageheaderSlots,
    postsingleSlots,
    bodySlots,
    footerSlots,
    pageHeaderSeoFallback: {
      title: view.title,
      description: view.description,
      keywords: view.keywords ?? view.title,
    },
  };
}
