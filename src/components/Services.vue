<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref } from 'vue';
import type { Component } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import IconNinja from '~icons/fa7-solid/user-ninja';
import IconPeopleGroup from '~icons/fa7-solid/people-group';
import IconUserPlus from '~icons/fa7-solid/user-plus';
import IconCompass from '~icons/fa7-solid/compass';
import IconChevronLeft from '~icons/fa7-solid/chevron-left';
import IconChevronRight from '~icons/fa7-solid/chevron-right';

interface Package {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  tags: string[];
}

// Resolve i18n icon-name strings to bundled components. Same pattern as
// Features.vue, but local: these icons are only used here.
const ICONS: Record<string, Component> = {
  'fa7-solid:user-ninja': IconNinja,
  'fa7-solid:people-group': IconPeopleGroup,
  'fa7-solid:user-plus': IconUserPlus,
  'fa7-solid:compass': IconCompass,
};

// One accent per package, as an OKLCH hue only: lightness and chroma are fixed
// in CSS so all four sit at the same visual weight and stay inside the purple
// family the section's gradient already establishes.
const HUES: Record<string, number> = {
  ninja: 312,
  lag: 302,
  forsterkingar: 292,
  raadgjeving: 282,
};

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

const packages = computed<Package[]>(() => {
  // Track locale for reactivity
  const _ = locale.value;
  return t('services.items') as Package[];
});

const count = computed(() => packages.value.length);

/* ---------- Carousel ----------
   The loop is real: the list is rendered three times over and `pos` indexes
   that tripled list, starting in the middle copy. Stepping past either end of
   the middle copy still lands on a rendered slide, and once the slide
   transition finishes `normalize()` shifts `pos` back by one copy with the
   transition switched off — visually identical, so left and right both run
   forever with no dead end.

   Positioning is a transform rather than a native scroll container: a scroll
   container cannot be silently repositioned mid-gesture without the jump being
   visible, which is exactly what the wrap needs. Touch and mouse drag are
   handled by the pointer events below, and `touch-action: pan-y` leaves the
   page's own vertical scrolling to the browser. */
const viewportEl = ref<HTMLElement | null>(null);
const trackEl = ref<HTMLElement | null>(null);

const pos = ref(0);
const step = ref(0); // slide pitch in px, i.e. slide width + gap
const slideWidth = ref(0);
const viewportWidth = ref(0);
const drag = ref(0);
const animating = ref(true);

// Three copies, so there is always a slide to step onto in either direction.
const COPIES = 3;
const slides = computed(() =>
  Array.from({ length: COPIES }, () => packages.value).flat(),
);

const activeIndex = computed(() =>
  count.value ? ((pos.value % count.value) + count.value) % count.value : 0,
);

const trackStyle = computed(() => {
  const centre = (viewportWidth.value - slideWidth.value) / 2;
  return { transform: `translate3d(${centre - pos.value * step.value + drag.value}px, 0, 0)` };
});

const slideLabel = (i: number) =>
  t('services.slide')
    .replace('{n}', String(i + 1))
    .replace('{m}', String(count.value));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);

function measure() {
  const viewport = viewportEl.value;
  const track = trackEl.value;
  if (!viewport || !track || track.children.length < 2) return;
  const first = track.children[0] as HTMLElement;
  const second = track.children[1] as HTMLElement;
  // Layout offsets, not bounding rects: the inactive slides are scaled down,
  // and a rect would fold that transform into the width and the pitch. Reading
  // the pitch off two rendered slides picks up the CSS gap without this
  // component having to know what the gap is.
  step.value = second.offsetLeft - first.offsetLeft;
  slideWidth.value = first.offsetWidth;
  viewportWidth.value = viewport.clientWidth;
}

// Move `pos` back into the middle copy without animating it. Same pixels on
// screen, but both directions are open again.
async function normalize() {
  const n = count.value;
  if (!n) return;
  if (pos.value >= n && pos.value < n * 2) return;
  const track = trackEl.value;
  animating.value = false;
  pos.value = n + activeIndex.value;
  await nextTick();
  // Force the un-animated transform to be applied before transitions come back.
  void track?.offsetWidth;
  animating.value = true;
}

