<script setup lang="ts">
import { useI18n, type Locale } from '@/composables/useI18n';
import ContactMethods from './ContactMethods.vue';

const props = defineProps<{
  locale: Locale;
}>();

const { t } = useI18n(props.locale);
const currentYear = new Date().getFullYear();
</script>

<template>
  <section id="contact" class="contact-section">
    <div class="contact-wrapper">
      <div class="contact-content">
        <div class="contact-image">
          <img src="/power.jpg" height="720px" width="480px" alt="Photo by https://unsplash.com/@hiepng?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Hiep Nguyen on https://unsplash.com/photos/silhouette-photography-of-tower-16xJbmtpO6o?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText Unsplash" />
        </div>
        <div class="contact-text">
          <h2>{{ t('contact.title') }}</h2>
          <p class="lead">{{ t('contact.lead') }}</p>
          <p>{{ t('contact.description') }}</p>
          
          <ContactMethods :locale="locale" />
        </div>
      </div>
      
      <footer class="contact-footer">
        <div class="footer-divider"></div>
        <p class="footer-text">&copy; {{ currentYear }} Purpeon Digital.</p>
      </footer>
    </div>
  </section>
</template>
