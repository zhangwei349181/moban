/**
 * About 页面 fallback 与 CDN metadata 生成（无 Astro 依赖）
 */

export interface AboutHighlightDisplay {
  icon: string;
  text: string;
}

export interface AboutStatDisplay {
  icon: string;
  value: string;
  label: string;
  text: string;
}

export interface AboutBrandDisplay {
  image: string;
  alt: string;
  name: string;
  subtitle: string;
  description: string;
}

export interface AboutReviewDisplay {
  image: string;
  title: string;
  quote: string;
  profileTitle: string;
  profileSubtitle: string;
}

export interface AboutPageDisplay {
  seoTitle: string;
  breadcrumb: { title: string; activeLabel: string; homeHref: string };
  intro: {
    image1: string;
    image1Alt: string;
    image2: string;
    image2Alt: string;
    eyebrow: string;
    heading: string;
    body: string;
    highlights: AboutHighlightDisplay[];
  };
  stats: { eyebrow: string; heading: string; items: AboutStatDisplay[] };
  brands: { eyebrow: string; heading: string; body: string; items: AboutBrandDisplay[] };
  reviews: { eyebrow: string; heading: string; items: AboutReviewDisplay[] };
}

const ABOUT_FALLBACK_EN: AboutPageDisplay = {
  seoTitle: 'About Us',
  breadcrumb: { title: 'About Us', activeLabel: 'About Us', homeHref: '/' },
  intro: {
    image1: '/images/inner-page/about-us/1.png',
    image1Alt: 'About NEW WORLD IMPORTS',
    image2: '/images/inner-page/about-us/2.png',
    image2Alt: 'Global food distribution',
    eyebrow: 'About Us',
    heading: 'Bringing Quality Asian Foods to Western Canada Since 1986',
    body: 'NEW WORLD IMPORTS is a family-owned Asian food importer and distributor serving Western Canada since 1986. We specialize in sourcing high-quality products from trusted overseas brands, helping retailers and food businesses access authentic Asian foods with confidence. From traditional pantry staples to growing market favorites, we are committed to quality, reliability, and long-term customer relationships.',
    highlights: [
      { icon: '/assets/svg/3/delivery.svg', text: 'Serving Western Canada since 1986' },
      { icon: '/assets/svg/3/leaf.svg', text: 'Quality products from trusted overseas brands' },
      { icon: '/assets/svg/3/delivery.svg', text: 'Authentic Asian foods for retail and food service' },
      { icon: '/assets/svg/3/leaf.svg', text: 'Built on reliability, value, and long-term partnerships' },
    ],
  },
  stats: {
    eyebrow: 'What We Do',
    heading: 'A Trusted Partner in Asian Food Distribution',
    items: [
      { icon: '/assets/svg/3/work.svg', value: '40+', label: 'Years in Business', text: 'Since 1986, we have built our business on dependable service, product consistency, and long-term relationships with customers across Western Canada.' },
      { icon: '/assets/svg/3/buy.svg', value: '600+', label: 'Quality Products', text: 'Our product range includes carefully selected Asian foods from Thailand, China, and Vietnam, covering pantry staples, cooking essentials, snacks, noodles, drinks, and more.' },
      { icon: '/assets/svg/3/user.svg', value: '200+', label: 'Regular Customers', text: 'We proudly support a growing network of grocery stores, retailers, and food businesses that rely on us for trusted products and responsive service.' },
    ],
  },
  brands: {
    eyebrow: 'Only the Best Brands',
    heading: 'We source only tried-and-true overseas suppliers',
    body: 'Quality can become an issue when food is mass produced. That’s why we source goods only from proven overseas suppliers—those with decades of experience, strict quality control, and products we’ve come to trust and love. We prioritize consistency, reliability, and long-term value for our customers.',
    items: [
      { image: '/images/inner-page/user/1.png', alt: 'AROY-D', name: 'AROY-D', subtitle: 'Coconut & pantry staples', description: 'Known for consistent taste and dependable quality—ideal for curries, desserts, beverages, and high-turnover kitchens.' },
      { image: '/images/inner-page/user/2.png', alt: 'Cock Brand', name: 'Cock Brand', subtitle: 'Kitchen essentials', description: 'Everyday sauces and cooking ingredients selected for batch consistency and ease of use across retail and foodservice.' },
      { image: '/images/inner-page/user/3.png', alt: "Yeo's", name: "Yeo's", subtitle: 'Drinks & ready-to-enjoy favorites', description: 'Channel-friendly bestsellers that are easy to merchandise and fast to move—great for convenience and grocery.' },
      { image: '/images/inner-page/user/4.png', alt: 'Mae Ploy', name: 'Mae Ploy', subtitle: 'Curry pastes & cooking sauces', description: 'Bold, authentic flavor bases with strong repeat demand—trusted for both restaurant prep and home cooking.' },
      { image: '/images/inner-page/user/5.png', alt: 'Maesri', name: 'Maesri', subtitle: 'Convenient curry & flavor sauces', description: 'Retail-friendly sizes and quick-cook solutions that help customers recreate authentic flavors with confidence.' },
      { image: '/images/inner-page/user/6.png', alt: 'Pantai', name: 'Pantai', subtitle: 'Thai seasoning staples', description: 'Versatile cooking sauces and condiments chosen for balanced flavor and dependable performance across many dishes.' },
      { image: '/images/inner-page/user/7.png', alt: 'Lucky', name: 'Lucky', subtitle: 'Fish sauce & fermented flavors', description: 'A pantry essential for umami and depth—great for soups, stir-fries, marinades, and dipping sauces.' },
      { image: '/images/inner-page/user/8.png', alt: 'Healthy Boy Brand', name: 'Healthy Boy Brand', subtitle: 'Soy sauce & everyday cooking', description: 'Reliable flavor and broad versatility for stir-fries, dipping, marinades, and meal prep—ideal for steady weekly turns.' },
      { image: '/images/inner-page/user/9.png', alt: 'Twin Elephants', name: 'Twin Elephants', subtitle: 'Traditional flavors, consistent quality', description: 'Selected for strict QC and recipe consistency—an everyday choice for customers who value dependable, authentic taste.' },
    ],
  },
  reviews: {
    eyebrow: 'Why Customers Choose Us',
    heading: 'What sets NEW WORLD IMPORTS apart',
    items: [
      { image: 'images/inner-page/user/1.jpg', title: 'Trusted Experience', quote: '"With decades of industry experience, we understand the importance of consistency, product quality, and dependable service."', profileTitle: 'Since 1986', profileSubtitle: 'Long-Term Market Experience' },
      { image: 'images/inner-page/user/2.jpg', title: 'Reliable Sourcing', quote: '"We work with reputable overseas brands to help ensure the products we supply meet the standards our customers expect."', profileTitle: 'Trusted Products', profileSubtitle: 'Quality-Focused Supply' },
      { image: 'images/inner-page/user/3.jpg', title: 'Regional Market Understanding', quote: '"We serve customers across Western Canada and understand the needs of both traditional global food buyers and growing mainstream demand."', profileTitle: 'Western Canada', profileSubtitle: 'Local Market Focus' },
      { image: 'images/inner-page/user/4.jpg', title: 'Long-Term Relationships', quote: '"Our business is built on lasting partnerships with retailers, grocers, and food businesses who value trust, consistency, and stability."', profileTitle: 'Partnership Driven', profileSubtitle: 'Customer-First Approach' },
      { image: 'images/inner-page/user/5.jpg', title: 'Product Variety', quote: '"From pantry staples to new market favorites, we continue expanding our range to support changing customer needs and preferences."', profileTitle: 'Wide Selection', profileSubtitle: 'Everyday & Specialty Products' },
      { image: 'images/inner-page/user/6.jpg', title: 'Customer-Focused Service', quote: '"We believe responsive service, clear communication, and reliable supply are just as important as the products themselves."', profileTitle: 'Responsive Support', profileSubtitle: 'Service You Can Count On' },
      { image: 'images/inner-page/user/7.jpg', title: 'Quality Commitment', quote: '"We place strong emphasis on sourcing products that balance authenticity, quality, and suitability for today’s market."', profileTitle: 'Authentic Global Foods', profileSubtitle: 'Selected with Care' },
      { image: 'images/inner-page/user/8.jpg', title: 'Family-Owned Values', quote: '"As a family-owned business, we value reputation, long-term trust, and doing business the right way for customers and partners alike."', profileTitle: 'Family-Owned Business', profileSubtitle: 'Built on Trust' },
    ],
  },
};

