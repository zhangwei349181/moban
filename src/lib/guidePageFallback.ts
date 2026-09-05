/**
 * Guide 页面 fallback 与 CDN metadata 生成（无 Astro 依赖）
 */

export type GuideListItemStyle = 'stacked' | 'inline' | 'plain';

export interface GuideListItemDisplay {
  style: GuideListItemStyle;
  title?: string;
  bodyHtml: string;
  itemClass?: string;
}

export type GuideBlockType = 'paragraph' | 'ordered_list' | 'unordered_list';

export interface GuideBlockDisplay {
  type: GuideBlockType;
  html?: string;
  className?: string;
  listClass?: string;
  items?: GuideListItemDisplay[];
}

export interface GuideSectionDisplay {
  heading: string;
  blocks: GuideBlockDisplay[];
}

export interface GuidePageDisplay {
  seoTitle: string;
  breadcrumb: { title: string; activeLabel: string; homeHref: string };
  introHtml: string;
  sections: GuideSectionDisplay[];
  closingHtml: string;
}

const GUIDE_FALLBACK_EN: GuidePageDisplay = {
  seoTitle: 'Getting Started',
  breadcrumb: { title: 'Getting Started', activeLabel: 'Getting Started', homeHref: '/' },
  introHtml:
    'New to NEW WORLD IMPORTS? Start here to quickly learn about our product categories, quote process, and contact information.',
  sections: [
    {
      heading: 'Section 1: Welcome to NEW WORLD IMPORTS',
      blocks: [
        {
          type: 'paragraph',
          html: 'Since 1986, NEW WORLD IMPORTS has been dedicated to supplying top quality Asian foods to Western Canada.<br>We are a family-owned company focused on sourcing trusted products from reputable overseas brands and supporting retailers, grocery stores, and food-related businesses with dependable supply.',
        },
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'If this is your first time visiting our website, this page will help you get started quickly.',
        },
      ],
    },
    {
      heading: 'Section 2: Start with Our Product Categories',
      blocks: [
        {
          type: 'paragraph',
          html: 'We currently offer three main product categories:',
        },
        {
          type: 'ordered_list',
          listClass: 'text-content mb-4',
          items: [
            {
              style: 'stacked',
              title: 'Thailand Products',
              bodyHtml:
                'Browse selected products from Thailand, including coconut products, curries, rice, noodles, beverages, and other everyday essentials.',
            },
            {
              style: 'stacked',
              title: 'Chinese Products',
              bodyHtml:
                'Explore a wide range of Chinese food categories, including tea, noodles, seasonings, spices, snacks, and grocery essentials.',
              itemClass: 'mt-2',
            },
            {
              style: 'stacked',
              title: 'Vietnamese Products',
              bodyHtml:
                'Discover Vietnamese food products and cooking ingredients, including rice products, noodles, snacks, and other market-ready essentials.',
              itemClass: 'mt-2',
            },
          ],
        },
      ],
    },
    {
      heading: 'Section 3: How to Request a Quote',
      blocks: [
        {
          type: 'paragraph',
          html: 'If you would like to learn more about our products or business opportunities, you can:',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content',
          items: [
            {
              style: 'plain',
              bodyHtml: 'Browse our product categories to identify your areas of interest',
            },
            {
              style: 'plain',
              bodyHtml: 'Visit the Request a Quote page to submit an inquiry',
            },
            {
              style: 'plain',
              bodyHtml: 'Contact our team directly by phone or email',
            },
          ],
        },
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'Our team will respond based on your business needs.',
        },
      ],
    },
    {
      heading: 'Section 4: Delivery and Service',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'NEW WORLD IMPORTS primarily serves Western Canada.<br>For delivery arrangements, service coverage, or business inquiries, please contact us directly.',
        },
      ],
    },
    {
      heading: 'Section 5: Contact Us',
      blocks: [
        {
          type: 'paragraph',
          html: 'If you need assistance, please feel free to contact us:',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            { style: 'inline', title: 'Phone:', bodyHtml: '604-270-0036' },
            { style: 'inline', title: 'Email:', bodyHtml: 'nwimports.newworld@gmail.com' },
            {
              style: 'inline',
              title: 'Address:',
              bodyHtml: '578 E Kent Ave S, Vancouver BC V5X 4V6',
            },
          ],
        },
      ],
    },
  ],
  closingHtml:
    'Thank you for visiting NEW WORLD IMPORTS.<br>Whether you are looking for a reliable long-term Asian food supplier or simply want to learn more about our products, we look forward to supporting your business.',
};

