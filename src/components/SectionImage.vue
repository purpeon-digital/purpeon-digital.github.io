<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface Props {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  maxWidth?: string;
  borderRadius?: string;
  alignment?: 'start' | 'end' | 'center';
  animateOnScroll?: boolean;
  animationDirection?: 'left' | 'right';
  filterPreset?: 'hero' | 'services' | 'about' | 'contact';
  fetchpriority?: 'high' | 'low' | 'auto';
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: '500px',
  borderRadius: '12px',
  alignment: 'start',
  animateOnScroll: false,
  animationDirection: 'left',
  filterPreset: 'services',
  fetchpriority: 'auto'
});

const containerRef = ref<HTMLElement | null>(null);
const isVisible = ref(!props.animateOnScroll);

onMounted(() => {
  if (!props.animateOnScroll || !containerRef.value) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true;
          observer.disconnect();
        }
      });
    },
    { threshold: 0.2 }
  );

  observer.observe(containerRef.value);
});

const containerClasses = computed(() => [
  'section-image relative flex max-md:hidden',
  props.alignment === 'start' ? 'justify-start' : props.alignment === 'end' ? 'justify-end' : 'justify-center',
  `section-image--${props.filterPreset}`,
  {
    'section-image--animate': props.animateOnScroll,
    'section-image--from-left': props.animationDirection === 'left',
    'section-image--from-right': props.animationDirection === 'right',
    'is-visible': isVisible.value
  }
]);
</script>

<template>
  <div ref="containerRef" :class="containerClasses">
    <img
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :style="{ maxWidth, borderRadius }"
      :fetchpriority="props.fetchpriority"
      class="w-full h-auto object-cover"
    />
    <slot name="badge" />
  </div>
</template>

<style scoped>
.section-image {
  /* Base styles */
  width: 100%;
  height: auto;
}
/* Filter presets — complex multi-value filters + blend modes */
.section-image--hero img {
  filter: brightness(1) contrast(1.15);
  mix-blend-mode: normal;
}

.section-image--services img {
  filter: brightness(0.95) saturate(1.1);
}

.section-image--about img {
  filter: brightness(1) contrast(1.2) saturate(1.1);
  mix-blend-mode: normal;
}

.section-image--contact img {
  filter: brightness(1) contrast(1.1);
  mix-blend-mode: normal;
}

/* Dark theme blend mode overrides */
:global([data-theme="dark"] .section-image--hero img) {
  filter: brightness(0.9) contrast(1.1);
  mix-blend-mode: lighten;
}

:global([data-theme="dark"] .section-image--about img) {
  filter: brightness(0.85) contrast(1.15) saturate(1.1);
  mix-blend-mode: lighten;
}

:global([data-theme="dark"] .section-image--contact img) {
  filter: brightness(0.9) contrast(1.1) hue-rotate(-10deg);
  mix-blend-mode: lighten;
}

/* Scroll-reveal animation */
.section-image--animate {
  opacity: 0;
  transition: opacity 1.2s ease-out, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-image--animate.section-image--from-left {
  transform: translateX(-30px) scale(0.98);
}

.section-image--animate.section-image--from-right {
  transform: translateX(30px) scale(0.98);
}

.section-image--animate.is-visible {
  opacity: 1;
  transform: translateX(0) scale(1);
}
</style>