function go(delta: number) {
  if (!delta || !count.value) return;
  animating.value = true;
  pos.value += delta;
  // With no transition there is no transitionend to normalize on.
  if (prefersReducedMotion()) void nextTick().then(normalize);
}

// Take the shorter way round to the requested package.
function goTo(i: number) {
  const n = count.value;
  if (!n) return;
  let delta = i - activeIndex.value;
  if (delta > n / 2) delta -= n;
  if (delta < -n / 2) delta += n;
  go(delta);
}

function onTransitionEnd(e: TransitionEvent) {
  if (e.target === trackEl.value && e.propertyName === 'transform') normalize();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    go(1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    go(-1);
  }
}

/* ---------- Drag / swipe ---------- */
let dragStartX = 0;
let dragging = false;

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  dragging = true;
  dragStartX = e.clientX;
  drag.value = 0;
  animating.value = false;
  trackEl.value?.setPointerCapture?.(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return;
  drag.value = e.clientX - dragStartX;
}

function onPointerUp(e: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  const moved = drag.value;
  drag.value = 0;
  animating.value = true;
  trackEl.value?.releasePointerCapture?.(e.pointerId);
  // Below the threshold the reset above already springs the slide back.
  const threshold = Math.max(40, step.value * 0.15);
  if (Math.abs(moved) > threshold) go(moved < 0 ? 1 : -1);
}

/* ---------- Mount ---------- */
const sectionEl = ref<HTMLElement | null>(null);
const revealed = ref(false);
let io: IntersectionObserver | null = null;
let ro: ResizeObserver | null = null;

onMounted(() => {
  pos.value = count.value; // first package, in the middle copy
  measure();

  if (viewportEl.value && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => measure());
    ro.observe(viewportEl.value);
  } else {
    window.addEventListener('resize', measure);
  }

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
  ro?.disconnect();
  window.removeEventListener('resize', measure);
});
</script>

<template>
  <section
    id="services"
    ref="sectionEl"
    class="services-section section-viewport streak-services px-8 py-20"
    :class="{ 'is-revealed': revealed }"
  >
    <div class="pkg-wrap">
      <header class="pkg-head">
        <span class="section-eyebrow services-eyebrow">
          <span class="section-eyebrow-dot" aria-hidden="true"></span>
          {{ t('services.eyebrow') }}
        </span>
        <h2 class="section-title services-title">
          {{ t('services.titleStart') }}
          <em>{{ t('services.titleEm') }}</em>
        </h2>
      </header>

      <div class="pkg-carousel">
        <button
          type="button"
          class="pkg-nav pkg-nav--prev"
          :aria-label="t('services.prev')"
          @click="go(-1)"
        >
          <IconChevronLeft aria-hidden="true" />
        </button>

        <div
          ref="viewportEl"
          class="pkg-viewport"
          role="group"
          tabindex="0"
          :aria-roledescription="t('services.carouselRole')"
          :aria-label="t('services.title')"
          @keydown="onKeydown"
        >
          <div
            ref="trackEl"
            class="pkg-track"
            :class="{ 'is-animating': animating }"
            :style="trackStyle"
            @transitionend="onTransitionEnd"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <article
              v-for="(p, i) in slides"
              :key="`${i}-${p.id}`"
              class="pkg-slide"
              :class="{ 'is-active': i === pos }"
              role="group"
              :aria-label="slideLabel(i % count)"
              :aria-hidden="i < count || i >= count * 2 ? 'true' : undefined"
              :style="{ '--pkg-hue': HUES[p.id] ?? 292 }"
            >
              <div class="pkg-aside">
                <span class="pkg-icon" aria-hidden="true">
                  <component :is="ICONS[p.icon]" />
                </span>
                <h3 class="pkg-title">{{ p.title }}</h3>
                <p class="pkg-tagline">{{ p.tagline }}</p>
                <ul class="pkg-tags">
                  <li v-for="tag in p.tags" :key="tag">{{ tag }}</li>
                </ul>
              </div>

              <p class="pkg-desc">{{ p.description }}</p>
            </article>
          </div>
        </div>

        <button
          type="button"
          class="pkg-nav pkg-nav--next"
          :aria-label="t('services.next')"
          @click="go(1)"
        >
          <IconChevronRight aria-hidden="true" />
        </button>

        <div class="pkg-dots">
          <button
            v-for="(p, i) in packages"
            :key="p.id"
            type="button"
            class="pkg-dot"
            :class="{ 'is-active': i === activeIndex }"
            :style="{ '--pkg-hue': HUES[p.id] ?? 292 }"
            :aria-label="slideLabel(i)"
            :aria-current="i === activeIndex ? 'true' : undefined"
            @click="goTo(i)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.services-section {
  color: var(--services-text-color);
}

