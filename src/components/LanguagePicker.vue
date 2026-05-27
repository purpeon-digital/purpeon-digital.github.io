<script setup lang="ts">
import { useI18n, type Locale } from '@/composables/useI18n';

// Accept locale prop from SSR - this is the source of truth for display
const props = defineProps<{
  locale: Locale;
}>();

const { setLocale } = useI18n();

function toggleLanguage() {
  const newLocale: Locale = props.locale === 'en' ? 'no' : 'en';
  setLocale(newLocale);
}
</script>

<template>
  <div class="relative">
    <button
      class="bg-transparent border-none p-0.5 cursor-pointer grid grid-cols-2 gap-1 items-center relative isolate"
      @click="toggleLanguage"
      :aria-label="`Switch to ${props.locale === 'en' ? 'Norwegian' : 'English'}`"
      :aria-pressed="props.locale === 'no'"
    >
      <span
        class="flex items-center justify-center relative z-1 leading-none transition-all duration-200"
        :class="props.locale === 'no' ? 'opacity-100 grayscale-0' : 'opacity-50 grayscale-[0.95]'"
      >
        <!--
          Inline SVG (not `~icons/circle-flags/lang-no`): unplugin-icons rewrites
          the icon's internal `url(#…)` references with `Math.random()` per
          render, breaking SSR hydration. Stable IDs sidestep that.
        -->
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512" aria-hidden="true">
          <mask id="purpeon-flag-no-mask"><circle cx="256" cy="256" r="256" fill="#fff" /></mask>
          <g mask="url(#purpeon-flag-no-mask)">
            <path fill="#d80027" d="M0 0h100.2l66.1 53.5L233.7 0H512v189.3L466.3 257l45.7 65.8V512H233.7l-68-50.7l-65.5 50.7H0V322.8l51.4-68.5l-51.4-65z" />
            <path fill="#eee" d="M100.2 0v189.3H0v33.4l24.6 33L0 289.5v33.4h100.2V512h33.4l30.6-26.3l36.1 26.3h33.4V322.8H512v-33.4l-24.6-33.7l24.6-33v-33.4H233.7V0h-33.4l-33.8 25.3L133.6 0z" />
            <path fill="#0052b4" d="M133.6 0v222.7H0v66.7h133.6V512h66.7V289.4H512v-66.7H200.3V0z" />
          </g>
        </svg>
      </span>
      <span
        class="flex items-center justify-center relative z-1 leading-none transition-all duration-200"
        :class="props.locale === 'en' ? 'opacity-100 grayscale-0' : 'opacity-50 grayscale-[0.95]'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512" aria-hidden="true">
          <mask id="purpeon-flag-en-mask"><circle cx="256" cy="256" r="256" fill="#fff" /></mask>
          <g mask="url(#purpeon-flag-en-mask)">
            <path fill="#eee" d="m0 0l8 22l-8 23v23l32 54l-32 54v32l32 48l-32 48v32l32 54l-32 54v68l22-8l23 8h23l54-32l54 32h32l48-32l48 32h32l54-32l54 32h68l-8-22l8-23v-23l-32-54l32-54v-32l-32-48l32-48v-32l-32-54l32-54V0l-22 8l-23-8h-23l-54 32l-54-32h-32l-48 32l-48-32h-32l-54 32L68 0z" />
            <path fill="#0052b4" d="M336 0v108L444 0Zm176 68L404 176h108zM0 176h108L0 68ZM68 0l108 108V0Zm108 512V404L68 512ZM0 444l108-108H0Zm512-108H404l108 108Zm-68 176L336 404v108z" />
            <path fill="#d80027" d="M0 0v45l131 131h45zm208 0v208H0v96h208v208h96V304h208v-96H304V0zm259 0L336 131v45L512 0zM176 336L0 512h45l131-131zm160 0l176 176v-45L381 336z" />
          </g>
        </svg>
      </span>
    </button>
  </div>
</template>
