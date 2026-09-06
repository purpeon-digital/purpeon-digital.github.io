<script setup lang="ts">
import { ref } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import ContactMethods from './ContactMethods.vue';
import SectionImage from './SectionImage.vue';

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);
const currentYear = new Date().getFullYear();
const showMap = ref(false);

const toggleMap = () => {
  showMap.value = !showMap.value;
};
</script>

<template>
  <section id="contact" class="contact-section section-viewport streak-contact text-[var(--contact-text-color)] px-8 pt-24 pb-8 min-h-[calc(100vh-56px)]">
    <div class="contact-wrapper flex flex-col w-full max-w-[1400px] items-center flex-1">
      <div class="contact-content section-grid my-auto max-md:grid-cols-1">
        <div class="contact-image relative flex justify-start max-md:hidden">
          <SectionImage
            v-if="!showMap"
            src="/power.jpg"
            alt="Kontakt Purpeon Digital – IT-konsulent i Førde, Vestland"
            width="480"
            height="720"
            max-width="600px"
            border-radius="16px"
            filter-preset="contact"
            :animate-on-scroll="true"
            animation-direction="left"
            parallax
          />
          <div v-if="showMap" class="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2984.3563548229395!2d5.85200827803533!3d61.45042227571023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x461633c49568407f%3A0x2ac98f0c3e1aac9d!2sPEAK%20Sunnfjord!5e1!3m2!1sen!2sno!4v1769105218226!5m2!1sen!2sno"
              width="100%" height="450" style="border:0; border-radius: 16px;" allowfullscreen="true" loading="lazy"
              referrerpolicy="no-referrer-when-downgrade" class="map-iframe">
            </iframe>
          </div>
        </div>
        <div class="section-text">
          <span class="section-eyebrow contact-eyebrow">
            <span class="section-eyebrow-dot" aria-hidden="true"></span>
            {{ t('contact.eyebrow') }}
          </span>
          <h2 class="section-title contact-heading">
            {{ t('contact.titleStart') }}
            <em>{{ t('contact.titleEm') }}</em>
          </h2>
          <p class="lead" style="color: var(--contact-text-color)">{{ t('contact.lead') }}</p>
          <p style="color: var(--contact-text-color)">{{ t('contact.description') }}</p>

          <ContactMethods :locale="props.locale" @show-map="toggleMap" />
        </div>
      </div>

      <footer class="contact-footer">
        <div class="footer-divider"></div>
        <p class="footer-text">&copy; {{ currentYear }} Purpeon Digital</p>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.contact-content :deep(.section-image__frame) {
  height: min(720px, 60vh);
  width: auto;
}

/* Contact heading color + custom underline gradient */
.contact-eyebrow,
.contact-heading {
  color: var(--contact-heading-color);
}

.contact-heading::after {
  background: linear-gradient(90deg, #ec4899 0%, #f472b6 100%);
}

:global([data-theme="light"] .contact-heading),
:global([data-theme="light"] .contact-eyebrow) {
  color: var(--color-accent-primary);
}

/* Map container */
.map-container {
  width: 100%;
  max-width: 600px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: fadeIn 0.3s ease;
}

.map-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.map-iframe {
  display: block;
  cursor: pointer;
  transition: filter 0.3s ease;
}

.map-container:hover .map-iframe {
  filter: brightness(1.05);
}

/* Footer */
.contact-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding-top: 2rem;
}

.footer-divider {
  width: 100%;
  max-width: 1200px;
  height: 1px;
  background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 20%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0.2) 80%,
      transparent 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.footer-text {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
  font-weight: 300;
  text-transform: uppercase;
  transition: color 0.3s ease;
  margin-bottom: 0;
}

.footer-text:hover {
  color: rgba(255, 255, 255, 0.9);
}

/* Light-theme overrides live in src/styles/contact.css — Vue's :global()
   inside scoped styles silently drops them during build. */

/* Short viewport height adjustments */
@media (max-height: 800px) {
  .contact-section {
    padding: 4rem 2rem 2rem 2rem;
  }

  .contact-wrapper {
    gap: 1.5rem;
  }

  .contact-content {
    gap: 2rem;
  }
}

@media (max-height: 650px) {
  .contact-section {
    padding: 3rem 2rem 1.5rem 2rem;
  }

  .contact-content {
    gap: 1.5rem;
  }

  .contact-footer {
    padding-top: 1rem;
  }
}

@media (max-width: 480px) {
  .contact-wrapper {
    gap: 1.5rem;
  }

  .contact-footer {
    gap: 1rem;
    padding-top: 1.5rem;
  }

  .footer-text {
    font-size: 0.85rem;
  }
}
</style>
