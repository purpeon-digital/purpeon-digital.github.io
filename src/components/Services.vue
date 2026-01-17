<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';

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
  <section id="services" class="services-section">
    <div class="services-content">
      <div class="services-image">
        <img src="/laptop.jpg" alt="Photo by https://unsplash.com/@markusspiske?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Markus Spiske https://unsplash.com/photos/a-close-up-of-a-laptop-on-a-table-jbRFQ1wZTYY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Unsplash" />
      </div>
      <div class="services-text">
        <h2>{{ t('services.title') }}</h2>
        <p>{{ t('services.intro') }}</p>
        <p>{{ t('services.description') }}</p>
        <div class="services-list">
          <div 
            v-for="service in services" 
            :key="service.title" 
            class="service-item"
          >
            <span class="service-icon">{{ service.icon }}</span>
            <div>
              <h4>{{ service.title }}</h4>
              <p>{{ service.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
