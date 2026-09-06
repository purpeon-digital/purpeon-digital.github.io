<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import IconLocationDot from '~icons/fa7-solid/location-dot';
import IconExternal from '~icons/fa7-solid/arrow-up-right-from-square';

interface Client {
  id: string;
  name: string;
  sector: string;
  location: string;
  url: string;
  urlLabel: string;
  description: string;
  tags: string[];
}

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

// Per-client visual identity. The header shows the client's real logo
// (theme-specific recolors generated into /public/references/). The accent
// gradient, sampled from each brand's own palette, drives the hairline, tags
// and glow. Accents are decorative only; body text stays on theme colors.
const ACCENTS: Record<string, { a: string; b: string }> = {
  vision3f: { a: '#5ac6b1', b: '#38bdf8' },
  saetren: { a: '#2587c8', b: '#7cc3ef' },
};

const clients = computed<Client[]>(() => {
  // Track locale for reactivity
  const _ = locale.value;
  return t('references.clients') as Client[];
});

// Reveal cards once the section scrolls into view (staggered via --stagger).
const sectionEl = ref<HTMLElement | null>(null);
const revealed = ref(false);
let io: IntersectionObserver | null = null;

onMounted(() => {
  if (sectionEl.value && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          revealed.value = true;
          io?.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(sectionEl.value);
  } else {
    revealed.value = true;
  }
});

onBeforeUnmount(() => {
  io?.disconnect();
});
</script>

<template>
  <section
    id="references"
    ref="sectionEl"
    class="refs-section section-viewport streak-references px-8 py-24"
    :class="{ 'is-revealed': revealed }"
  >
    <div class="refs-wrap">
      <header class="refs-head">
        <div>
          <span class="section-eyebrow refs-eyebrow">
            <span class="section-eyebrow-dot" aria-hidden="true"></span>
            {{ t('references.eyebrow') }}
          </span>
          <h2 class="section-title refs-title">
            {{ t('references.titleStart') }}
            <em>{{ t('references.titleEm') }}</em>
          </h2>
        </div>
        <p class="refs-lede">{{ t('references.lede') }}</p>
      </header>

      <div class="refs-grid">
        <a
          v-for="(c, i) in clients"
          :key="c.id"
          class="ref-card"
          :href="c.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${c.name} — ${t('references.visit')}`"
          :style="{
            '--ref-a': ACCENTS[c.id]?.a,
            '--ref-b': ACCENTS[c.id]?.b,
            '--stagger': `${i * 140}ms`,
            '--glint-delay': `${0.4 + i * 0.30}s`,
          }"
        >
          <header class="ref-head">
            <h3 class="sr-only">{{ c.name }}</h3>
            <span class="ref-logo" :class="`is-${c.id}`" aria-hidden="true">
              <img
                class="ref-logo-light"
                :src="`/references/${c.id}-light.png`"
                alt=""
                loading="lazy"
                decoding="async"
                draggable="false"
              />
              <img
                class="ref-logo-dark"
                :src="`/references/${c.id}-dark.png`"
                alt=""
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </span>
            <p class="ref-sector">{{ c.sector }}</p>
          </header>

          <p class="ref-desc">{{ c.description }}</p>

          <ul class="ref-tags">
            <li v-for="tag in c.tags" :key="tag">{{ tag }}</li>
          </ul>

          <footer class="ref-foot">
            <span class="ref-loc">
              <IconLocationDot aria-hidden="true" />
              {{ c.location }}
            </span>
            <span class="ref-link">
              {{ c.urlLabel }}
              <IconExternal aria-hidden="true" />
            </span>
          </footer>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.refs-section {
  color: var(--refs-text-color);
}

