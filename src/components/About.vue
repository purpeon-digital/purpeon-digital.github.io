<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';

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
  return t('about.values');
});
</script>

<template>
  <section id="about" class="about-section">
    <div class="about-content">
      <div class="about-text">
        <h2>{{ t('about.title') }}</h2>
        <p class="lead">{{ t('about.lead') }}</p>
        <p>{{ t('about.description1') }}</p>
        <p>{{ t('about.description2') }}</p>
        <p>{{  t('about.description3') }}</p>
        
        <div class="values-grid">
          <div 
            v-for="value in values" 
            :key="value.title" 
            class="value-card"
          >
            <span class="value-icon">{{ value.icon }}</span>
            <div>
              <h4>{{ value.title }}</h4>
              <p>{{ value.description }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="about-image">
        <img src="/foxglove_photo.jpg" alt="Foxglove - Photo by https://unsplash.com/@anniespratt?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Annie Spratt on https://unsplash.com/photos/a-field-full-of-purple-flowers-on-a-cloudy-day-OuUdVpx1JD8?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Unsplash" />
      </div>
    </div>
  </section>
</template>
