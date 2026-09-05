/**
 * Terms 页面 fallback 与 CDN metadata 生成（无 Astro 依赖）
 */

import type { GuideSectionDisplay } from './guidePageFallback';

export interface TermsPageDisplay {
  seoTitle: string;
  breadcrumb: { title: string; activeLabel: string; homeHref: string };
  updatedHtml: string;
  introHtml: string;
  sections: GuideSectionDisplay[];
}

const plain = (bodyHtml: string) => ({ style: 'plain' as const, bodyHtml });

const p = (html: string, className?: string) => ({
  type: 'paragraph' as const,
  html,
  className,
});

const TERMS_FALLBACK_EN: TermsPageDisplay = {
  seoTitle: 'Terms of Service',
  breadcrumb: { title: 'Terms of Service', activeLabel: 'Terms of Service', homeHref: '/' },
  updatedHtml: '<strong>Last Updated:</strong> April, 2026',
  introHtml:
    'Welcome to the NEW WORLD IMPORTS website.<br>Please read these Terms of Service carefully before using this website. By accessing, browsing, or using this website, you agree to be bound by these terms. If you do not agree, please do not use this website.',
  sections: [
    {
      heading: '1. Website Purpose',
      blocks: [
        p(
          'This website is provided for general information about NEW WORLD IMPORTS, its product categories, services, business information, and contact details.<br>The content on this website is for general informational purposes only and does not constitute a binding offer, commitment, or guarantee unless expressly stated otherwise.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '2. Accuracy of Information',
      blocks: [
        p(
          'We make reasonable efforts to ensure that the information on this website is accurate, current, and complete.<br>However, we do not guarantee the accuracy, completeness, suitability, or continued availability of any content. Product information, categories, service coverage, and other content may be updated, changed, or removed without notice.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '3. Product and Service Information',
      blocks: [
        p(
          'Any product categories, service descriptions, or related information shown on this website are provided for general reference only.<br>Actual product availability, specifications, pricing, delivery coverage, and business terms are subject to direct confirmation and formal agreement where applicable.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '4. Quotes and Business Inquiries',
      blocks: [
        p(
          'Submitting an inquiry, quote request, or contact form through this website does not create an order confirmation, supply commitment, or contractual relationship.<br>All quotations, supply arrangements, and business terms are subject to further review and final confirmation by both parties.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '5. Intellectual Property',
      blocks: [
        p(
          'Unless otherwise stated, all text, images, logos, layout design, graphics, content structure, and other materials on this website are the property of NEW WORLD IMPORTS or its respective rights holders and are protected by applicable intellectual property laws.<br>No part of this website may be copied, reproduced, modified, published, distributed, displayed, or used for commercial purposes without prior written permission.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '6. User Conduct',
      blocks: [
        p('By using this website, you agree not to:', 'mb-2'),
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            plain('Use the website for any unlawful purpose'),
            plain('Interfere with or disrupt the normal operation of the website'),
            plain('Attempt unauthorized access to the website, servers, or related systems'),
            plain('Transmit harmful code, malware, or other content that may damage website security'),
            plain('Use the website for fraudulent, misleading, or infringing activities'),
          ],
        },
      ],
    },
    {
      heading: '7. Third-Party Links',
      blocks: [
        p(
          'This website may contain links to third-party websites or resources. These links are provided solely for convenience. We are not responsible for the content, availability, or privacy practices of any third-party sites, nor do we endorse or guarantee them.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '8. Disclaimer',
      blocks: [
        p(
          'This website and its content are provided on an “as is” and “as available” basis.<br>To the fullest extent permitted by law, NEW WORLD IMPORTS makes no warranties regarding the continued availability of the website, error-free operation, absence of viruses, or complete accuracy of content.<br>Your use of this website is at your own risk.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '9. Limitation of Liability',
      blocks: [
        p(
          'To the fullest extent permitted by law, NEW WORLD IMPORTS shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or related to your use of, or inability to use, this website, including but not limited to loss of data, business interruption, loss of profits, or loss of goodwill.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '10. Indemnification',
      blocks: [
        p(
          'You agree to indemnify and hold harmless NEW WORLD IMPORTS from any claims, losses, liabilities, costs, or expenses arising from your violation of these Terms of Service, misuse of the website, or infringement of any third-party rights.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '11. Changes to These Terms',
      blocks: [
        p(
          'We reserve the right to update, modify, or replace these Terms of Service at any time without prior notice. Any revised terms will be posted on this page and will become effective upon posting. Your continued use of the website after changes are posted constitutes your acceptance of the revised terms.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '12. Governing Law',
      blocks: [
        p(
          'These Terms of Service shall be governed by and interpreted in accordance with applicable law. Any disputes arising from or relating to this website shall be subject to the jurisdiction of the appropriate courts or legal authorities.',
          'mb-4'
        ),
      ],
    },
    {
      heading: '13. Contact Us',
      blocks: [
        p(
          'If you have any questions about these Terms of Service, please use the <a href="/contact" class="theme-color text-decoration-underline">contact page</a> on our website to get in touch with us.',
          'mb-0'
        ),
      ],
    },
  ],
};

const TERMS_FALLBACK_ZH: TermsPageDisplay = {
  seoTitle: '服务条款',
  breadcrumb: { title: '服务条款', activeLabel: '服务条款', homeHref: '/' },
  updatedHtml: '<strong>最新更新：</strong>2026年4月',
  introHtml:
    '欢迎访问 NEW WORLD IMPORTS 网站。<br>在使用本网站之前，请仔细阅读以下服务条款。访问、浏览或使用本网站，即表示您同意受本条款约束。如果您不同意这些条款，请停止使用本网站。',
  sections: [
    {
      heading: '1. 网站用途',
      blocks: [
        p(
          '本网站用于提供有关 NEW WORLD IMPORTS、其产品类别、服务信息、业务介绍以及联系方式的内容。<br>本网站上的内容仅供一般信息参考，不构成任何具有法律约束力的报价、承诺或保证，除非另有明确说明。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '2. 信息准确性',
      blocks: [
        p(
          '我们会尽合理努力确保网站信息准确、及时和完整。<br>但对于网站内容的准确性、完整性、适用性或持续可用性，我们不作任何明示或暗示的保证。产品信息、分类、服务范围及其他内容可能会在未提前通知的情况下更新、修改或删除。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '3. 产品与服务信息',
      blocks: [
        p(
          '网站中展示的产品类别、服务内容及相关说明仅作一般展示用途。<br>实际产品供应、规格、价格、配送范围及合作条件，应以双方实际沟通、确认或正式文件为准。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '4. 报价与业务咨询',
      blocks: [
        p(
          '通过网站提交询价、联系表单或其他咨询，并不自动构成订单确认、供货承诺或合同关系。<br>所有报价、供货安排及合作条件均需经过进一步确认，并以双方最终达成的正式协议或确认内容为准。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '5. 知识产权',
      blocks: [
        p(
          '除非另有说明，本网站上的文字、图片、标识、版面设计、图形、内容结构及其他材料，均归 NEW WORLD IMPORTS 或相关权利人所有，并受适用的知识产权法律保护。<br>未经事先书面许可，任何人不得复制、修改、发布、传播、展示或用于商业用途。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '6. 用户行为',
      blocks: [
        p('您同意在使用本网站时，不会：', 'mb-2'),
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            plain('以任何违法方式使用本网站'),
            plain('干扰或破坏网站的正常运行'),
            plain('试图未经授权访问网站、服务器或相关系统'),
            plain('传播任何有害代码、恶意软件或其他可能损害网站安全的内容'),
            plain('利用本网站从事虚假、误导或侵权行为'),
          ],
        },
      ],
    },
    {
      heading: '7. 第三方链接',
      blocks: [
        p(
          '本网站可能包含第三方网站或资源的链接。这些链接仅为方便用户提供。对于第三方网站的内容、可用性或隐私做法，我们不承担责任，也不表示认可或担保。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '8. 免责声明',
      blocks: [
        p(
          '本网站及其内容按“现状”和“可用”基础提供。<br>在适用法律允许的最大范围内，NEW WORLD IMPORTS 不对网站的持续可用性、无错误运行、无病毒或内容完全准确作出保证。<br>您使用本网站的风险由您自行承担。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '9. 责任限制',
      blocks: [
        p(
          '在法律允许的最大范围内，NEW WORLD IMPORTS 不对因使用或无法使用本网站而导致的任何直接、间接、附带、特殊或后果性损失承担责任，包括但不限于数据丢失、业务中断、利润损失或商誉损失。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '10. 赔偿',
      blocks: [
        p(
          '您同意，如因您违反本服务条款、违法使用本网站或侵犯第三方权利而引起任何索赔、损失、责任、费用或支出，您将承担相应责任，并使 NEW WORLD IMPORTS 免受损害。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '11. 条款修改',
      blocks: [
        p(
          '我们保留随时更新、修改或替换本服务条款的权利，恕不另行通知。更新后的条款将在本页面发布，并自发布之日起生效。您在条款更新后继续使用本网站，即视为接受更新后的条款。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '12. 适用法律',
      blocks: [
        p(
          '本服务条款应受适用法律管辖并依其解释。与本网站相关的任何争议，应提交有管辖权的法院或相关法律机构处理。',
          'mb-4'
        ),
      ],
    },
    {
      heading: '13. 联系我们',
      blocks: [
        p(
          '如果您对本服务条款有任何疑问，请通过本网站的 <a href="/contact" class="theme-color text-decoration-underline">联系页面</a> 与我们取得联系。',
          'mb-0'
        ),
      ],
    },
  ],
};

export function getTermsFallback(locale: string): TermsPageDisplay {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? TERMS_FALLBACK_ZH : TERMS_FALLBACK_EN;
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

export function buildTermsPageMetadataForCdn(): Record<string, unknown> {
  const en = TERMS_FALLBACK_EN;
  const zh = TERMS_FALLBACK_ZH;

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