const ABOUT_FALLBACK_ZH: AboutPageDisplay = {
  seoTitle: '关于我们',
  breadcrumb: { title: '关于我们', activeLabel: '关于我们', homeHref: '/' },
  intro: {
    image1: '/images/inner-page/about-us/1.png',
    image1Alt: 'About NEW WORLD IMPORTS',
    image2: '/images/inner-page/about-us/2.png',
    image2Alt: 'Asian food distribution',
    eyebrow: '关于我们',
    heading: '自1986年以来，将优质亚洲食品带到加拿大西部',
    body: 'NEW WORLD IMPORTS 是一家自1986年以来服务于加拿大西部的家族企业亚洲食品进口和分销商。我们专注于从值得信赖的海外品牌采购高品质产品，帮助零售商和食品企业自信地获取正宗的亚洲食品。从传统主食到日益增长的市场宠儿，我们致力于质量、可靠性和长期客户关系。',
    highlights: [
      { icon: '/assets/svg/3/delivery.svg', text: '自1986年以来，服务于加拿大西部' },
      { icon: '/assets/svg/3/leaf.svg', text: '来自值得信赖的海外品牌的优质产品' },
      { icon: '/assets/svg/3/delivery.svg', text: '正宗的亚洲食品，适用于零售和食品服务' },
      { icon: '/assets/svg/3/leaf.svg', text: '建立在可靠性、价值和长期合作伙伴关系之上' },
    ],
  },
  stats: {
    eyebrow: '我们的使命',
    heading: '一个值得信赖的亚洲食品分销商',
    items: [
      { icon: '/assets/svg/3/work.svg', value: '40+', label: '年', text: '自1986年以来，我们一直在可靠的服务、产品一致性和与加拿大西部客户的长期关系的基础上建立我们的业务。' },
      { icon: '/assets/svg/3/buy.svg', value: '600+', label: '优质产品', text: '我们的产品系列包括精心挑选的来自泰国、中国和越南的亚洲食品，涵盖食品储藏室主食、烹饪必需品、零食、面条、饮料等等。' },
      { icon: '/assets/svg/3/user.svg', value: '200+', label: '长期客户', text: '我们自豪地支持一个不断增长的超市、零售商和食品企业网络，他们依赖我们提供可信赖的产品和响应服务。' },
    ],
  },
  brands: {
    eyebrow: 'Only the Best Brands',
    heading: '只选择值得信赖的海外品牌',
    body: '大规模生产往往会带来品质波动。我们只与久经考验的海外供应商合作——拥有数十年经验、执行严格品质管控（QC），并且其产品早已成为我们信任与喜爱的选择。我们把“稳定、可靠、可追溯”放在第一位，为客户持续提供放心的优质品牌。',
    items: [
      { image: '/images/inner-page/user/1.png', alt: 'AROY-D', name: 'AROY-D', subtitle: '椰浆与罐头精选', description: '以稳定口感与一致品质著称，适合咖喱、甜品、饮品等多场景应用，帮助门店快速输出标准化风味。' },
      { image: '/images/inner-page/user/2.png', alt: 'Cock Brand', name: 'Cock Brand', subtitle: '厨房基础调味', description: '覆盖常用酱料与烹饪配料，强调批次稳定与易用性，适配零售与餐饮后厨的高频需求。' },
      { image: '/images/inner-page/user/3.png', alt: "Yeo's", name: "Yeo's", subtitle: '饮品与即食经典', description: '以易陈列、易售卖的畅销单品见长，适合便利店与商超渠道，满足快速消费与家庭囤货需求。' },
      { image: '/images/inner-page/user/4.png', alt: 'Mae Ploy', name: 'Mae Ploy', subtitle: '咖喱与烹饪酱料', description: '专注东南亚风味底料与调味，香气层次鲜明、复购率高，适合餐饮出品与家庭烹饪。' },
      { image: '/images/inner-page/user/5.png', alt: 'Maesri', name: 'Maesri', subtitle: '风味酱与咖喱膏', description: '以小包装与便捷烹饪著称，适合零售陈列与试吃推广，让消费者更轻松复刻地道风味。' },
      { image: '/images/inner-page/user/6.png', alt: 'Pantai', name: 'Pantai', subtitle: '泰式经典调味', description: '覆盖多种常用调味与料理酱，强调稳定咸甜平衡与适配性，适用于餐饮与家庭多种菜系。' },
      { image: '/images/inner-page/user/7.png', alt: 'Lucky', name: 'Lucky', subtitle: '鱼露与发酵调味', description: '为汤底、蘸料与炒菜提供鲜味支撑，适合高频使用场景；我们优先选择口碑稳定的成熟供应商。' },
      { image: '/images/inner-page/user/8.png', alt: 'Healthy Boy Brand', name: 'Healthy Boy Brand', subtitle: '酱油与料理基础', description: '以稳定风味与多用途著称，适配炒、拌、腌、蘸等多种用法，满足零售与餐饮的日常周转。' },
      { image: '/images/inner-page/user/9.png', alt: 'Twin Elephants', name: 'Twin Elephants', subtitle: '传统风味与可靠品质', description: '坚持严格品控与配方一致性，为追求地道口味的客户提供可靠选择，适合做长期稳定的主力单品。' },
    ],
  },
  reviews: {
    eyebrow: '为什么客户选择我们',
    heading: '是什么让NEW WORLD IMPORTS与众不同',
    items: [
      { image: 'images/inner-page/user/1.jpg', title: '可信赖的经验', quote: '"凭借数十年的行业经验，我们了解一致性、产品质量和可靠服务的重要性。"', profileTitle: '自1986年以来', profileSubtitle: '长期市场经验' },
      { image: 'images/inner-page/user/2.jpg', title: '可靠采购', quote: '"我们与值得信赖的海外品牌合作，帮助确保我们供应的产品符合客户期望的标准。"', profileTitle: '可信赖产品', profileSubtitle: '质量优先供应' },
      { image: 'images/inner-page/user/3.jpg', title: '区域市场理解', quote: '"我们服务于加拿大西部的客户，了解传统亚洲食品买家和不断增长的主流需求的需求。"', profileTitle: '加拿大西部', profileSubtitle: '本地市场重点' },
      { image: 'images/inner-page/user/4.jpg', title: '长期关系', quote: '"我们的业务建立在与重视信任、一致性和稳定性的零售商、杂货商和食品企业建立的长期合作关系之上。"', profileTitle: '合作伙伴驱动', profileSubtitle: '客户优先方法' },
      { image: 'images/inner-page/user/5.jpg', title: '产品多样性', quote: '"从食品储藏室主食到新市场最爱，我们继续扩展我们的产品范围，以支持不断变化的客户需求和偏好。"', profileTitle: '广泛选择', profileSubtitle: '日常 & 特色产品' },
      { image: 'images/inner-page/user/6.jpg', title: '客户优先服务', quote: '"我们相信响应式服务、清晰沟通和可靠供应与产品本身同样重要。"', profileTitle: '响应式支持', profileSubtitle: '您可以信赖的服务' },
      { image: 'images/inner-page/user/7.jpg', title: '质量承诺', quote: '"我们高度重视采购产品，这些产品平衡了真实性、质量和适合当今市场的适用性。"', profileTitle: '正宗亚洲食品', profileSubtitle: '精心挑选' },
      { image: 'images/inner-page/user/8.jpg', title: '家族拥有价值观', quote: '"作为家族拥有企业，我们重视声誉、长期信任和为客户和合作伙伴做正确的事情。"', profileTitle: '家族拥有企业', profileSubtitle: '建立在信任之上' },
    ],
  },
};

