<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import IconPaperPlane from '~icons/fa6-solid/paper-plane';
import IconPhone from '~icons/fa6-solid/phone';
import IconNewspaper from '~icons/fa6-solid/newspaper';
import IconMapLocation from '~icons/fa7-solid/map-location-dot';

type ContactMethodType = 'email' | 'phone' | 'location' | 'org';

interface ContactMethodConfig {
  type: ContactMethodType;
  icon: Component;
  labelKey: string;
  value: string;
  action: 'link' | 'map' | 'external' | 'none';
  getHref?: (value: string) => string;
  getExternalUrl?: (value: string) => string;
}

interface ContactMethodDisplay {
  type: ContactMethodType;
  icon: Component;
  label: string;
  value: string;
  action: 'link' | 'map' | 'external' | 'none';
  href?: string;
  externalUrl?: string;
}

const props = defineProps<{
  locale: Locale;
}>();

const emit = defineEmits<{
  'show-map': [];
}>();

const { t, locale } = useI18n(props.locale);

// Structured contact method configuration
const methodConfigs: ContactMethodConfig[] = [
  {
    type: 'email',
    icon: IconPaperPlane,
    labelKey: 'contact.email',
    value: 'kontakt@purpeon.com',
    action: 'link',
    getHref: (value) => `mailto:${value}`
  },
  {
    type: 'phone',
    icon: IconPhone,
    labelKey: 'contact.phone',
    value: '+47 959 92 555',
    action: 'link',
    getHref: (value) => `tel:${value.replace(/\s/g, '')}`
  },
  {
    type: 'location',
    icon: IconMapLocation,
    labelKey: 'contact.location',
    value: 'PEAK Sunnfjord, Hafstadvegen 23-25, 6800 Førde',
    action: 'map',
    getHref: () => 'https://maps.app.goo.gl/VPSqRpZNxxvvw8jL6'
  },
  {
    type: 'org',
    icon: IconNewspaper,
    labelKey: 'contact.orgNumber',
    value: '836 295 722',
    action: 'external',
    getExternalUrl: (value) => `https://virksomhet.brreg.no/nb/oppslag/enheter/${value.replace(/\s/g, '')}`
  }
];

const contactMethods = computed<ContactMethodDisplay[]>(() => {
  // Track locale for reactivity
  const _ = locale.value;

  return methodConfigs.map(config => {
    const externalUrl = config.getExternalUrl?.(config.value);
    const baseHref = config.getHref?.(config.value);

    // For external actions, use externalUrl as href for crawlability
    const href = config.action === 'external' ? externalUrl : baseHref;

    return {
      type: config.type,
      icon: config.icon,
      label: t(config.labelKey) as string,
      value: config.value,
      action: config.action,
      href,
      externalUrl
    };
  });
});

const isClickable = (method: ContactMethodDisplay): boolean => {
  return method.action !== 'none';
};

const handleClick = (method: ContactMethodDisplay, event: MouseEvent) => {
  if (method.action === 'map') {
    event.preventDefault();
    emit('show-map');
  }
  // 'external' and 'link' actions use default href behavior with proper attributes
};
</script>

<template>
  <div class="contact-methods flex flex-col gap-4 my-8">
    <a
      v-for="method in contactMethods"
      :key="method.label"
      :href="method.href"
      :target="method.action === 'external' ? '_blank' : undefined"
      :rel="method.action === 'external' ? 'noopener noreferrer' : undefined"
      class="contact-card"
      :class="{
        'clickable': isClickable(method),
        'no-link': !isClickable(method)
      }"
      @click="handleClick(method, $event)"
    >
      <span class="text-[1.8rem] shrink-0">
        <component :is="method.icon" width="24" height="24" class="text-contact-icon" />
      </span>
      <div>
        <h3>{{ method.label }}</h3>
        <p>{{ method.value }}</p>
      </div>
    </a>
  </div>
</template>

<style scoped>
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

.contact-card:not(.no-link):hover,
.contact-card.clickable:hover {
  background: var(--contact-card-hover);
  transform: translateX(8px);
  border-color: rgba(244, 114, 182, 0.4);
  cursor: pointer;
}

.contact-card.no-link {
  cursor: default;
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
:global([data-theme="light"] .contact-card) {
  background: rgba(107, 70, 193, 0.12);
  border: 1px solid rgba(107, 70, 193, 0.25);
}

:global([data-theme="light"] .contact-card:not(.no-link):hover),
:global([data-theme="light"] .contact-card.clickable:hover) {
  background: rgba(107, 70, 193, 0.2);
  border-color: rgba(107, 70, 193, 0.4);
}

:global([data-theme="light"] .contact-card h3) {
  color: var(--color-accent-primary);
}

:global([data-theme="light"] .contact-card p) {
  color: var(--color-text-primary);
}
</style>
