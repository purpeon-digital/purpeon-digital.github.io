<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import IconCheck from '~icons/fa7-solid/check';

interface Member {
  id: string;
  name: string;
  shortName: string;
  role: string;
  bio: string;
}

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

// Stock portraits — replace with real photos at /public/team/*.jpg when available
const PHOTOS: Record<string, string> = {
  dagfinn: '/team/dagfinn.webp',
  finn: '/team/fimmi.webp',
  kjell: '/team/kjell.webp',
  roger: '/team/roger.webp',
};

// Morph paths cycle through organic blobs as you scrub members. Each path is
// generated so every anchor has matching incoming/outgoing tangents — no
// pointy joins.
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BLOB_CX = 200;
const BLOB_CY = 200;
const BLOB_BASE_R = 160;
const BLOB_TENSION = 0.28; // Catmull-Rom → Bezier tension; higher = rounder curves

function makeBasePoints(seed: number, numPoints = 6, variance = 0.16): [number, number][] {
  const rand = mulberry32(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
    const r = BLOB_BASE_R * (1 + (rand() - 0.5) * 2 * variance);
    pts.push([BLOB_CX + r * Math.cos(angle), BLOB_CY + r * Math.sin(angle)]);
  }
  return pts;
}

function pointsToPath(pts: [number, number][]): string {
  const numPoints = pts.length;
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < numPoints; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % numPoints];
    const pPrev = pts[(i - 1 + numPoints) % numPoints];
    const pNext = pts[(i + 2) % numPoints];
    const c1x = p0[0] + BLOB_TENSION * (p1[0] - pPrev[0]);
    const c1y = p0[1] + BLOB_TENSION * (p1[1] - pPrev[1]);
    const c2x = p1[0] - BLOB_TENSION * (pNext[0] - p0[0]);
    const c2y = p1[1] - BLOB_TENSION * (pNext[1] - p0[1]);
    d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p1[0])},${f(p1[1])}`;
  }
  return d + ' Z';
}

// For each member-seed, pre-compute a small loop of variants that perturb
// each anchor's radius by a tiny per-point delta. Cycling through them
// makes the blob breathe in-place without leaving its silhouette family.
function makeBreathingVariants(seed: number, count = 4, breathAmp = 0.022): string[] {
  const base = makeBasePoints(seed);
  const breathRand = mulberry32(seed * 31 + 7);
  return Array.from({ length: count }, () => {
    const perturbed = base.map(([x, y]) => {
      const dx = x - BLOB_CX;
      const dy = y - BLOB_CY;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const off = (breathRand() - 0.5) * 2 * breathAmp * BLOB_BASE_R;
      const newR = r + off;
      return [BLOB_CX + newR * Math.cos(a), BLOB_CY + newR * Math.sin(a)] as [number, number];
    });
    return pointsToPath(perturbed);
  });
}

const BLOB_VARIANTS = [17, 42, 91, 128].map((s) => makeBreathingVariants(s));
const BREATH_COUNT = BLOB_VARIANTS[0].length;

const members = computed<Member[]>(() => {
  // Track locale for reactivity
  const _ = locale.value;
  return t('team.members') as Member[];
});

const activeIdx = ref(0);
const prevIdx = ref<number | null>(null);
const isMorphing = ref(false);
const breathStep = ref(0);
const autoplay = ref(true);
// Flipped by IntersectionObserver — lets us pause timers & CSS animations
// whenever the section is scrolled out of view, so decorative work never
// competes with scroll for frame budget.
const inView = ref(false);

const active = computed(() => members.value[activeIdx.value] ?? members.value[0]);
const currentPath = computed(
  () => BLOB_VARIANTS[activeIdx.value % BLOB_VARIANTS.length][breathStep.value % BREATH_COUNT],
);

// Only the currently-active and the outgoing (prev) photo need to be in the
// DOM. Clipping all four stacked images forced extra GPU layers and blew the
// compositor budget during scroll.
const visiblePhotos = computed(() => {
  const set = new Set<number>();
  set.add(activeIdx.value);
  if (prevIdx.value !== null) set.add(prevIdx.value);
  return set;
});

const sectionEl = ref<HTMLElement | null>(null);
const bioCardEl = ref<HTMLElement | null>(null);
let morphTimer: number | null = null;
let autoplayTimer: number | null = null;
let breathTimer: number | null = null;
let io: IntersectionObserver | null = null;
let heightAnim: Animation | null = null;

function go(i: number) {
  if (i === activeIdx.value) return;
  prevIdx.value = activeIdx.value;
  activeIdx.value = i;
  isMorphing.value = true;
  if (morphTimer) window.clearTimeout(morphTimer);
  morphTimer = window.setTimeout(() => {
    prevIdx.value = null;
    isMorphing.value = false;
  }, 620);
}

function goNext() {
  if (!members.value.length) return;
  go((activeIdx.value + 1) % members.value.length);
}

function pauseAutoplay() {
  autoplay.value = false;
}

function scheduleAutoplay() {
  if (autoplayTimer) window.clearInterval(autoplayTimer);
  if (!autoplay.value || !inView.value) return;
  autoplayTimer = window.setInterval(() => goNext(), 4800);
}

// Ambient "breathing" — only ticks while the section is on-screen and the
// visitor isn't in a reduced-motion preference. The path tween itself is
// handled in CSS via `transition: d`.
function scheduleBreathing() {
  if (breathTimer) window.clearInterval(breathTimer);
  if (!inView.value) return;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  breathTimer = window.setInterval(() => { breathStep.value += 1; }, 2600);
}

onMounted(() => {
  if (sectionEl.value && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        inView.value = entries[0]?.isIntersecting ?? false;
      },
      { rootMargin: '20% 0px', threshold: 0 },
    );
    io.observe(sectionEl.value);
  } else {
    inView.value = true;
  }
});

onBeforeUnmount(() => {
  if (autoplayTimer) window.clearInterval(autoplayTimer);
  if (breathTimer) window.clearInterval(breathTimer);
  if (morphTimer) window.clearTimeout(morphTimer);
  io?.disconnect();
});

watch([autoplay, activeIdx, inView], () => scheduleAutoplay());
watch(inView, () => scheduleBreathing());

// Tween the bio-card's height when the member swaps. `height: auto` doesn't
// participate in CSS transitions across content changes, so we measure
// before/after and animate the delta via Web Animations API.
watch(activeIdx, async () => {
  const el = bioCardEl.value;
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fromHeight = el.offsetHeight;
  await nextTick();
  const toHeight = el.offsetHeight;
  if (fromHeight === toHeight) return;
  heightAnim?.cancel();
  heightAnim = el.animate(
    [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
    { duration: 450, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)', fill: 'none' },
  );
});
</script>

<template>
  <section
    id="team"
    ref="sectionEl"
    class="team-section section-viewport streak-team px-8 py-24"
    :class="{ 'is-idle': !inView }"
  >
    <div class="team-wrap">
      <header class="team-head">
        <div>
          <span class="section-eyebrow team-eyebrow">
            <span class="section-eyebrow-dot" aria-hidden="true"></span>
            {{ t('team.eyebrow') }}
          </span>
          <h2 class="section-title team-title">
            {{ t('team.titleStart') }}
            <em>{{ t('team.titleEm') }}</em>
          </h2>
        </div>
        <p class="team-lede">{{ t('team.lede') }}</p>
      </header>

      <div class="stage">
        <!-- Left: morphing portrait. Clicking it locks the carousel so a
             visitor can read the bio without it sliding away. -->
        <div
          class="morph"
          :class="{ 'is-morphing': isMorphing, 'is-interactive': autoplay }"
          :role="autoplay ? 'button' : undefined"
          :tabindex="autoplay ? 0 : undefined"
          @click="pauseAutoplay"
        >
          <svg class="morph-svg" viewBox="0 0 400 400" aria-hidden="true">
            <defs>
              <linearGradient id="team-morph-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8b5cf6"/>
                <stop offset="55%" stop-color="#ec4899"/>
                <stop offset="100%" stop-color="#f472b6"/>
              </linearGradient>
              <!-- objectBoundingBox + scale(1/400) maps the 0-400 path coords
                   into the photo's 0-1 box, so the clip tracks the <img>'s
                   actual size at every breakpoint instead of sitting in a
                   fixed userSpaceOnUse rectangle. -->
              <clipPath id="team-morph-clip" clipPathUnits="objectBoundingBox">
                <path class="morph-clip-path" :d="currentPath" transform="scale(0.0025)"/>
              </clipPath>
            </defs>
            <path class="morph-shape" :d="currentPath"/>
          </svg>

          <!-- Orbit: gradient sweep + 3 traveling beads -->
          <svg class="orbit orbit-svg" viewBox="0 0 400 400" aria-hidden="true">
            <defs>
              <linearGradient id="team-orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ec4899" stop-opacity="0"/>
                <stop offset="40%" stop-color="#ec4899"/>
                <stop offset="70%" stop-color="#a78bfa"/>
                <stop offset="100%" stop-color="#f472b6" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <circle class="orbit-arc" cx="200" cy="200" r="196"/>
            <g class="orbit-bead b1"><circle cx="396" cy="200" r="5"/></g>
            <g class="orbit-bead b2"><circle cx="200" cy="4" r="3.5"/></g>
            <g class="orbit-bead b3"><circle cx="4" cy="200" r="4"/></g>
          </svg>

          <!-- Photo crossfade stack, clipped to morph shape.
               Only the active + outgoing image are in the DOM to keep the
               layer count low. -->
          <div class="photo-stack">
            <template v-for="(m, i) in members" :key="m.id">
              <img
                v-if="visiblePhotos.has(i)"
                :src="PHOTOS[m.id]"
                :alt="m.name"
                class="morph-photo"
                :class="{
                  'is-active': i === activeIdx,
                  'is-leaving': i === prevIdx,
                }"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </template>
          </div>
        </div>

        <!-- Right: bio + selector -->
        <div class="stage-right">
          <article ref="bioCardEl" class="bio-card" :class="{ 'is-swapping': isMorphing }">
            <div class="bio-content" :key="active.id">
              <div class="bio-role">{{ active.role }}</div>
              <h3 class="bio-name">{{ active.name }}</h3>
              <p class="bio-text">{{ active.bio }}</p>
            </div>
          </article>

          <div class="selector" :aria-label="t('nav.team')">
            <button
              v-for="(m, i) in members"
              :key="m.id"
              class="pick"
              :class="{ 'is-active': i === activeIdx }"
              :aria-pressed="i === activeIdx"
              type="button"
              @click="() => { pauseAutoplay(); go(i); }"
            >
              <span class="ring-indicator" aria-hidden="true">
                <IconCheck />
              </span>
              <div class="pick-avatar">
                <img :src="PHOTOS[m.id]" alt="" loading="lazy" decoding="async" draggable="false"/>
              </div>
              <div class="pick-name">{{ m.shortName }}</div>
              <div class="pick-role">{{ m.role }}</div>
            </button>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.team-section {
  color: var(--team-text-color);
}

.team-wrap {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* ---------- Headline ---------- */
.team-head {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3rem;
  align-items: end;
  margin-bottom: 3.5rem;
}
@media (max-width: 900px) {
  .team-head { grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 2.5rem; }
}

.team-eyebrow { color: var(--team-heading-color); }
.team-title { color: var(--team-heading-color); max-width: 14ch; margin-bottom: 0; }

.team-lede {
  font-size: clamp(1rem, 1.3vw, 1.15rem);
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-width: 46ch;
  text-wrap: pretty;
  margin: 0;
}
:global([data-theme="dark"] .team-lede) { color: rgba(255, 255, 255, 0.78); }

/* ---------- Stage ---------- */
.stage {
  display: grid;
  grid-template-columns: 520px 1fr;
  gap: 3rem;
  align-items: center;
}
@media (max-width: 1100px) {
  .stage { grid-template-columns: 420px 1fr; gap: 2rem; }
}
@media (max-width: 900px) {
  /* `minmax(0,1fr)` — without the `0` min, the pick strip's intrinsic width
     would force the column wider than the viewport. */
  .stage { grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
}

/* ---------- Morph portrait ---------- */
.morph {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  max-width: 520px;
  justify-self: start;
}
@media (max-width: 900px) {
  .morph { justify-self: center; max-width: 320px; }
}
@media (max-width: 480px) {
  .morph { max-width: 240px; }
}

.morph-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.morph-shape,
.morph-clip-path {
  /* Both the visible fill and the photo's clip share the same d, so they
     must tween together — otherwise the photo silhouette snaps while the
     pink shape breathes around it. */
  transition: d 1.6s cubic-bezier(0.45, 0.05, 0.35, 1);
}
.morph-shape {
  fill: url(#team-morph-grad);
}
/* Faked drop-shadow via a static sibling layer — painting a radial gradient
   behind the morph is dramatically cheaper than a full-tree drop-shadow
   filter pass that repaints every scroll frame. */
.morph::before {
  content: '';
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(124, 58, 237, 0.35), transparent 70%);
  transform: translateY(12%);
  pointer-events: none;
  z-index: -1;
}
:global([data-theme="dark"] .morph::before) {
  background: radial-gradient(closest-side, rgba(167, 139, 250, 0.4), transparent 70%);
}

.morph.is-morphing .morph-shape {
  animation: team-morph-pulse 0.6s ease;
}
@keyframes team-morph-pulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.04) rotate(2deg); }
  70% { transform: scale(0.98) rotate(-1deg); }
  100% { transform: scale(1); }
}

/* Orbit */
.orbit {
  position: absolute;
  inset: -6%;
  pointer-events: none;
}
.orbit-svg { width: 100%; height: 100%; overflow: visible; }

.orbit-arc {
  fill: none;
  stroke: url(#team-orbit-grad);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 180 900;
  transform-origin: 50% 50%;
  animation: team-orbit-sweep 9s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
}
@keyframes team-orbit-sweep {
  0% { transform: rotate(0deg); stroke-dasharray: 40 900; }
  50% { transform: rotate(180deg); stroke-dasharray: 240 900; }
  100% { transform: rotate(360deg); stroke-dasharray: 40 900; }
}

.orbit-bead {
  transform-origin: 50% 50%;
  animation: team-bead-spin linear infinite;
}
.orbit-bead.b1 { animation-duration: 18s; }
.orbit-bead.b2 { animation-duration: 26s; animation-direction: reverse; }
.orbit-bead.b3 { animation-duration: 34s; }
.orbit-bead.b1 circle { fill: #ec4899; }
.orbit-bead.b2 circle { fill: #a78bfa; }
.orbit-bead.b3 circle { fill: #f472b6; }
@keyframes team-bead-spin { to { transform: rotate(360deg); } }

.morph.is-morphing .orbit-arc {
  animation: team-orbit-burst 0.7s ease-out;
}
@keyframes team-orbit-burst {
  0% { stroke-dasharray: 40 900; opacity: 1; }
  50% { stroke-dasharray: 600 900; opacity: 0.6; stroke-width: 5; }
  100% { stroke-dasharray: 40 900; opacity: 1; stroke-width: 3; }
}

/* Photo stack */
.photo-stack {
  position: absolute;
  inset: 0;
}
.morph-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  clip-path: url(#team-morph-clip);
  object-fit: cover;
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 0.55s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}
/* Use a keyframe (not a transition) for the entrance, because the incoming
   photo is mounted in the same tick that `is-active` is applied — a CSS
   transition wouldn't fire on the very first frame, so going to a later
   slide popped in over the outgoing fade. */
.morph-photo.is-active {
  opacity: 1;
  transform: scale(1);
  animation: photo-enter 0.55s ease both;
}
.morph-photo.is-leaving {
  opacity: 0;
  transform: scale(0.96);
}
@keyframes photo-enter {
  from { opacity: 0; transform: scale(1.08); }
  to   { opacity: 1; transform: scale(1); }
}

/* Interactive portrait: subtle affordance — only while autoplay is running. */
.morph.is-interactive { cursor: pointer; }
.morph.is-interactive:focus-visible {
  outline: 2px solid rgba(236, 72, 153, 0.7);
  outline-offset: 6px;
  border-radius: 50%;
}

/* ---------- Right column ---------- */
.stage-right {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.bio-card {
  background: var(--team-card-bg);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid var(--team-card-border);
  border-radius: 20px;
  padding: 2rem 2rem 1.75rem;
  position: relative;
  overflow: hidden;
}
.bio-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, #ec4899, #a78bfa);
  opacity: 0.6;
}
.bio-name {
  font-size: clamp(1.4rem, 2.2vw, 1.8rem);
  font-weight: 700;
  color: var(--team-heading-color);
  letter-spacing: -0.01em;
  line-height: 1.15;
  margin: 0 0 0.35rem;
}
.bio-role {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-accent-primary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  opacity: 0.85;
}
:global([data-theme="dark"] .bio-role) { color: #d8c6ff; }

.bio-text {
  font-size: 1.02rem;
  line-height: 1.75;
  color: var(--team-text-color);
  text-wrap: pretty;
  margin: 0;
}
:global([data-theme="dark"] .bio-text) { color: rgba(255, 255, 255, 0.86); }

.bio-card.is-swapping .bio-content {
  animation: team-bio-swap 0.6s ease;
}
@keyframes team-bio-swap {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Selector — 4-up grid that collapses to a full-width 2×2 on phones.
   (Was a horizontal swipe strip, but the fixed-width cards cropped at the
   viewport edges and could leave the active member half-off-screen.) */
.selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
}
@media (max-width: 640px) {
  .selector {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}
@media (max-width: 480px) {
  .pick-avatar { margin-bottom: 0.5rem; }
}

.pick {
  position: relative;
  z-index: 2;
  background: var(--team-card-bg);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid var(--team-card-border);
  border-radius: 16px;
  padding: 0.85rem;
  cursor: pointer;
  text-align: left;
  color: var(--team-text-color);
  overflow: hidden;
  font: inherit;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              background 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}
.pick:hover {
  transform: translateY(-4px);
  background: var(--team-card-hover);
  box-shadow: 0 12px 32px rgba(76, 29, 149, 0.22);
  border-color: rgba(167, 139, 250, 0.5);
}
.pick:focus-visible {
  outline: 2px solid rgba(236, 72, 153, 0.7);
  outline-offset: 3px;
}
.pick.is-active {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(236, 72, 153, 0.15));
  border-color: rgba(236, 72, 153, 0.55);
  box-shadow: 0 14px 36px rgba(124, 58, 237, 0.28);
}

.pick-avatar {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 0.7rem;
  background: #2a1145;
}
.pick-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.9);
  transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.4s ease;
}
.pick:hover .pick-avatar img {
  transform: scale(1.08);
  filter: saturate(1.1);
}
.pick.is-active .pick-avatar img { filter: saturate(1.15); }
.pick-avatar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(26, 10, 40, 0.55));
  pointer-events: none;
}

.pick-name {
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--team-heading-color);
  letter-spacing: -0.005em;
}
.pick-role {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
:global([data-theme="dark"] .pick-role) { color: rgba(255, 255, 255, 0.55); }

.ring-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  color: #fff;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
}
.pick.is-active .ring-indicator {
  opacity: 1;
  transform: scale(1);
}
.ring-indicator :deep(svg) {
  width: 12px;
  height: 12px;
}

/* When the section is off-screen, kill every ambient animation so the
   compositor only works on the real scroll. This is what gives us back
   the frame budget scroll-side. */
.team-section.is-idle .orbit-arc,
.team-section.is-idle .orbit-bead,
.team-section.is-idle .section-eyebrow-dot {
  animation: none !important;
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .orbit-arc,
  .orbit-bead,
  .section-eyebrow-dot,
  .morph.is-morphing .morph-shape,
  .morph.is-morphing .orbit-arc,
  .bio-card.is-swapping .bio-content {
    animation: none !important;
  }
  .morph-shape,
  .morph-clip-path {
    transition: none;
  }
  .morph-photo {
    transition: opacity 0.2s ease;
    transform: none !important;
    animation: none !important;
  }
}

/* ---------- Short viewport height adjustments ---------- */
@media (max-height: 800px) {
  .team-section { padding: 4rem 2rem; }
  .team-head { margin-bottom: 2rem; }
  .stage { gap: 2rem; }
}
@media (max-height: 650px) {
  .team-section { padding: 3rem 2rem; }
}
</style>