const GUIDE_FALLBACK_ZH: GuidePageDisplay = {
  seoTitle: '新手指南',
  breadcrumb: { title: '新手指南', activeLabel: '新手指南', homeHref: '/' },
  introHtml:
    '第一次来到 NEW WORLD IMPORTS？从这里开始，快速了解我们的产品类别、询价方式和联系方式。',
  sections: [
    {
      heading: '第一部分：欢迎来到 NEW WORLD IMPORTS',
      blocks: [
        {
          type: 'paragraph',
          html: 'NEW WORLD IMPORTS 自 1986 年起专注于为加拿大西部市场提供高品质亚洲食品。<br>我们是一家家族经营企业，致力于从信誉良好的海外品牌引进优质产品，为零售商、杂货店及食品相关客户提供稳定可靠的产品供应。',
        },
        {
          type: 'paragraph',
          className: 'mb-4',
          html: '如果您是第一次访问我们的网站，本页将帮助您快速了解如何开始浏览和联系我司。',
        },
      ],
    },
    {
      heading: '第二部分：从产品分类开始',
      blocks: [
        {
          type: 'paragraph',
          html: '我们目前主要提供以下三大产品类别：',
        },
        {
          type: 'ordered_list',
          listClass: 'text-content mb-4',
          items: [
            {
              style: 'stacked',
              title: '泰国产品',
              bodyHtml:
                '浏览来自泰国的精选食品与常用商品，包括椰子制品、咖喱、米类、面类、饮品及更多日常商品。',
            },
            {
              style: 'stacked',
              title: '中国产品',
              bodyHtml:
                '探索丰富的中国食品类别，包括茶叶、面食、调味品、香料、零食及各类日常杂货产品。',
              itemClass: 'mt-2',
            },
            {
              style: 'stacked',
              title: '越南产品',
              bodyHtml:
                '查看越南特色食品与烹饪原料，包括米制品、面类、小吃及适合多样市场需求的精选产品。',
              itemClass: 'mt-2',
            },
          ],
        },
      ],
    },
    {
      heading: '第三部分：如何获取报价',
      blocks: [
        {
          type: 'paragraph',
          html: '如果您希望进一步了解产品或合作信息，可以通过以下方式与我们联系：',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content',
          items: [
            { style: 'plain', bodyHtml: '浏览产品分类，了解您感兴趣的商品方向' },
            { style: 'plain', bodyHtml: '前往 Request a Quote 页面提交询价需求' },
            { style: 'plain', bodyHtml: '直接通过电话或邮箱联系我司团队' },
          ],
        },
        {
          type: 'paragraph',
          className: 'mb-4',
          html: '我们的团队会根据您的业务需求提供相关信息。',
        },
      ],
    },
    {
      heading: '第四部分：配送与服务',
      blocks: [
        {
          type: 'paragraph',
          className: 'mb-4',
          html: 'NEW WORLD IMPORTS 主要服务 加拿大西部市场。<br>如您希望了解配送安排、覆盖范围或业务合作细节，欢迎直接联系我们。',
        },
      ],
    },
    {
      heading: '第五部分：联系我们',
      blocks: [
        {
          type: 'paragraph',
          html: '如果您需要帮助，欢迎随时与我们联系：',
        },
        {
          type: 'unordered_list',
          listClass: 'text-content mb-4',
          items: [
            { style: 'inline', title: '电话：', bodyHtml: '604-270-0036' },
            { style: 'inline', title: '邮箱：', bodyHtml: 'nwimports.newworld@gmail.com' },
            { style: 'inline', title: '地址：', bodyHtml: '578 E Kent Ave S, Vancouver BC V5X 4V6' },
          ],
        },
      ],
    },
  ],
  closingHtml:
    '感谢您访问 NEW WORLD IMPORTS。<br>无论您是在寻找长期稳定的亚洲食品供应商，还是希望了解更多产品信息，我们都期待为您提供帮助。',
};

export function getGuideFallback(locale: string): GuidePageDisplay {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? GUIDE_FALLBACK_ZH : GUIDE_FALLBACK_EN;
}

export function buildGuidePageMetadataForCdn(): Record<string, unknown> {
  const en = GUIDE_FALLBACK_EN;
  const zh = GUIDE_FALLBACK_ZH;

  const sections = en.sections.map((section, si) => {
    const zSection = zh.sections[si];
    return {
      translations: [
        { language_code: 'en', is_primary: true, title: section.heading },
        { language_code: 'zh', title: zSection?.heading ?? section.heading },
      ],
      blocks: section.blocks.map((block, bi) => {
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
      }),
    };
  });

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
    intro: {
      translations: [
        { language_code: 'en', is_primary: true, text: en.introHtml },
        { language_code: 'zh', text: zh.introHtml },
      ],
    },
    sections,
    closing: {
      translations: [
        { language_code: 'en', is_primary: true, text: en.closingHtml },
        { language_code: 'zh', text: zh.closingHtml },
      ],
    },
  };
}
