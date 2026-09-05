/**
 * Contact 页面 fallback 与 CDN metadata 生成（无 Astro 依赖）
 */

export interface ContactInfoItemDisplay {
  iconClass: string;
  label: string;
  valueHtml: string;
}

/** 用于 `<input type>`；textarea 走 `isTextarea` 分支 */
export type ContactHtmlInputType = 'text' | 'email' | 'tel';

export interface ContactFormFieldDisplay {
  fieldId: string;
  inputType: ContactHtmlInputType | 'textarea';
  colClass: string;
  label: string;
  placeholder: string;
  iconClass: string;
  maxLength?: number;
  isTextarea?: boolean;
  textareaRows?: number;
}

export interface ContactPageDisplay {
  seoTitle: string;
  breadcrumb: { title: string; activeLabel: string; homeHref: string };
  image: string;
  imageAlt: string;
  sidebarTitle: string;
  formMobileTitle: string;
  infoItems: ContactInfoItemDisplay[];
  formFields: ContactFormFieldDisplay[];
  formSubmitText: string;
  mapIframeSrc: string;
}

const MAP_IFRAME_SRC =
  'https://www.google.com/maps?q=578%20East%20Kent%20Ave%20S%2C%20Vancouver%20BC%20V5X%204V6&output=embed';

const CONTACT_FALLBACK_EN: ContactPageDisplay = {
  seoTitle: 'Contact Us',
  breadcrumb: { title: 'Contact Us', activeLabel: 'Contact Us', homeHref: '/' },
  image: '/assets/images/inner-page/contact-us.png',
  imageAlt: 'Contact NEW WORLD IMPORTS',
  sidebarTitle: 'Get In Touch',
  formMobileTitle: 'Contact Us',
  infoItems: [
    {
      iconClass: 'fa-solid fa-phone',
      label: 'Phone',
      valueHtml: '(+1) 604-270-0036',
    },
    {
      iconClass: 'fa-solid fa-envelope',
      label: 'Email',
      valueHtml: 'nwimports.newworld@gmail.com',
    },
    {
      iconClass: 'fa-solid fa-location-dot',
      label: 'Address',
      valueHtml: '578 East Kent Ave S<br>Vancouver BC V5X 4V6',
    },
    {
      iconClass: 'fa-solid fa-building',
      label: 'Business Hours',
      valueHtml: 'Weekdays 8:30am to 5:00pm',
    },
  ],
  formFields: [
    {
      fieldId: 'contactFirstName',
      inputType: 'text',
      colClass: 'col-xxl-6 col-lg-12 col-sm-6',
      label: 'First Name',
      placeholder: 'Enter First Name',
      iconClass: 'fa-solid fa-user',
    },
    {
      fieldId: 'contactLastName',
      inputType: 'text',
      colClass: 'col-xxl-6 col-lg-12 col-sm-6',
      label: 'Last Name',
      placeholder: 'Enter Last Name',
      iconClass: 'fa-solid fa-user',
    },
    {
      fieldId: 'contactEmail',
      inputType: 'email',
      colClass: 'col-xxl-6 col-lg-12 col-sm-6',
      label: 'Email Address',
      placeholder: 'Enter Email Address',
      iconClass: 'fa-solid fa-envelope',
    },
    {
      fieldId: 'contactPhone',
      inputType: 'tel',
      colClass: 'col-xxl-6 col-lg-12 col-sm-6',
      label: 'Phone Number',
      placeholder: 'Enter Your Phone Number',
      iconClass: 'fa-solid fa-mobile-screen-button',
      maxLength: 10,
    },
    {
      fieldId: 'contactMessage',
      inputType: 'textarea',
      colClass: 'col-12',
      label: 'Message',
      placeholder: 'Enter Your Message',
      iconClass: 'fa-solid fa-message',
      isTextarea: true,
      textareaRows: 6,
    },
  ],
  formSubmitText: 'Send Message',
  mapIframeSrc: MAP_IFRAME_SRC,
};