.pkg-wrap {
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

/* ---------- Headline ---------- */
.pkg-head {
  margin-bottom: 2.25rem;
}

.services-eyebrow,
.services-title {
  color: var(--services-heading-color);
}
.services-title { margin-bottom: 0; }

/* ---------- Carousel frame ----------
   One grid so the prev/next buttons and the dots can swap places between the
   desktop layout (arrows flanking the viewport) and the narrow one (arrows
   down beside the dots) without duplicating the buttons in the markup. */
.pkg-carousel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'prev viewport next'
    '.    dots     .';
  align-items: center;
  gap: 1.25rem 0.75rem;
}
@media (scripting: enabled) {
  .pkg-carousel { opacity: 0; }
}
.services-section.is-revealed .pkg-carousel {
  opacity: 1;
  animation: pkg-enter 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
}
@keyframes pkg-enter {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---------- Viewport and track ---------- */
.pkg-viewport {
  grid-area: viewport;
  overflow: hidden;
  /* No mask here, deliberately: a mask makes this element a backdrop root, and
     the slides inside would lose the frosted-glass backdrop-filter that every
     other card on the site has. The peek slides are dimmed instead. */
  /* Room for the lifted, shadowed active slide to breathe inside the clip. */
  padding: 0.6rem 0;
  margin: -0.6rem 0;
}
.pkg-viewport:focus-visible {
  outline: 2px solid var(--services-heading-color);
  outline-offset: 6px;
  border-radius: 24px;
}

.pkg-track {
  display: flex;
  gap: 1.5rem;
  /* Vertical page scrolling stays with the browser; only the horizontal
     gesture is ours. */
  touch-action: pan-y;
  cursor: grab;
}
.pkg-track:active { cursor: grabbing; }
.pkg-track.is-animating {
  transition: transform 0.55s cubic-bezier(0.22, 0.75, 0.25, 1);
}
@media (prefers-reduced-motion: reduce) {
  .pkg-track.is-animating { transition: none; }
}

/* ---------- Slide ----------
   Under 100% width so the neighbours on both sides stay visible: the peek is
   what says the carousel continues in both directions. */
.pkg-slide {
  --pkg-a: oklch(0.55 0.19 var(--pkg-hue));
  --pkg-b: oklch(0.72 0.15 var(--pkg-hue));
  position: relative;
  flex: 0 0 72%;
  display: grid;
  grid-template-columns: minmax(200px, 270px) minmax(0, 1fr);
  gap: 1rem 2.5rem;
  /* Every slide is as tall as the tallest one (flex stretch in the track), so
     the shorter ones centre their content instead of hanging from the top. */
  align-items: center;
  /* Deliberately tall in landscape: the two columns are short, and the extra
     vertical padding is what stops the slide reading as a letterbox. Portrait
     resets this below, where the stacked content supplies the height itself. */
  padding: 4.9rem 2.4rem;
  border-radius: 22px;
  background: var(--services-card-bg);
  border: 1px solid var(--services-card-border);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  overflow: hidden;
  user-select: none;
  /* The neighbours are legible but clearly secondary. */
  opacity: 0.42;
  transform: scale(0.94);
  transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.22, 0.75, 0.25, 1),
    box-shadow 0.55s ease;
}
.pkg-slide.is-active {
  opacity: 1;
  transform: scale(1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 24px 60px -22px color-mix(in srgb, var(--pkg-a) 40%, rgba(76, 29, 149, 0.35));
}
:global([data-theme="dark"] .pkg-slide) {
  --pkg-a: oklch(0.72 0.16 var(--pkg-hue));
  --pkg-b: oklch(0.85 0.11 var(--pkg-hue));
}
@media (prefers-reduced-motion: reduce) {
  .pkg-slide { transition: none; }
}
@media (max-width: 1200px) {
  .pkg-slide {
    flex: 0 0 84%;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.2rem;
    padding: 1.8rem 1.7rem;
  }
}
@media (max-width: 480px) {
  .pkg-slide { flex: 0 0 88%; padding: 1.5rem 1.4rem; }
}

/* Accent hairline along the top edge */
.pkg-slide::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--pkg-a), var(--pkg-b) 55%, transparent 90%);
}

