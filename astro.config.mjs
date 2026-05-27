import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
  output: 'static',
  build: {
    // Inline all CSS into the HTML so the render-blocking external stylesheet
    // disappears. Trades ~10KB extra gzipped HTML for one fewer round-trip
    // on the critical path — Lighthouse mobile LCP improves significantly.
    inlineStylesheets: 'always'
  },
  vite: {
    plugins: [
      tailwindcss(),
      // Bundle iconify icons as Vue components at build time so the runtime
      // never hits api.iconify.design. Per-icon tree-shaking via virtual
      // imports like `import IconCloud from '~icons/fa7-solid/cloud'`.
      Icons({ compiler: 'vue3' })
    ]
  },
  integrations: [
    vue(),
    sitemap({
      i18n: {
        defaultLocale: 'no',
        locales: {
          no: 'no',
          en: 'en'
        }
      }
    })
  ],
  site: 'https://www.purpeon.com',
  i18n: {
    defaultLocale: 'no',
    locales: ['en', 'no'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});
