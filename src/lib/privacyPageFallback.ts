/**
 * Privacy 页面 fallback 与 CDN metadata 生成（无 Astro 依赖）
 */

import type { GuideSectionDisplay } from './guidePageFallback';

export interface PrivacyPageDisplay {
  seoTitle: string;
  breadcrumb: { title: string; activeLabel: string; homeHref: string };
  updatedHtml: string;
  introHtml: string;
  sections: GuideSectionDisplay[];
}

const plain = (bodyHtml: string) => ({ style: 'plain' as const, bodyHtml });

const PRIVACY_FALLBACK_EN: PrivacyPageDisplay = {
  seoTitle: 'Privacy Policy',
  breadcrumb: { title: 'Privacy Policy', activeLabel: 'Privacy Policy', homeHref: '/' },
  updatedHtml: '<strong>Last Updated:</strong> April, 2026',
  introHtml:
    'Welcome to the NEW WORLD IMPORTS website. We value your privacy and are committed to protecting the personal information you provide when using our website. This Privacy Policy explains how we collect, use, store, and protect your information.',
  sections: [
    {
      heading: '1. Information We Collect',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-2',
          html: 'When you visit our website, submit a form, request a quote, or contact us, we may collect the following information:',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            plain('Your name'),
            plain('Company name'),
            plain('Phone number'),
            plain('Email address'),
            plain('The content of your inquiry, quote request, or message'),
            plain('Technical information such as browser type, device information, IP address, and browsing activity'),
          ],
        },
      ],
    },
    {
      heading: '2. How We Use Your Information',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-2',
          html: 'We may use your information for the following purposes:',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            plain('To respond to your inquiries or quote requests'),
            plain('To provide product, service, or business-related information'),
            plain('To improve website content, functionality, and user experience'),
            plain('To maintain website security and prevent misuse'),
            plain('To conduct internal analysis and business administration as permitted by law'),
          ],
        },
      ],
    },
    {
      heading: '3. Cookies and Website Data',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'Our website may use cookies or similar technologies to help us understand website traffic, improve site performance, and enhance the user experience. You may manage or disable cookies through your browser settings, although doing so may affect certain website functions.',
        },
      ],
    },
    {
      heading: '4. Sharing of Information',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-2',
          html: 'We do not sell, rent, or trade your personal information. We may disclose your information in the following circumstances:',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            plain('When working with trusted service providers to support communication or website-related services'),
            plain('When required by law, regulation, court order, or government request'),
            plain('When necessary to protect the rights, property, or safety of our company, customers, or the public'),
          ],
        },
      ],
    },
    {
      heading: '5. Data Retention and Security',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'We take reasonable technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of internet transmission or electronic storage is completely secure.',
        },
      ],
    },
    {
      heading: '6. Third-Party Links',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'Our website may contain links to third-party websites. We are not responsible for the content, privacy practices, or security of those external websites. We encourage you to review their privacy policies before using them.',
        },
      ],
    },
    {
      heading: '7. Your Choices and Rights',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'You may choose not to provide certain information, but this may limit our ability to respond to your request or provide services. Where permitted by applicable law, you may also request access to, correction of, or deletion of your personal information.',
        },
      ],
    },
    {
      heading: '8. Children’s Privacy',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'This website is not intended for children, and we do not knowingly collect personal information from children.',
        },
      ],
    },
    {
      heading: '9. Updates to This Policy',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'We may update this Privacy Policy from time to time to reflect changes in our business, website functionality, or legal requirements. Any updates will be posted on this page, and the “Last Updated” date at the top will indicate the effective date of the latest version.',
        },
      ],
    },
    {
      heading: '10. Contact Us',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-0',
          html: 'If you have any questions about this Privacy Policy or would like to contact us regarding your personal information, please use the <a href="/contact" class="theme-color text-decoration-underline">contact page</a> on our website.',
        },
      ],
    },
  ],
};

