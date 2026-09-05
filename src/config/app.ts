/**
 * Workers for Platforms / Dispatch 父 Worker 在子请求上设置的租户 ID 请求头。
 * 子请求无此头时回退 `TENANT_ID` 或下方默认 UUID（见 middleware）。
 *
 * **Astro + @astrojs/cloudflare**：默认可预渲染的页面会在构建期生成静态 HTML；
 * 适配器对 `manifest.assets` 中的路径会直接 `ASSETS.fetch`，**不会执行 middleware**，
 * 构建时也没有本请求头。需要从请求头解析租户的页面必须 `export const prerender = false`
 *（参见 `src/pages/index.astro`）。纯动态子 Worker（如发布器空项目模板）无此限制。
 */
 export const GT6_TENANT_ID_HEADER = 'X-GT6-Tenant-Id';

 /** 与 middleware 一致，供服务端日志与客户端 console 共用 */
 export const GT6_TENANT_ID_FALLBACK_WARN = `[middleware] Missing or empty "${GT6_TENANT_ID_HEADER}", using TENANT_ID / default tenant`;
 
 const DEFAULT_TENANT_ID = 'c36a188f-9971-4304-8659-f8048451fb2c';
 
 /** 本地 / 构建时默认租户（无请求头或未走 middleware 时使用） */
 export function getFallbackTenantId(): string {
   return (import.meta.env.TENANT_ID as string | undefined)?.trim() || DEFAULT_TENANT_ID;
 }
 
 /**
  * 全局应用配置
  */
 export const APP_CONFIG = {
   /**
    * 无 Cookie / API 失败 / locals 未注入时的回退语言，建议与后台「默认语言」一致。
    * 可在 .env 中设置 PUBLIC_DEFAULT_LOCALE=en-US
    */
   defaultLocale: import.meta.env.PUBLIC_DEFAULT_LOCALE || 'en-US',
 
   /**
    * 默认 tenant_id（`TENANT_ID` 或内置 UUID）。
    * 生产子请求由 middleware 从 `X-GT6-Tenant-Id` 写入 `locals.tenantId`；
    * 此处供无请求上下文代码、客户端回退使用（与 `getFallbackTenantId()` 一致）。
    */
   tenantId: getFallbackTenantId(),
   
   // API 基础路径（用于 JSON 数据）
   apiBaseUrl: 'https://gt6json.shopasb.io',
   
   // API 基础路径（用于 API v1 接口）
   apiBaseUrl01: 'https://gt6api.goodsoftwarepro.com/api/v1',

   /** 邮箱验证码服务（OTP send/confirm） */
   emailApiBaseUrl: import.meta.env.PUBLIC_EMAIL_API_BASE || 'https://email.goodsoftwarepro.com/api/v1',
 
   /**
    * Sales 服务购物车等接口根路径（含 /api/v1）。
    * 未设置时与 apiBaseUrl01 相同；独立部署 Sales 时设置 PUBLIC_SALES_API_V1_BASE。
    */
   salesApiV1Base: import.meta.env.PUBLIC_SALES_API_V1_BASE || 'https://sales.goodsoftwarepro.com/api/v1',
   
   // API Key（从环境变量获取，如果没有则使用空字符串）
   key: import.meta.env.API_KEY || 'cmx349181!',
   
   // 获取语言列表的 API 路径
   getLanguagesUrl(tenantId: string): string {
     return `${this.apiBaseUrl}/tenant_${tenantId}/languages/languages-${tenantId}.json`;
   },
 
   /** 底部菜单 ID：一个菜单内 3 个一级项为三列标题，其下为二级链接（.env：PUBLIC_FOOTER_MENU_ID） */
   footerMenuId: import.meta.env.PUBLIC_FOOTER_MENU_ID || 'f94cbade-074a-4ff1-92d2-7ff6a5317da0',
   primaryNavMenuId: import.meta.env.PUBLIC_PRIMARY_NAV_MENU_ID || '8b620bca-edbc-465a-becc-a44259bef1b8',
 } as const;
 
 