/* ---------- Slide identity column ---------- */
.pkg-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
}

.pkg-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 0.35rem;
  border-radius: 15px;
  border: 1px solid color-mix(in srgb, var(--pkg-a) 32%, transparent);
  background: color-mix(in srgb, var(--pkg-a) 12%, transparent);
  color: var(--pkg-a);
}
:global([data-theme="dark"] .pkg-icon) { color: var(--pkg-b); }
.pkg-icon :deep(svg) {
  width: 1.4rem;
  height: 1.4rem;
}

.pkg-title {
  font-size: clamp(1.35rem, 1.9vw, 1.7rem);
  font-weight: 700;
  line-height: 1.15;
  color: var(--services-heading-color);
  margin: 0;
}

.pkg-tagline {
  font-style: italic;
  font-size: 0.96rem;
  line-height: 1.35;
  color: var(--color-text-secondary);
  margin: 0;
}
:global([data-theme="dark"] .pkg-tagline) { color: rgba(255, 255, 255, 0.62); }

.pkg-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
}
.pkg-tags li {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--pkg-a) 35%, transparent);
  background: color-mix(in srgb, var(--pkg-a) 10%, transparent);
}

/* ---------- Slide body ---------- */
.pkg-desc {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--services-text-color);
  text-wrap: pretty;
  max-width: 60ch;
  margin: 0;
}
:global([data-theme="dark"] .pkg-desc) { color: rgba(255, 255, 255, 0.86); }
@media (max-width: 480px) {
  .pkg-desc { font-size: 0.95rem; line-height: 1.6; }
}

/* ---------- Arrows ---------- */
.pkg-nav {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--services-card-border);
  background: var(--services-card-bg);
  color: var(--services-heading-color);
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}
.pkg-nav--prev { grid-area: prev; }
.pkg-nav--next { grid-area: next; }
.pkg-nav :deep(svg) {
  width: 0.9rem;
  height: 0.9rem;
}
.pkg-nav:hover {
  background: var(--services-card-hover);
  border-color: var(--services-heading-color);
  transform: scale(1.06);
}
.pkg-nav:focus-visible {
  outline: 2px solid var(--services-heading-color);
  outline-offset: 3px;
}

/* ---------- Dots ---------- */
.pkg-dots {
  grid-area: dots;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.6rem;
}

.pkg-dot {
  --pkg-a: oklch(0.55 0.19 var(--pkg-hue));
  width: 9px;
  height: 9px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--services-heading-color) 28%, transparent);
  cursor: pointer;
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.3s ease;
}
:global([data-theme="dark"] .pkg-dot) {
  --pkg-a: oklch(0.72 0.16 var(--pkg-hue));
}
.pkg-dot.is-active {
  width: 26px;
  background: var(--pkg-a);
}
.pkg-dot:focus-visible {
  outline: 2px solid var(--services-heading-color);
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  .pkg-dot { transition: none; }
  .services-section.is-revealed .pkg-carousel { animation: none; }
}

/* Narrow: the arrows move down onto the dot row so the slides get full width. */
@media (max-width: 700px) {
  .pkg-carousel {
    grid-template-areas:
      'viewport viewport viewport'
      'prev     dots     next';
    gap: 1.1rem 0.75rem;
  }
}

/* ---------- Short viewport height adjustments ---------- */
@media (max-height: 820px) {
  .services-section { padding-top: 3rem; padding-bottom: 3rem; }
  .pkg-head { margin-bottom: 1.5rem; }
  .pkg-desc { font-size: 0.96rem; line-height: 1.65; }
}
/* A short screen still has room for the tall landscape card, just on slightly
   less padding than a full-height one. */
@media (min-width: 1201px) and (max-height: 820px) {
  .pkg-slide { padding: 4.35rem 2rem; }
}
</style>