const PRIVACY_FALLBACK_ZH: PrivacyPageDisplay = {
  seoTitle: '隐私政策',
  breadcrumb: { title: '隐私政策', activeLabel: '隐私政策', homeHref: '/' },
  updatedHtml: '<strong>最新更新：</strong>2026年4月',
  introHtml:
    '欢迎访问 NEW WORLD IMPORTS 网站。我们重视您的隐私，并致力于保护您在使用本网站时提供给我们的个人信息。本隐私政策说明我们如何收集、使用、存储和保护您的信息。',
  sections: [
    {
      heading: '1. 我们收集的信息',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-2',
          html: '当您访问本网站、提交表单、请求报价或与我们联系时，我们可能会收集以下信息：',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            plain('您的姓名'),
            plain('公司名称'),
            plain('电话号码'),
            plain('电子邮箱地址'),
            plain('您提交的询价内容或留言'),
            plain('您访问网站时提供的技术信息，例如浏览器类型、设备信息、IP 地址及浏览行为数据'),
          ],
        },
      ],
    },
    {
      heading: '2. 我们如何使用您的信息',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-2',
          html: '我们收集您的信息，主要用于以下目的：',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            plain('回复您的咨询或报价请求'),
            plain('提供产品、服务或业务合作相关信息'),
            plain('改进网站内容、功能和用户体验'),
            plain('维护网站安全并防止滥用行为'),
            plain('在法律允许的范围内进行内部分析和业务管理'),
          ],
        },
      ],
    },
    {
      heading: '3. Cookies 与网站数据',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: '本网站可能使用 cookies 或类似技术，以帮助我们了解网站流量、改进页面表现，并提升访问体验。您可以通过浏览器设置管理或禁用 cookies，但这可能影响部分网站功能的正常使用。',
        },
      ],
    },
    {
      heading: '4. 信息共享',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-2',
          html: '我们不会出售、出租或交易您的个人信息。在以下情况下，我们可能会披露您的信息：',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            plain('为了完成业务沟通或服务支持，与受信任的服务提供商合作时'),
            plain('根据法律、法规、法院命令或政府要求'),
            plain('为保护本公司、客户或公众的合法权益和安全'),
          ],
        },
      ],
    },
    {
      heading: '5. 信息保存与安全',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: '我们会采取合理的技术和管理措施，保护您的个人信息免受未经授权的访问、泄露、修改或破坏。但请注意，任何互联网传输或电子存储方式都无法保证绝对安全。',
        },
      ],
    },
    {
      heading: '6. 第三方链接',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: '本网站可能包含第三方网站链接。对于这些外部网站的内容、隐私做法或安全措施，我们不承担责任。建议您在访问第三方网站时查阅其隐私政策。',
        },
      ],
    },
    {
      heading: '7. 您的选择与权利',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-2',
          html: '您可以选择不向我们提供某些信息，但这可能影响我们为您提供服务或回应您的请求。在适用法律允许的范围内，您也可以要求了解、更正或删除我们持有的您的个人信息。',
        },
      ],
    },
    {
      heading: '8. 儿童隐私',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: '本网站不以儿童为目标用户，我们不会故意收集儿童的个人信息。',
        },
      ],
    },
    {
      heading: '9. 隐私政策更新',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: '我们可能会不时更新本隐私政策，以反映业务、网站功能或法律要求的变化。更新后的版本将在本页面发布，并以页面顶部显示的“最新更新”日期为准。',
        },
      ],
    },
    {
      heading: '10. 联系我们',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-0',
          html: '如果您对本隐私政策有任何疑问，或希望就您的个人信息与我们联系，请通过本网站的 <a href="/contact" class="theme-color text-decoration-underline">联系页面</a> 与我们取得联系。',
        },
      ],
    },
  ],
};

export function getPrivacyFallback(locale: string): PrivacyPageDisplay {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? PRIVACY_FALLBACK_ZH : PRIVACY_FALLBACK_EN;
}

function sectionBlocksToMeta(
  section: GuideSectionDisplay,
  zSection: GuideSectionDisplay | undefined
) {
  return section.blocks.map((block, bi) => {
    const zBlock = zSection?.blocks[bi];
    if (block.type === 'paragraph') {
      return {
        type: 'paragraph',
        class: block.className || '',
        translations: [
          { language_code: 'en', is_primary: true, text: block.html || '' },
          { language_code: 'zh', text: zBlock?.html ?? block.html ?? '' },
        ],
      };
    }
    return {
      type: block.type,
      list_class: block.listClass || '',
      items: (block.items || []).map((item, ii) => {
        const zItem = zBlock?.items?.[ii];
        return {
          style: item.style,
          item_class: item.itemClass || '',
          translations: [
            {
              language_code: 'en',
              is_primary: true,
              title: item.title || '',
              text: item.bodyHtml,
            },
            {
              language_code: 'zh',
              title: zItem?.title ?? item.title ?? '',
              text: zItem?.bodyHtml ?? item.bodyHtml,
            },
          ],
        };
      }),
    };
  });
}

export function buildPrivacyPageMetadataForCdn(): Record<string, unknown> {
  const en = PRIVACY_FALLBACK_EN;
  const zh = PRIVACY_FALLBACK_ZH;

  return {
    seo: {
      translations: [
        { language_code: 'en', is_primary: true, title: en.seoTitle },
        { language_code: 'zh', title: zh.seoTitle },
      ],
    },
    breadcrumb: {
      home_href: en.breadcrumb.homeHref,
      translations: [
        {
          language_code: 'en',
          is_primary: true,
          title: en.breadcrumb.title,
          label: en.breadcrumb.activeLabel,
        },
        {
          language_code: 'zh',
          title: zh.breadcrumb.title,
          label: zh.breadcrumb.activeLabel,
        },
      ],
    },
    updated: {
      translations: [
        { language_code: 'en', is_primary: true, text: en.updatedHtml },
        { language_code: 'zh', text: zh.updatedHtml },
      ],
    },
    intro: {
      translations: [
        { language_code: 'en', is_primary: true, text: en.introHtml },
        { language_code: 'zh', text: zh.introHtml },
      ],
    },
    sections: en.sections.map((section, si) => ({
      translations: [
        { language_code: 'en', is_primary: true, title: section.heading },
        { language_code: 'zh', title: zh.sections[si]?.heading ?? section.heading },
      ],
      blocks: sectionBlocksToMeta(section, zh.sections[si]),
    })),
  };
}
