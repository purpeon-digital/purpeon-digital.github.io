<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import { registerFoxClick } from '@/composables/useFoxEasterEgg';
import Features from '@/components/Features.vue';
import SectionButton from '@/components/SectionButton.vue';
// Inlined rather than loaded through <img>: an SVG in an <img> only runs its animation
// when the image is decoded, so a cached 304 shows the finished mark. Inline, the
// keyframes are ordinary page CSS and restart on every page load.
import logoAnimated from '@/assets/logo-animated.svg?raw';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

function handleFoxClick(e: MouseEvent) {
  registerFoxClick(e.currentTarget as HTMLElement);
}

const features = computed(() => {
  // Track locale for reactivity
  const _ = locale.value;
  return t('hero.features');
});
</script>

<template>
  <section class="hero section-viewport streak-hero text-[var(--hero-text-color)] pt-28 px-8 pb-8 max-md:pt-20 max-md:px-6 max-sm:pt-[4.5rem] max-sm:px-4 max-sm:pb-8">
    <div class="hero-content section-grid gap-12 mt-auto mb-auto max-lg:gap-8 max-md:grid-cols-1 max-md:gap-6 max-sm:grid-cols-1 max-sm:gap-4">
      <div class="hero-text">
        <div class="hero-title-row flex items-start gap-4 max-md:mb-4 md:block">
          <div class="flex-1 min-w-0">
            <h1 class="section-title hero-heading mb-6 max-md:mb-0 text-[var(--hero-text-color)]">
              {{ t('hero.titleStart') }}
              <em>{{ t('hero.titleEm') }}</em>
            </h1>
          </div>
          <img
            src="/logo.svg"
            alt="Purpeon Digital – IT-konsulentselskap i Førde, Norge"
            fetchpriority="high"
            class="hero-mobile-logo md:hidden shrink-0 cursor-pointer"
            @click="handleFoxClick"
          />
        </div>
        <p class="text-[clamp(1rem,2vw,1.2rem)] leading-relaxed mb-4 text-[var(--hero-text-color)]" :style="{ opacity: 'var(--hero-text-opacity)' }">{{ t('hero.subtitle') }}</p>
        <p class="hero-tagline text-[clamp(1.1rem,2vw,1.3rem)] mb-8 text-[var(--hero-text-color)]" :style="{ opacity: 'var(--hero-text-opacity)' }">{{ t('hero.tagline') }}</p>
        <div class="hero-buttons flex gap-4 flex-wrap mb-3">
          <SectionButton variant="primary" href="#services">
            {{ t('hero.cta.services') }}
          </SectionButton>
          <SectionButton variant="secondary" href="#contact">
            {{ t('hero.cta.sales') }}
          </SectionButton>
        </div>
      </div>
      <div class="hero-image flex items-center max-md:hidden" style="max-height: min(600px, 50vh)">
        <div class="hero-mark cursor-pointer select-none" v-html="logoAnimated" @click="handleFoxClick"></div>
      </div>
    </div>

    <Features :features="features" />
  </section>
</template>

<style scoped>
/* Desktop hero mark. Size and filter match what SectionImage's hero preset gave the
   old <img>. The entrance is now the drawing sequence itself, so SectionImage's 1.2s
   opacity fade is gone: it only washed out the first second of the ring. */
.hero-mark {
  width: 100%;
  max-width: 400px;
  margin-inline: auto;
  filter: brightness(1) contrast(1.15);
}
.hero-mark :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}
:global([data-theme="dark"]) .hero-mark {
  filter: brightness(0.9) contrast(1.1);
  mix-blend-mode: lighten;
}

/* Mobile logo next to heading */
.hero-mobile-logo {
  width: 100px;
  height: auto;
  filter: brightness(1) contrast(1.15);
  mix-blend-mode: normal;
  opacity: 0;
  animation: mobileLogoReveal 0.8s ease-out 0.2s forwards;
}

@media (max-width: 480px) {
  .hero-mobile-logo {
    width: 72px;
  }
}

:global([data-theme="dark"] .hero-mobile-logo) {
  filter: brightness(0.9) contrast(1.1);
  mix-blend-mode: lighten;
}

@keyframes mobileLogoReveal {
  from {
    opacity: 0;
    transform: translateX(10px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Tablet: the hero stays two-column down to 768px, so its text column gets
   narrow. Trim the CTA buttons' padding and gap a touch so they stay on one
   row instead of wrapping to a stack. */
@media (max-width: 860px) {
  .hero-buttons {
    gap: 0.75rem;
  }
  .hero-buttons :deep(.btn) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

/* Short viewport height adjustments */
@media (max-height: 800px) {
  .hero {
    padding-top: 4rem;
  }

  .hero-content {
    gap: 2rem;
  }
}

@media (max-height: 650px) {
  .hero {
    padding-top: 3rem;
  }

  .hero-content {
    gap: 1.5rem;
  }
}
</style>
