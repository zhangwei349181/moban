/**
 * 获取 API 请求参数的工具函数
 * 仅用于获取当前语言代码和 tenant_id，实际 API 请求由开发者自行处理
 */

/**
 * 获取当前语言代码和 tenant_id（可选使用）
 * 在 Astro 组件中使用：const { locale, tenant_id } = getApiParams(Astro);
 */
export function getApiParams(astro?: any): { locale: string; tenant_id: string } {
  let locale = 'zh-CN';
  let tenant_id = '';
  
  if (import.meta.env.SSR) {
    // 服务端：从 Astro.locals 获取
    if (astro?.locals) {
      locale = astro.locals.locale || 'zh-CN';
      tenant_id = astro.locals.tenantId || '';
    }
  } else {
    // 客户端：从全局变量获取
    locale = (window as any).__ASTRO_LOCALE__ || 'zh-CN';
    tenant_id = (window as any).__ASTRO_TENANT_ID__ || '';
  }
  
  return { locale, tenant_id };
}

