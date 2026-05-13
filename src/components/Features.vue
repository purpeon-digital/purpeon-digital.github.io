<script setup lang="ts">
import type { Component } from 'vue';
// Hero icons
import IconMapLocation from '~icons/fa7-solid/map-location-dot';
import IconWrench from '~icons/fa7-solid/wrench';
import IconLock from '~icons/fa7-solid/lock';
import IconCheckCircle from '~icons/fa7-solid/check-circle';
// Services icons
import IconCloud from '~icons/fa7-solid/cloud';
import IconRobot from '~icons/fa7-solid/robot';
import IconCog from '~icons/fa7-solid/cog';
import IconChartBar from '~icons/fa7-solid/chart-bar';
// About icons
import IconHandshakeAlt from '~icons/fa7-solid/handshake-alt';
import IconFaceGrinStars from '~icons/fa7-solid/face-grin-stars';
import IconLightbulb from '~icons/fa7-solid/lightbulb';
import IconBookOpenReader from '~icons/fa7-solid/book-open-reader';

// Resolve i18n icon-name strings to bundled Vue components at render time.
// Adding a new icon here means importing it above + adding to this map.
const ICONS: Record<string, Component> = {
  'fa7-solid:map-location-dot': IconMapLocation,
  'fa7-solid:wrench': IconWrench,
  'fa7-solid:lock': IconLock,
  'fa7-solid:check-circle': IconCheckCircle,
  'fa7-solid:cloud': IconCloud,
  'fa7-solid:robot': IconRobot,
  'fa7-solid:cog': IconCog,
  'fa7-solid:chart-bar': IconChartBar,
  'fa7-solid:handshake-alt': IconHandshakeAlt,
  'fa7-solid:face-grin-stars': IconFaceGrinStars,
  'fa7-solid:lightbulb': IconLightbulb,
  'fa7-solid:book-open-reader': IconBookOpenReader,
};

interface Feature {
  icon: string;
  title: string;
  description: string;
  forceTwoLines?: boolean;
}

const props = defineProps<{
  features: Feature[];
  forceTwoLines?: boolean
}>();
</script>

<template>
  <div
    class="features grid gap-3 w-full max-w-[1400px] mt-auto md:gap-4"
    :class="forceTwoLines
      ? 'features-force-two-lines grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:gap-5'"
  >
    <div v-for="feature in props.features" :key="feature.title" class="feature-card">
      <div class="feature-header flex items-center gap-3">
        <span class="feature-icon-wrapper">
          <component :is="ICONS[feature.icon]" />
        </span>
        <h2 class="feature-title">{{ feature.title }}</h2>
      </div>
      <p class="feature-desc">{{ feature.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  background: var(--feature-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--feature-border);
  padding: 1.35rem 1.4rem;
  border-radius: 14px;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.25s ease,
    border-color 0.25s ease;
}

.feature-card:hover {
  background: var(--feature-hover-bg);
  transform: translateY(-3px);
  border-color: var(--feature-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 10px 28px -12px rgba(0, 0, 0, 0.35),
    0 4px 12px -6px rgba(124, 58, 237, 0.25);
}

.feature-header {
  margin-bottom: 0.6rem;
}

.feature-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
  border-radius: 11px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: background 0.3s ease, transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  flex-shrink: 0;
}

.feature-icon-wrapper svg {
  display: block;
  width: 24px;
  height: 24px;
  font-size: 24px;
  color: var(--feature-icon-color);
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon-wrapper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15));
  transform: scale(1.04);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feature-card:hover .feature-icon-wrapper svg {
  transform: scale(1.08);
}

.feature-title {
  font-size: 1.05rem;
  margin: 0;
  padding-bottom: 0.35rem;
  color: var(--feature-text-color);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.005em;
  position: relative;
}

.feature-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.65) 0%, rgba(192, 132, 252, 0.5) 100%);
  border-radius: 1px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover .feature-title::after {
  transform: scaleX(1);
}

.feature-desc {
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: var(--feature-text-opacity);
  color: var(--feature-text-color);
  margin: 0;
}

/* Light theme overrides — unify with shared --feature-* tokens (see src/styles/app.css) */
:global([data-theme="light"]) .feature-card {
  background: var(--feature-bg);
  border-color: var(--feature-border);
}

:global([data-theme="light"]) .feature-card:hover {
  background: var(--feature-hover-bg);
  border-color: var(--feature-border);
}

:global([data-theme="light"]) .feature-icon-wrapper {
  background: linear-gradient(135deg, rgba(107, 70, 193, 0.22), rgba(107, 70, 193, 0.12));
  border-color: rgba(107, 70, 193, 0.3);
}

:global([data-theme="light"]) .feature-card:hover .feature-icon-wrapper {
  background: linear-gradient(135deg, rgba(107, 70, 193, 0.32), rgba(107, 70, 193, 0.2));
  border-color: rgba(107, 70, 193, 0.45);
}

:global([data-theme="light"]) .feature-icon-wrapper svg {
  color: var(--color-accent-primary);
}

:global([data-theme="light"]) .feature-title,
:global([data-theme="light"]) .feature-desc {
  color: var(--color-text-primary);
}

/* Small mobile: compact cards */
@media (max-width: 480px) {
  .feature-card {
    padding: 1rem 1.05rem;
    border-radius: 12px;
  }

  .feature-header {
    gap: 0.65rem;
    margin-bottom: 0.35rem;
  }

  .feature-icon-wrapper {
    min-width: 38px;
    width: 38px;
    height: 38px;
    border-radius: 9px;
  }

  .feature-icon-wrapper svg {
    width: 20px;
    height: 20px;
    font-size: 20px;
  }

  .feature-title {
    font-size: 0.98rem;
    line-height: 1.25;
    padding-bottom: 0.3rem;
  }

  .feature-desc {
    font-size: 0.85rem;
    line-height: 1.45;
  }
}
</style>
