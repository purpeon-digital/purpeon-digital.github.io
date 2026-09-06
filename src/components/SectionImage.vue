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
  loading?: 'lazy' | 'eager';
  /** Enable scroll-driven CSS parallax on the image (requires a cover-cropped frame). */
  parallax?: boolean;
  /** How far the image drifts, in % of its own height, across the scroll range. */
  parallaxOffset?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: '500px',
  borderRadius: '12px',
  alignment: 'start',
  animateOnScroll: false,
  animationDirection: 'left',
  filterPreset: 'services',
  loading: 'lazy',
  parallax: false,
  parallaxOffset: 16
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
    'section-image--parallax': props.parallax,
    'is-visible': isVisible.value
  }
]);

const frameStyle = computed(() => ({
  maxWidth: props.maxWidth,
  borderRadius: props.borderRadius,
  aspectRatio: props.width && props.height ? `${props.width} / ${props.height}` : undefined,
  '--parallax-offset': props.parallaxOffset
}));
</script>

<template>
  <div ref="containerRef" :class="containerClasses">
    <div v-if="parallax" class="section-image__frame" :style="frameStyle">
      <img
        :src="src"
        :alt="alt"
        :width="width"
        :height="height"
        :loading="props.loading"
        :fetchpriority="props.fetchpriority"
        decoding="async"
        class="section-image__media"
      />
    </div>
    <img
      v-else
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="props.loading"
      :style="{ maxWidth, borderRadius }"
      :fetchpriority="props.fetchpriority"
      decoding="async"
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

/* ── Scroll-driven parallax ──────────────────────────────────
   The frame defines a cover-cropped viewport (overflow:hidden)
   and exposes a view-timeline. The image is scaled up just past
   the frame, then drifts vertically across the scroll range so
   the overflow it gains from scaling is exactly consumed by the
   translate — no edges ever peek through. Pure CSS, no JS. */
.section-image__frame {
  position: relative;
  width: 100%;
  height: auto;
  overflow: hidden;
  border-radius: inherit;
  view-timeline-name: --section-img-parallax;
  view-timeline-axis: block;
  /* isolate so overflow:hidden reliably clips the scaled/translated child */
  transform: translateZ(0);
  box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.55);
}

.section-image__media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* scale up by 2× the drift so there is overflow to spend on both ends */
  scale: calc(1 + var(--parallax-offset, 16) * 2 / 100);
  animation: section-img-parallax auto linear both;
  animation-timeline: --section-img-parallax;
  animation-range: cover;
  will-change: translate;
}

@keyframes section-img-parallax {
  from {
    translate: 0 calc(var(--parallax-offset, 16) * -1%);
  }
  to {
    translate: 0 calc(var(--parallax-offset, 16) * 1%);
  }
}

/* Honour reduced-motion: hold the image still and un-crop it. */
@media (prefers-reduced-motion: reduce) {
  .section-image__media {
    animation: none;
    scale: 1;
    translate: none;
  }
}

/* Browsers without scroll-driven animations: no timeline fires, so
   the image keeps its static scale and would sit off-centre. Reset
   it to a clean cover crop in that case. */
@supports not (animation-timeline: view()) {
  .section-image__media {
    scale: 1;
    animation: none;
  }
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