export function getAboutFallback(locale: string): AboutPageDisplay {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? ABOUT_FALLBACK_ZH : ABOUT_FALLBACK_EN;
}

/**
 * 根据内置 fallback 生成可上传 CDN 的完整 page.metadata（开发/导入用）
 */
export function buildAboutPageMetadataForCdn(): Record<string, unknown> {
  const en = ABOUT_FALLBACK_EN;
  const zh = ABOUT_FALLBACK_ZH;

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
      image_1: en.intro.image1,
      image_1_alt: en.intro.image1Alt,
      image_2: en.intro.image2,
      image_2_alt: en.intro.image2Alt,
      translations: [
        {
          language_code: 'en',
          is_primary: true,
          label: en.intro.eyebrow,
          title: en.intro.heading,
          text: en.intro.body,
        },
        {
          language_code: 'zh',
          label: zh.intro.eyebrow,
          title: zh.intro.heading,
          text: zh.intro.body,
        },
      ],
      highlights: en.intro.highlights.map((item, i) => ({
        icon: item.icon,
        translations: [
          { language_code: 'en', is_primary: true, title: item.text },
          { language_code: 'zh', title: zh.intro.highlights[i]?.text ?? item.text },
        ],
      })),
    },
    stats_section: {
      translations: [
        {
          language_code: 'en',
          is_primary: true,
          label: en.stats.eyebrow,
          title: en.stats.heading,
        },
        {
          language_code: 'zh',
          label: zh.stats.eyebrow,
          title: zh.stats.heading,
        },
      ],
      items: en.stats.items.map((item, i) => ({
        icon: item.icon,
        value: item.value,
        translations: [
          { language_code: 'en', is_primary: true, label: item.label, text: item.text },
          {
            language_code: 'zh',
            label: zh.stats.items[i]?.label ?? item.label,
            text: zh.stats.items[i]?.text ?? item.text,
          },
        ],
      })),
    },
    brands_section: {
      translations: [
        {
          language_code: 'en',
          is_primary: true,
          label: en.brands.eyebrow,
          title: en.brands.heading,
          text: en.brands.body,
        },
        {
          language_code: 'zh',
          label: zh.brands.eyebrow,
          title: zh.brands.heading,
          text: zh.brands.body,
        },
      ],
      items: en.brands.items.map((item, i) => {
        const z = zh.brands.items[i];
        return {
          image: item.image,
          alt: item.alt,
          name: item.name,
          translations: [
            {
              language_code: 'en',
              is_primary: true,
              label: item.subtitle,
              text: item.description,
            },
            {
              language_code: 'zh',
              label: z?.subtitle ?? item.subtitle,
              text: z?.description ?? item.description,
            },
          ],
        };
      }),
    },
    reviews_section: {
      translations: [
        {
          language_code: 'en',
          is_primary: true,
          label: en.reviews.eyebrow,
          title: en.reviews.heading,
        },
        {
          language_code: 'zh',
          label: zh.reviews.eyebrow,
          title: zh.reviews.heading,
        },
      ],
      items: en.reviews.items.map((item, i) => {
        const z = zh.reviews.items[i];
        return {
          image: item.image,
          translations: [
            {
              language_code: 'en',
              is_primary: true,
              title: item.title,
              text: item.quote,
              label: item.profileTitle,
              subtitle: item.profileSubtitle,
            },
            {
              language_code: 'zh',
              title: z?.title ?? item.title,
              text: z?.quote ?? item.quote,
              label: z?.profileTitle ?? item.profileTitle,
              subtitle: z?.profileSubtitle ?? item.profileSubtitle,
            },
          ],
        };
      }),
    },
  };
}

