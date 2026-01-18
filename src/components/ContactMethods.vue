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
  return t('contact.methods') as ContactMethod[];
});
</script>

<template>
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
</template>

<style scoped>
.contact-methods {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 2rem 0;
}

.contact-card {
    display: flex;
    gap: 1rem;
    align-items: center;
    background: var(--contact-card-bg);
    padding: 1.25rem 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--contact-card-border);
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
}

.contact-card:not(.no-link):hover {
    background: var(--contact-card-hover);
    transform: translateX(8px);
    border-color: rgba(244, 114, 182, 0.4);
}

.contact-card.no-link {
    cursor: default;
}

.contact-icon {
    font-size: 1.8rem;
    flex-shrink: 0;
}

.contact-card h3 {
    font-size: 0.85rem;
    margin-bottom: 0.2rem;
    color: var(--contact-heading-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
}

.contact-card p {
    font-size: 1.1rem;
    margin: 0;
    color: var(--contact-text-color);
    font-weight: 500;
}

/* Light mode */
[data-theme="light"] .contact-card {
    background: rgba(107, 70, 193, 0.12);
    border: 1px solid rgba(107, 70, 193, 0.25);
}

[data-theme="light"] .contact-card:not(.no-link):hover {
    background: rgba(107, 70, 193, 0.2);
    border-color: rgba(107, 70, 193, 0.4);
}

[data-theme="light"] .contact-card h3 {
    color: #6B46C1;
}

[data-theme="light"] .contact-card p {
    color: #2d2d2d;
}
</style>
