# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro 6 static website with Vue 3 islands for Purpeon Digital IT consulting. Bilingual (Norwegian default, English). Single-page: all sections render on one dynamic route.

## Tech Stack

- **Framework**: Astro 6 (`output: 'static'`)
- **UI**: Vue 3 with `<script setup lang="ts">`, hydrated as islands
- **Package manager**: Bun — always use `bun` (not npm/yarn/pnpm)
- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite`; custom CSS for gradients/SVG animations only
- **Testing**: Vitest + Vue Test Utils + jsdom
- **i18n**: Astro native routing + custom `useI18n()` composable for client reactivity

## Commands

```bash
bun dev                          # Dev server on http://localhost:4321
bun run build                    # Static build to ./dist
bun preview                      # Preview the built site
bun run test                     # Vitest watch mode (bare `bun test` invokes Bun's built-in runner — don't use it)
bun test:run                     # Single-pass run (CI)
bun test:coverage                # With coverage
bun test:run path/to/file.spec.ts         # Run one test file
bun test:run -t "pattern"                 # Filter by test name
```

## Architecture

### Routing & i18n (two-layer system)

1. **Astro layer** (`astro.config.mjs` + `src/pages/[...lang].astro`): defines locales `['en', 'no']` with `defaultLocale: 'no'` and `prefixDefaultLocale: false`. `getStaticPaths()` emits `/` (Norwegian) and `/en/` (English). The `locale` value is passed as a prop into every Vue island.
2. **Vue layer** (`src/composables/useI18n.ts`): a single module-level `ref` holds `currentLocale`, shared across all components. Components call `useI18n(initialLocale)` passing the SSR prop so client hydration matches server output without flicker. `setLocale()` also redirects the page to the matching route.
3. **Translations**: `src/i18n/{en,no}.json`. `t('a.b.c')` is typed via `PathValue<TranslationSchema, K>` — adding new keys requires they exist in both files to satisfy the type.

### SSR → client hydration handoff

`Layout.astro` emits an inline `<script is:inline>` that sets `window.__INITIAL_LOCALE__` and `window.__INITIAL_THEME__` before any Vue island loads. This is the source of truth that `useI18n()` and `ThemeToggle.vue` read on mount. The script also writes `data-theme` onto `<html>` in the head before the body parses, so themed CSS variables apply on first paint with no FOUC.

### Styling layers

- `src/styles/app.css` is the single Tailwind entry — `@theme` tokens, `@variant dark`/`@variant light` mapped to `[data-theme]`, `@utility` definitions (including `section-viewport` and `section-grid`), base styles, and CSS custom properties.
- `src/styles/streaks.css` — per-section decorative gradient backgrounds.
- `src/styles/animations.css` — shared keyframes.
- Use Tailwind utilities in templates. Only drop to scoped `<style>` in components for things Tailwind can't express (complex gradients, SVG `d:` path morphing, filter presets, pseudo-elements).
- Breakpoints: `sm` 480px, `md` 768px, `lg` 1200px, `xl` 1400px.

### Testing

- Specs live in `src/components/__tests__/*.spec.ts`; global setup is `src/test/setup.ts`.
- Setup mocks `IntersectionObserver` to fire immediately (scroll-triggered animations run synchronously in tests). Add new globals there, not in individual specs.
- `__INITIAL_LOCALE__`/`__INITIAL_THEME__` are pre-set on `window` in the setup file; tests can mutate them.

### Icons

Icons are bundled at build time via `unplugin-icons` (configured in **both** `astro.config.mjs` and `vitest.config.ts` — keep in sync). Import per-icon Vue components: `import IconCloud from '~icons/fa7-solid/cloud'`. For data-driven icon names from i18n JSON, see the `ICONS` lookup map in `src/components/Features.vue` — adding a new icon there requires importing it and adding to the map. Available collections: `fa7-solid`, `fa6-solid`, `circle-flags` (`@iconify-json/*` devDependencies). Zero runtime requests to `api.iconify.design`.

### Deployment

Static output to `./dist`. GitHub Actions workflow at `.github/workflows/deploy.yml`. Custom domain via `CNAME` file. `@astrojs/sitemap` generates per-locale sitemaps matching the Astro i18n config.

## Path Aliases

`@/*` → `src/*`, configured in both `tsconfig.json` and `vitest.config.ts`. Keep them in sync.
