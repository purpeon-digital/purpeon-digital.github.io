<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import Features from '@/components/Features.vue';
import SectionButton from '@/components/SectionButton.vue';
import SectionImage from '@/components/SectionImage.vue';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

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
            class="hero-mobile-logo md:hidden shrink-0"
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
        <SectionImage
          src="/logo.svg"
          alt="Purpeon Digital logo – IT consulting, software and cloud solutions"
          width="400"
          height="600"
          maxWidth="400px"
          alignment="center"
          filterPreset="hero"
          :animate-on-scroll="true"
          animation-direction="right"
          fetchpriority="high"
        />
      </div>
    </div>

    <Features :features="features" />
  </section>
</template>

<style scoped>
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
