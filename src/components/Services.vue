<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import Features from './Features.vue';
import SectionImage from './SectionImage.vue';

interface Service {
  icon: string;
  title: string;
  description: string;
}

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

const services = computed(() => {
  // Track locale for reactivity
  const _ = locale.value;
  return t('services.items');
});
</script>

<template>
  <section id="services" class="services-section section-viewport streak-services text-[var(--services-text-color)] px-8 py-24">
    <div class="services-content section-grid max-md:grid-cols-1">
      <SectionImage
        src="/laptop.webp"
        alt="Software development and IT infrastructure services by Purpeon Digital - Photo by Markus Spiske on Unsplash"
        width="500"
        height="750"
        maxWidth="500px"
        alignment="start"
        animateOnScroll
        animationDirection="left"
        filterPreset="services"
        parallax
        class="order-1"
      />
      <div class="section-text order-2">
        <span class="section-eyebrow services-eyebrow">
          <span class="section-eyebrow-dot" aria-hidden="true"></span>
          {{ t('services.eyebrow') }}
        </span>
        <h2 class="section-title services-title">
          {{ t('services.titleStart') }}
          <em>{{ t('services.titleEm') }}</em>
        </h2>
        <p style="color: var(--services-text-color)">{{ t('services.intro') }}</p>
        <p style="color: var(--services-text-color)">{{ t('services.description') }}</p>
        <Features :features="services" :forceTwoLines="true" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.services-eyebrow,
.services-title {
  color: var(--services-heading-color);
}

.services-content :deep(.section-image__frame) {
  height: min(750px, 60vh);
  width: auto;
}

/* Short viewport height adjustments */
@media (max-height: 800px) {
  .services-section {
    padding: 4rem 2rem;
  }

  .services-content {
    gap: 2rem;
  }
}

@media (max-height: 650px) {
  .services-section {
    padding: 3rem 2rem;
  }

  .services-content {
    gap: 1.5rem;
  }
}
</style>
