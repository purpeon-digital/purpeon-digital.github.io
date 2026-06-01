<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import Features from './Features.vue';
import SectionImage from './SectionImage.vue';

interface Value {
  icon: string;
  title: string;
  description: string;
}

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

const values = computed(() => {
  // Track locale for reactivity
  const _ = locale.value;
  return t('about.values') as Value[];
});
</script>

<template>
  <section id="about" class="about-section section-viewport streak-about text-[var(--about-text-color)] px-8 py-24">
    <div class="about-content section-grid max-md:grid-cols-1">
      <div class="section-text">
        <span class="section-eyebrow about-eyebrow">
          <span class="section-eyebrow-dot" aria-hidden="true"></span>
          {{ t('about.eyebrow') }}
        </span>
        <h2 class="section-title about-heading">
          {{ t('about.titleStart') }}
          <em>{{ t('about.titleEm') }}</em>
        </h2>
        <p class="lead" style="color: var(--about-text-color)">{{ t('about.lead') }}</p>
        <p style="color: var(--about-text-color)">{{ t('about.description1') }}</p>
        <p style="color: var(--about-text-color)">{{ t('about.description2') }}</p>
        <p style="color: var(--about-text-color)">{{ t('about.description3') }}</p>
        <Features :features="values" :forceTwoLines="true" />
      </div>
      <SectionImage
        src="/foxglove_photo.jpg"
        alt="Revebjelle (foxglove) – inspirasjon for Purpeon Digital sitt namn og lokale identitet i Sogn og Fjordane - Photo by Annie Spratt on Unsplash"
        width="480"
        height="640"
        maxWidth="480px"
        borderRadius="16px"
        alignment="end"
        filterPreset="about"
        animateOnScroll
        animationDirection="right"
      />
    </div>
  </section>
</template>

<style scoped>
.about-content :deep(img) {
  max-height: min(640px, 60vh);
  width: auto;
  object-fit: contain;
}

/* About heading color + custom underline gradient */
.about-eyebrow,
.about-heading {
  color: var(--about-heading-color);
}

.about-heading::after {
  background: linear-gradient(90deg, #818cf8 0%, #a5b4fc 100%);
}

:global([data-theme="light"] .about-heading),
:global([data-theme="light"] .about-eyebrow) {
  color: var(--color-accent-primary);
}

/* Short viewport height adjustments */
@media (max-height: 800px) {
  .about-section {
    padding: 4rem 2rem;
  }

  .about-content {
    gap: 2rem;
  }
}

@media (max-height: 650px) {
  .about-section {
    padding: 3rem 2rem;
  }

  .about-content {
    gap: 1.5rem;
  }
}
</style>
