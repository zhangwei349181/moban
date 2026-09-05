/**
 * 页面 Section 组件注册表（components_code → Astro 组件）
 */
import Post from '../components/sections/post.astro';
import PostChild from '../components/sections/postchild.astro';
import PostList from '../components/sections/postlist.astro';
import PageHeader from '../components/sections/pageheader.astro';
import Markdown from '../components/sections/markdown.astro';
import ListFilter from '../components/sections/listfilter.astro';
import PostSingle from '../components/sections/postsingle.astro';
import ProductSingle from '../components/sections/productsingle.astro';
import Form from '../components/sections/form.astro';
import Login from '../components/sections/login.astro';
import Signup from '../components/sections/signup.astro';
import VerifyEmail from '../components/sections/verifyemail.astro';
import Cart from '../components/sections/cart.astro';
import Wishlist from '../components/sections/wishlist.astro';
import Checkout from '../components/sections/checkout.astro';
import SubscriptionCheckout from '../components/sections/subscriptionCheckout.astro';
import Pricing from '../components/sections/pricing.astro';
import Dashboard from '../components/sections/dashboard.astro';
import DashboardPanel from '../components/sections/dashboardPanel.astro';
import ComponentsHtmlSection from '../components/sections/_ComponentsHtmlSection.astro';
import HeaderHtmlSection from '../components/sections/headerhtml.astro';
import FooterHtmlSection from '../components/sections/footerhtml.astro';
import { isCmsHtmlStaticSlotCode } from './cmsComponentHtml';
import { resolveChromeShellKind } from './chromeComponentCode';
import { isPostComponentType, isPostSectionCode } from './postComponentCode';
import { isPostChildComponentType, isPostChildSectionCode } from './postChildComponentCode';
import { isPostListComponentType, isPostListSectionCode } from './postListComponentCode';
import { isPageHeaderComponentType, isPageHeaderSectionCode } from './pageHeaderComponentCode';
import { isMarkdownComponentType, isMarkdownSectionCode } from './markdownComponentCode';
import { isListFilterComponentType, isListFilterSectionCode } from './listFilterComponentCode';
import { isPostSingleComponentType, isPostSingleSectionCode } from './postSingleComponentCode';
import { isProductSingleComponentType, isProductSingleSectionCode } from './productSingleComponentCode';
import { isFormComponentType, isFormSectionCode } from './formComponentCode';
import { isLoginComponentType, isLoginSectionCode } from './loginComponentCode';
import { isSignupComponentType, isSignupSectionCode } from './signupComponentCode';
import { isVerifyEmailComponentType, isVerifyEmailSectionCode } from './verifyEmailComponentCode';
import { isCartComponentType, isCartSectionCode } from './cartComponentCode';
import { isWishlistComponentType, isWishlistSectionCode } from './wishlistComponentCode';
import { isCheckoutComponentType, isCheckoutSectionCode } from './checkoutComponentCode';
import {
  isSubscriptionCheckoutComponentType,
  isSubscriptionCheckoutSectionCode,
} from './subscriptionCheckoutComponentCode';
import { isPricingComponentType, isPricingSectionCode } from './pricingComponentCode';
import {
  isDashboardComponentType,
  isDashboardPanelComponentType,
  isDashboardPanelSectionCode,
  isDashboardSectionCode,
} from './dashboardComponentCode';

export type SectionComponent = typeof Post;

