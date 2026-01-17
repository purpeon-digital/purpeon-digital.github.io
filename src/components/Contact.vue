<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';

interface ContactMethod {
  icon: string;
  label: string;
  value: string;
  href?: string;
}

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

const contactMethods = computed(() => {
  // Track locale for reactivity
  const _ = locale.value;
  return t('contact.methods');
});
</script>

<template>
  <section id="contact" class="contact-section">
    <div class="contact-content">
      <div class="contact-image">
        <img src="/power.jpg" height="720px" width="480px" alt="Photo by https://unsplash.com/@hiepng?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Hiep Nguyen on https://unsplash.com/photos/silhouette-photography-of-tower-16xJbmtpO6o?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Unsplash" />
      </div>
      <div class="contact-text">
        <h2>{{ t('contact.title') }}</h2>
        <p class="lead">{{ t('contact.lead') }}</p>
        <p>{{ t('contact.description') }}</p>
        
        <div class="contact-methods">
          <a 
            v-for="method in contactMethods" 
            :key="method.label"
            :href="method.href"
            class="contact-card"
            :class="{ 'no-link': !method.href }"
          >
            <span class="contact-icon"><iconify-icon :icon="method.icon" width="24" height="24" style="color: #C7719E"></iconify-icon></span>
            <div>
              <h3>{{ method.label }}</h3>
              <p>{{ method.value }}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
