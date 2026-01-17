<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';

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
  <section class="hero">
    <div class="hero-content">
      <div class="hero-text">
        <h1>{{ t('hero.title') }}</h1>
        <p>{{ t('hero.subtitle') }}</p>
        <p class="hero-tagline">{{ t('hero.tagline') }}</p>
        <div class="hero-buttons">
            <a href="#services" class="btn-primary">{{ t('hero.cta.services') }}</a>
            <a href="#contact" class="btn-secondary">{{ t('hero.cta.sales') }}</a>
        </div>
      </div>
      <div class="hero-image">
        <img src="/hero-render.jpg" alt="Photo by https://unsplash.com/@solenfeyissa?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Solen Feyissa on https://unsplash.com/photos/a-close-up-of-a-cell-phone-with-a-blurry-background-_Cb6oD5oiVE?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Unsplash" width="400" height="600" />
      </div>
    </div>
    
    <div class="hero-features">
      <div 
        v-for="feature in features" 
        :key="feature.title" 
        class="feature-card"
      >
        <div class="feature-icon">{{ feature.icon }}</div>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.description }}</p>
      </div>
    </div>
  </section>
</template>