.refs-wrap {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* ---------- Headline ---------- */
.refs-head {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3rem;
  align-items: end;
  margin-bottom: 3.5rem;
}
@media (max-width: 900px) {
  .refs-head { grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 2.5rem; }
}

.refs-eyebrow { color: var(--refs-heading-color); }
.refs-title { color: var(--refs-heading-color); max-width: 16ch; margin-bottom: 0; }

.refs-lede {
  font-size: clamp(1rem, 1.3vw, 1.15rem);
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-width: 46ch;
  text-wrap: pretty;
  margin: 0;
}
:global([data-theme="dark"] .refs-lede) { color: rgba(255, 255, 255, 0.78); }

/* ---------- Card grid ---------- */
.refs-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
}
@media (max-width: 900px) {
  .refs-grid { grid-template-columns: minmax(0, 1fr); gap: 1.25rem; }
}

/* ---------- Card ---------- */
.ref-card {
  /* Peak alpha of the glass glint. Light glass needs a stronger band to read
     against the near-white card; on dark purple the same band glares. */
  --ref-sheen: 0.2;
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: 2.4rem 2.4rem 2rem;
  border-radius: 24px;
  background: var(--refs-card-bg);
  border: 1px solid var(--refs-card-border);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  /* Hairline top highlight — the lit edge of the glass pane */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.45s ease,
    border-color 0.45s ease,
    background 0.45s ease;
}
/* The pre-reveal hidden state only applies where scripting runs — the reveal
   class is added by JS, so without it (no-JS, hydration failure, unsupported
   browser) the cards must simply render visible like every other section. */
@media (scripting: enabled) {
  .ref-card { opacity: 0; }
}
.refs-section.is-revealed .ref-card {
  opacity: 1;
  /* `backwards` (not `both`): a forwards fill would pin the keyframe's final
     transform and swallow the hover lift transition below. */
  animation: ref-enter 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
  animation-delay: var(--stagger);
}
@keyframes ref-enter {
  from { opacity: 0; transform: translateY(26px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* One glint ripples through the cards serially after the reveal: each card's
   delay (--glint-delay) is offset so the band starts crossing the next card
   roughly as it exits the previous one — one beam of light passing along the
   row. `backwards` holds the band off-screen during the delay; with no
   forward fill the base transform resumes afterwards, so hover sweeps work. */
.refs-section.is-revealed .ref-card::after {
  animation: ref-glint 1.1s cubic-bezier(0.33, 0.07, 0.25, 1) backwards;
  animation-delay: var(--glint-delay);
}
@keyframes ref-glint {
  from { transform: translateX(-130%) skewX(-18deg); }
  to   { transform: translateX(230%) skewX(-18deg); }
}

/* Accent hairline along the top edge */
.ref-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--ref-a), var(--ref-b) 55%, transparent 90%);
  opacity: 0.75;
  transition: opacity 0.45s ease;
}

:global([data-theme="dark"] .ref-card) {
  --ref-sheen: 0.12;
}

/* Glass glint: one skewed band of light — bright leading edge with a faint
   trailing echo — that crosses the card exactly once. It animates `transform`
   (compositor-only) instead of `background-position`, and the band is a
   single finite element: the previous repeating background tile let a second
   copy of the band wrap back in at the left edge after the sweep ended. */
.ref-card::after {
  content: '';
  position: absolute;
  top: -20%;
  bottom: -20%;
  left: 0;
  width: 55%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, calc(var(--ref-sheen) * 0.35)) 26%,
    transparent 44%,
    rgba(255, 255, 255, calc(var(--ref-sheen) * 0.5)) 64%,
    rgba(255, 255, 255, var(--ref-sheen)) 76%,
    rgba(255, 255, 255, calc(var(--ref-sheen) * 0.5)) 88%,
    transparent 98%
  );
  transform: translateX(-130%) skewX(-18deg);
  pointer-events: none;
}

