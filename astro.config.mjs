// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  vite: {
    optimizeDeps: {
      // marked v18 ESM 与 Vite 预构建不兼容
      exclude: ['marked'],
    },
    ssr: {
      optimizeDeps: {
        // 不预构建 SSR 依赖，避免 deps_ssr/chunk-*.js 缓存哈希失效（Vite 5.1+）
        noDiscovery: true,
        include: [],
        exclude: ['marked'],
      },
    },
  },
});