const CONTACT_FALLBACK_ZH: ContactPageDisplay = {
  seoTitle: '联系我们',
  breadcrumb: { title: '联系我们', activeLabel: '联系我们', homeHref: '/' },
  image: '/assets/images/inner-page/contact-us.png',
  imageAlt: '联系 NEW WORLD IMPORTS',
  sidebarTitle: '联系我们',
  formMobileTitle: '联系我们',
  infoItems: [
    {
      iconClass: 'fa-solid fa-phone',
      label: '电话',
      valueHtml: '(+1) 604-270-0036',
    },
    {
      iconClass: 'fa-solid fa-envelope',
      label: '邮箱',
      valueHtml: 'nwimports.newworld@gmail.com',
    },
    {
      iconClass: 'fa-solid fa-location-dot',
      label: '地址',
      valueHtml: '578 东肯特大道 S<br>温哥华 BC V5X 4V6',
    },
    {
      iconClass: 'fa-solid fa-building',
      label: '营业时间',
      valueHtml: '每周一至周五 8:30am to 5:00pm',
    },
  ],
  formFields: [
    {
      fieldId: 'contactFirstName',
      inputType: 'text',
      colClass: 'col-xxl-6 col-lg-12 col-sm-6',
      label: '姓名',
      placeholder: '输入您的姓名',
      iconClass: 'fa-solid fa-user',
    },
    {
      fieldId: 'contactLastName',
      inputType: 'text',
      colClass: 'col-xxl-6 col-lg-12 col-sm-6',
      label: '姓氏',
      placeholder: '输入您的姓氏',
      iconClass: 'fa-solid fa-user',
    },
    {
      fieldId: 'contactEmail',
      inputType: 'email',
      colClass: 'col-xxl-6 col-lg-12 col-sm-6',
      label: '邮箱',
      placeholder: '输入您的邮箱地址',
      iconClass: 'fa-solid fa-envelope',
    },
    {
      fieldId: 'contactPhone',
      inputType: 'tel',
      colClass: 'col-xxl-6 col-lg-12 col-sm-6',
      label: '电话',
      placeholder: '输入您的电话号码',
      iconClass: 'fa-solid fa-mobile-screen-button',
      maxLength: 10,
    },
    {
      fieldId: 'contactMessage',
      inputType: 'textarea',
      colClass: 'col-12',
      label: '留言',
      placeholder: '输入您的留言',
      iconClass: 'fa-solid fa-message',
      isTextarea: true,
      textareaRows: 6,
    },
  ],
  formSubmitText: '发送留言',
  mapIframeSrc: MAP_IFRAME_SRC,
};

export function getContactFallback(locale: string): ContactPageDisplay {
  const lang = String(locale).split('-')[0].toLowerCase();
  return lang === 'zh' ? CONTACT_FALLBACK_ZH : CONTACT_FALLBACK_EN;
}

export function buildContactPageMetadataForCdn(): Record<string, unknown> {
  const en = CONTACT_FALLBACK_EN;
  const zh = CONTACT_FALLBACK_ZH;

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
    contact_section: {
      image: en.image,
      image_alt: en.imageAlt,
      translations: [
        {
          language_code: 'en',
          is_primary: true,
          title: en.sidebarTitle,
          label: en.formMobileTitle,
        },
        {
          language_code: 'zh',
          title: zh.sidebarTitle,
          label: zh.formMobileTitle,
        },
      ],
      info_items: en.infoItems.map((item, i) => {
        const z = zh.infoItems[i];
        return {
          icon: item.iconClass,
          translations: [
            {
              language_code: 'en',
              is_primary: true,
              label: item.label,
              text: item.valueHtml,
            },
            {
              language_code: 'zh',
              label: z?.label ?? item.label,
              text: z?.valueHtml ?? item.valueHtml,
            },
          ],
        };
      }),
      form_fields: en.formFields.map((field, i) => {
        const z = zh.formFields[i];
        return {
          field_id: field.fieldId,
          input_type: field.inputType,
          col_class: field.colClass,
          maxlength: field.maxLength ?? null,
          is_textarea: Boolean(field.isTextarea),
          textarea_rows: field.textareaRows ?? null,
          icon: field.iconClass,
          translations: [
            {
              language_code: 'en',
              is_primary: true,
              label: field.label,
              text: field.placeholder,
            },
            {
              language_code: 'zh',
              label: z?.label ?? field.label,
              text: z?.placeholder ?? field.placeholder,
            },
          ],
        };
      }),
      form_submit: {
        translations: [
          { language_code: 'en', is_primary: true, title: en.formSubmitText },
          { language_code: 'zh', title: zh.formSubmitText },
        ],
      },
    },
    map_section: {
      iframe_src: en.mapIframeSrc,
    },
  };
}