const SECTION_BY_CODE: Record<string, SectionComponent> = {
  post: Post,
  blog: Post,
  postchild: PostChild,
  postlist: PostList,
  bloglist: PostList,
  pageheader: PageHeader,
  markdown: Markdown,
  listfilter: ListFilter,
  postsingle: PostSingle,
  blogsingle: PostSingle,
  productsingle: ProductSingle,
  shopsingle: ProductSingle,
  form: Form,
  contactform: Form,
  dynamicform: Form,
  login: Login,
  loginform: Login,
  authlogin: Login,
  signup: Signup,
  signupform: Signup,
  authsignup: Signup,
  verifyemail: VerifyEmail,
  emailverify: VerifyEmail,
  verifymail: VerifyEmail,
  cart: Cart,
  shopcart: Cart,
  shoppingcart: Cart,
  wishlist: Wishlist,
  wishlistpage: Wishlist,
  checkout: Checkout,
  checkoutpage: Checkout,
  subscriptioncheckout: SubscriptionCheckout,
  subscriptioncheckoutpage: SubscriptionCheckout,
  pricing: Pricing,
  subscriptionpricing: Pricing,
  dashboard: Dashboard,
  userdashboard: Dashboard,
  accountdashboard: Dashboard,
  dashboardnav: DashboardPanel,
  dashboardprofile: DashboardPanel,
  dashboardeditprofile: DashboardPanel,
  dashboardaddresses: DashboardPanel,
  dashboardpassword: DashboardPanel,
  dashboardorders: DashboardPanel,
  dashboardsubscriptionorders: DashboardPanel,
  dashboardpayments: DashboardPanel,
  dashboardsubscriptionpayments: DashboardPanel,
  dashboardlogout: DashboardPanel,
};

export function getSectionComponent(code: string, type?: string | null): SectionComponent | undefined {
  const t = String(type ?? '').trim().toLowerCase();
  if (t === 'static') return ComponentsHtmlSection;
  if (t === 'header') return HeaderHtmlSection;
  if (t === 'footer') return FooterHtmlSection;
  if (t === 'chrome') return ComponentsHtmlSection;
  if (isPostChildComponentType(t)) return PostChild;
  if (isPostComponentType(t)) return Post;
  if (isPostListComponentType(t)) return PostList;
  if (isListFilterComponentType(t)) return ListFilter;
  if (isPageHeaderComponentType(t)) return PageHeader;
  if (isMarkdownComponentType(t)) return Markdown;
  if (isPostSingleComponentType(t)) return PostSingle;
  if (isProductSingleComponentType(t)) return ProductSingle;
  if (isFormComponentType(t)) return Form;
  if (isLoginComponentType(t)) return Login;
  if (isSignupComponentType(t)) return Signup;
  if (isVerifyEmailComponentType(t)) return VerifyEmail;
  if (isCartComponentType(t)) return Cart;
  if (isWishlistComponentType(t)) return Wishlist;
  if (isCheckoutComponentType(t)) return Checkout;
  if (isSubscriptionCheckoutComponentType(t)) return SubscriptionCheckout;
  if (isPricingComponentType(t)) return Pricing;
  if (isDashboardComponentType(t)) return Dashboard;
  if (isDashboardPanelComponentType(t)) return DashboardPanel;

  const shellKind = resolveChromeShellKind(code, type);
  if (shellKind === 'header') return HeaderHtmlSection;
  if (shellKind === 'footer') return FooterHtmlSection;
  const section = SECTION_BY_CODE[code];
  if (section) return section;
  if (isPostChildSectionCode(code)) return PostChild;
  if (isPostSectionCode(code)) return Post;
  if (isPostListSectionCode(code)) return PostList;
  if (isPageHeaderSectionCode(code)) return PageHeader;
  if (isMarkdownSectionCode(code)) return Markdown;
  if (isListFilterSectionCode(code)) return ListFilter;
  if (isPostSingleSectionCode(code)) return PostSingle;
  if (isProductSingleSectionCode(code)) return ProductSingle;
  if (isFormSectionCode(code)) return Form;
  if (isLoginSectionCode(code)) return Login;
  if (isSignupSectionCode(code)) return Signup;
  if (isVerifyEmailSectionCode(code)) return VerifyEmail;
  if (isCartSectionCode(code)) return Cart;
  if (isWishlistSectionCode(code)) return Wishlist;
  if (isCheckoutSectionCode(code)) return Checkout;
  if (isSubscriptionCheckoutSectionCode(code)) return SubscriptionCheckout;
  if (isDashboardSectionCode(code)) return Dashboard;
  if (isDashboardPanelSectionCode(code)) return DashboardPanel;
  if (isPricingSectionCode(code)) return Pricing;
  if (isCmsHtmlStaticSlotCode(code)) return ComponentsHtmlSection;
  return undefined;
}

export function getRegisteredSectionCodes(): string[] {
  return Object.keys(SECTION_BY_CODE);
}