.ref-card:hover,
.ref-card:focus-visible {
  transform: translateY(-6px);
  background: var(--refs-card-hover);
  border-color: color-mix(in srgb, var(--ref-a) 45%, var(--refs-card-border));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 24px 60px -18px color-mix(in srgb, var(--ref-a) 35%, rgba(76, 29, 149, 0.35));
}
.ref-card:hover::before { opacity: 1; }
/* The sweep transition lives on the hover state only: it plays on entry and
   snaps back instantly on exit, so moving between the two cards never shows
   a reverse sweep. The 75ms delay lets the lift lead and the light follow. */
.ref-card:hover::after,
.ref-card:focus-visible::after {
  transform: translateX(230%) skewX(-18deg);
  transition: transform 0.9s cubic-bezier(0.33, 0.07, 0.25, 1) 75ms;
}
.ref-card:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ref-a) 70%, transparent);
  outline-offset: 4px;
}

/* ---------- Card header ---------- */
.ref-head {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

/* Fixed slot height so the sector line and body align across both cards even
   though the two logos have different aspect ratios. */
.ref-logo {
  display: flex;
  align-items: center;
  height: 52px;
}
/* No `display` here — the theme rules below own it, and a scoped
   `.ref-logo img` rule would out-specify them and show both variants. */
.ref-logo img {
  width: auto;
  user-select: none;
}
.ref-logo.is-vision3f img { height: 34px; }
/* The Sætren art is cropped to its content (no padding), so 36px here renders
   the same visual size the old padded 52px file did. */
.ref-logo.is-saetren img { height: 36px; }

/* Theme-specific recolors: light shows dark-text logos, dark shows light-text.
   The dark overrides include `html` so they out-specify the scoped base rules
   structurally instead of relying on source order between equal selectors. */
.ref-logo .ref-logo-light { display: block; }
.ref-logo .ref-logo-dark { display: none; }
:global(html[data-theme="dark"] .ref-logo .ref-logo-light) { display: none; }
:global(html[data-theme="dark"] .ref-logo .ref-logo-dark) { display: block; }

.ref-sector {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin: 0;
}
:global([data-theme="dark"] .ref-sector) { color: rgba(255, 255, 255, 0.6); }

/* ---------- Body ---------- */
.ref-desc {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--refs-text-color);
  text-wrap: pretty;
  margin: 0;
  max-width: 56ch;
}
:global([data-theme="dark"] .ref-desc) { color: rgba(255, 255, 255, 0.84); }

.ref-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: auto 0 0;
  padding: 0;
}
.ref-tags li {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0.32rem 0.75rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ref-a) 35%, transparent);
  background: color-mix(in srgb, var(--ref-a) 10%, transparent);
}

/* ---------- Footer ---------- */
.ref-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 1.1rem;
  border-top: 1px solid var(--refs-card-border);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}
:global([data-theme="dark"] .ref-foot) { color: rgba(255, 255, 255, 0.6); }

.ref-loc {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.ref-loc :deep(svg) {
  width: 0.85em;
  height: 0.85em;
  color: color-mix(in srgb, var(--ref-a) 75%, var(--refs-heading-color));
}

.ref-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 600;
  color: var(--refs-heading-color);
}
.ref-link::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, var(--ref-a), var(--ref-b));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.ref-link :deep(svg) {
  width: 0.8em;
  height: 0.8em;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.ref-card:hover .ref-link::after { transform: scaleX(1); }
.ref-card:hover .ref-link :deep(svg) { transform: translate(2px, -2px); }

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .ref-card {
    opacity: 1;
    transition: none;
  }
  .refs-section.is-revealed .ref-card { animation: none; }
  .ref-card:hover { transform: none; }
  .ref-card::after {
    transition: none;
    animation: none !important;
  }
  .ref-link :deep(svg),
  .ref-link::after {
    transition: none;
  }
}

/* ---------- Short viewport height adjustments ---------- */
@media (max-height: 800px) {
  .refs-section { padding: 4rem 2rem; }
  .refs-head { margin-bottom: 2rem; }
}
@media (max-height: 650px) {
  .refs-section { padding: 3rem 2rem; }
}
</style>
