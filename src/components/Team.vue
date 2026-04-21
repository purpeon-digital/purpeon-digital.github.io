<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import IconMapPin from '~icons/fa7-solid/map-location-dot';
import IconClock from '~icons/fa7-solid/clock';
import IconCode from '~icons/fa7-solid/code';
import IconChevronLeft from '~icons/fa7-solid/chevron-left';
import IconChevronRight from '~icons/fa7-solid/chevron-right';
import IconPlay from '~icons/fa7-solid/play';
import IconPause from '~icons/fa7-solid/pause';
import IconCheck from '~icons/fa7-solid/check';

interface Member {
  id: string;
  name: string;
  shortName: string;
  role: string;
  bio: string;
  tags: string[];
}

const props = defineProps<{
  locale: Locale;
}>();

const { t, locale } = useI18n(props.locale);

// Stock portraits — replace with real photos at /public/team/*.jpg when available
const PHOTOS: Record<string, string> = {
  dagfinn: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=800&fit=crop&crop=faces',
  finn: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&h=800&fit=crop&crop=faces',
  kjell: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop&crop=faces',
  roger: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=800&fit=crop&crop=faces',
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

function makeSmoothBlob(seed: number, numPoints = 6, variance = 0.16): string {
  const cx = 200;
  const cy = 200;
  const baseR = 160;
  const tension = 0.28; // Catmull-Rom → Bezier tension; higher = rounder curves
  const rand = mulberry32(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
    const r = baseR * (1 + (rand() - 0.5) * 2 * variance);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < numPoints; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % numPoints];
    const pPrev = pts[(i - 1 + numPoints) % numPoints];
    const pNext = pts[(i + 2) % numPoints];
    const c1x = p0[0] + tension * (p1[0] - pPrev[0]);
    const c1y = p0[1] + tension * (p1[1] - pPrev[1]);
    const c2x = p1[0] - tension * (pNext[0] - p0[0]);
    const c2y = p1[1] - tension * (pNext[1] - p0[1]);
    d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p1[0])},${f(p1[1])}`;
  }
  return d + ' Z';
}

const BLOB_PATHS = [17, 42, 91, 128].map((s) => makeSmoothBlob(s));

const members = computed<Member[]>(() => {
  // Track locale for reactivity
  const _ = locale.value;
  return t('team.members') as Member[];
});

const activeIdx = ref(0);
const prevIdx = ref<number | null>(null);
const isMorphing = ref(false);
const shapeStep = ref(0);
const autoplay = ref(true);
// Flipped by IntersectionObserver — lets us pause timers & CSS animations
// whenever the section is scrolled out of view, so decorative work never
// competes with scroll for frame budget.
const inView = ref(false);

const active = computed(() => members.value[activeIdx.value] ?? members.value[0]);
const currentPath = computed(() => BLOB_PATHS[shapeStep.value % BLOB_PATHS.length]);

const yearsChip = computed(() => Math.max(8, 13 - activeIdx.value));

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
let morphTimer: number | null = null;
let autoplayTimer: number | null = null;
let io: IntersectionObserver | null = null;

function go(i: number) {
  if (i === activeIdx.value) return;
  prevIdx.value = activeIdx.value;
  activeIdx.value = i;
  isMorphing.value = true;
  shapeStep.value += 1;
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
function goPrev() {
  if (!members.value.length) return;
  go((activeIdx.value - 1 + members.value.length) % members.value.length);
}

function pauseAutoplay() {
  autoplay.value = false;
}
function toggleAutoplay() {
  autoplay.value = !autoplay.value;
}

function onKey(e: KeyboardEvent) {
  // Ignore keys when the section isn't on screen — otherwise arrow keys
  // would steal scroll.
  if (!inView.value) return;
  const el = e.target as HTMLElement | null;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
  if (e.key === 'ArrowRight') { goNext(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { goPrev(); e.preventDefault(); }
  else if (e.key === ' ') { toggleAutoplay(); e.preventDefault(); }
}

function scheduleAutoplay() {
  if (autoplayTimer) window.clearInterval(autoplayTimer);
  if (!autoplay.value || !inView.value) return;
  autoplayTimer = window.setInterval(() => goNext(), 3800);
}

onMounted(() => {
  window.addEventListener('keydown', onKey);
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
  window.removeEventListener('keydown', onKey);
  if (autoplayTimer) window.clearInterval(autoplayTimer);
  if (morphTimer) window.clearTimeout(morphTimer);
  io?.disconnect();
});

watch([autoplay, activeIdx, inView], () => scheduleAutoplay());
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
        <!-- Left: morphing portrait -->
        <div class="morph" :class="{ 'is-morphing': isMorphing }">
          <svg class="morph-svg" viewBox="0 0 400 400" aria-hidden="true">
            <defs>
              <linearGradient id="team-morph-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8b5cf6"/>
                <stop offset="55%" stop-color="#ec4899"/>
                <stop offset="100%" stop-color="#f472b6"/>
              </linearGradient>
              <clipPath id="team-morph-clip">
                <path :d="currentPath"/>
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
                :loading="i === 0 ? 'eager' : 'lazy'"
                draggable="false"
              />
            </template>
          </div>

          <!-- Floating chips -->
          <div class="float-chip top-right">
            <IconMapPin />
            <span>Førde</span>
          </div>
          <div class="float-chip mid-right">
            <IconClock />
            <span>{{ yearsChip }}{{ t('team.chipExperience') }}</span>
          </div>
          <div class="float-chip bot-left">
            <IconCode />
            <span>{{ active.tags[0] }}</span>
          </div>

          <!-- Name plate -->
          <div class="name-plate" aria-live="polite">
            <span class="dot" aria-hidden="true"></span>
            <div>
              <div class="name">{{ active.shortName }}</div>
              <div class="role">{{ active.role }}</div>
            </div>
          </div>
        </div>

        <!-- Right: bio + selector -->
        <div class="stage-right">
          <article class="bio-card" :class="{ 'is-swapping': isMorphing }">
            <div class="bio-content" :key="active.id">
              <div class="bio-role">{{ active.role }}</div>
              <h3 class="bio-name">{{ active.name }}</h3>
              <p class="bio-text">{{ active.bio }}</p>
              <div class="bio-tags">
                <span v-for="tag in active.tags" :key="tag" class="bio-tag">{{ tag }}</span>
              </div>
            </div>
          </article>

          <div class="selector" role="tablist" :aria-label="t('nav.team')">
            <button
              v-for="(m, i) in members"
              :key="m.id"
              class="pick"
              :class="{ 'is-active': i === activeIdx }"
              :aria-selected="i === activeIdx"
              role="tab"
              type="button"
              @click="() => { pauseAutoplay(); go(i); }"
              @mouseenter="() => { if (!autoplay) go(i); }"
            >
              <span class="ring-indicator" aria-hidden="true">
                <IconCheck />
              </span>
              <div class="pick-avatar">
                <img :src="PHOTOS[m.id]" alt="" loading="lazy" draggable="false"/>
              </div>
              <div class="pick-name">{{ m.shortName }}</div>
              <div class="pick-role">{{ m.role }}</div>
            </button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <div class="hint">
          {{ t('team.hintLabel') }}
          <span class="kbd">←</span>
          <span class="kbd">→</span>
          {{ t('team.hintSwap') }}
          <span class="kbd">Space</span>
          {{ t('team.hintAutoplay') }}
        </div>
        <div class="toolbar-actions">
          <button
            class="ctrl"
            type="button"
            :aria-label="t('team.controls.prev')"
            :title="t('team.controls.prev')"
            @click="() => { pauseAutoplay(); goPrev(); }"
          >
            <IconChevronLeft />
          </button>
          <button
            class="ctrl"
            type="button"
            :aria-label="autoplay ? t('team.controls.pause') : t('team.controls.play')"
            :title="autoplay ? t('team.controls.pause') : t('team.controls.play')"
            @click="toggleAutoplay"
          >
            <IconPause v-if="autoplay" />
            <IconPlay v-else />
          </button>
          <button
            class="ctrl"
            type="button"
            :aria-label="t('team.controls.next')"
            :title="t('team.controls.next')"
            @click="() => { pauseAutoplay(); goNext(); }"
          >
            <IconChevronRight />
          </button>
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
:global([data-theme="dark"]) .team-lede { color: rgba(255, 255, 255, 0.78); }

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
.morph-shape {
  fill: url(#team-morph-grad);
  transition: d 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
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
:global([data-theme="dark"]) .morph::before {
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
.morph-photo.is-active {
  opacity: 1;
  transform: scale(1);
}
.morph-photo.is-leaving {
  opacity: 0;
  transform: scale(0.96);
}

/* Float chips */
.float-chip {
  position: absolute;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(107, 70, 193, 0.25);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-accent-primary);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  box-shadow: 0 8px 24px rgba(76, 29, 149, 0.18);
  white-space: nowrap;
}
:global([data-theme="dark"]) .float-chip {
  background: rgba(26, 15, 46, 0.8);
  border-color: rgba(167, 139, 250, 0.3);
  color: #c3b0ff;
}
.float-chip :deep(svg) { width: 12px; height: 12px; }

.float-chip.top-right { top: 8%; right: -6%; animation: team-chip-float1 6s ease-in-out infinite; }
.float-chip.mid-right { top: 45%; right: -12%; animation: team-chip-float2 7s ease-in-out infinite; }
.float-chip.bot-left  { bottom: 12%; left: -10%; animation: team-chip-float3 8s ease-in-out infinite; }

@keyframes team-chip-float1 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes team-chip-float2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(14px); } }
@keyframes team-chip-float3 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

/* Mobile: chips crowd the shrunken portrait and add layers we don't need. */
@media (max-width: 900px) {
  .float-chip { display: none; }
}

/* Name plate */
.name-plate {
  position: absolute;
  left: -12px;
  bottom: -8px;
  background: var(--team-card-bg);
  backdrop-filter: blur(14px);
  border: 1px solid var(--team-card-border);
  border-radius: 18px;
  padding: 0.85rem 1.15rem;
  box-shadow: 0 14px 40px rgba(76, 29, 149, 0.25);
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 260px;
}
:global([data-theme="dark"]) .name-plate {
  background: rgba(30, 10, 55, 0.65);
  border-color: rgba(167, 139, 250, 0.25);
}
.name-plate .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #a78bfa);
  box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.18);
  flex-shrink: 0;
}
.name-plate .name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--team-heading-color);
  letter-spacing: -0.005em;
  line-height: 1.2;
}
.name-plate .role {
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
:global([data-theme="dark"]) .name-plate .role { color: rgba(255, 255, 255, 0.6); }

/* Mobile: unpin the name plate and let it flow below the portrait as a
   centered band. Floating corner placement looks cramped at small widths. */
@media (max-width: 900px) {
  .morph { padding-bottom: 4.5rem; }
  .name-plate {
    position: absolute;
    left: 50%;
    right: auto;
    bottom: 0;
    transform: translateX(-50%);
    min-width: 0;
    max-width: 100%;
    width: max-content;
    padding: 0.7rem 1rem;
  }
}

/* ---------- Right column ---------- */
.stage-right {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.bio-card {
  background: var(--team-card-bg);
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
:global([data-theme="dark"]) .bio-role { color: #d8c6ff; }

.bio-text {
  font-size: 1.02rem;
  line-height: 1.75;
  color: var(--team-text-color);
  text-wrap: pretty;
  margin: 0;
}
:global([data-theme="dark"]) .bio-text { color: rgba(255, 255, 255, 0.86); }

.bio-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.1rem;
}
.bio-tag {
  font-size: 0.78rem;
  font-weight: 500;
  padding: 0.35rem 0.7rem;
  background: rgba(167, 139, 250, 0.18);
  color: var(--color-accent-primary);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 999px;
}
:global([data-theme="dark"]) .bio-tag {
  color: #e5d7ff;
  background: rgba(167, 139, 250, 0.15);
  border-color: rgba(167, 139, 250, 0.25);
}

.bio-card.is-swapping .bio-content {
  animation: team-bio-swap 0.6s ease;
}
@keyframes team-bio-swap {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Selector — 4-up grid on desktop, horizontal swipe strip on small screens. */
.selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
}
@media (max-width: 900px) {
  .selector {
    display: flex;
    grid-template-columns: none;
    gap: 0.75rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    padding: 0.25rem 0.25rem 0.75rem;
    scrollbar-width: none;
  }
  .selector::-webkit-scrollbar { display: none; }

  .pick {
    flex: 0 0 auto;
    width: 150px;
    scroll-snap-align: center;
  }
}
@media (max-width: 480px) {
  .pick { width: 140px; }
  .pick-avatar { margin-bottom: 0.5rem; }
}

.pick {
  position: relative;
  z-index: 2;
  /* Opaque-enough translucent bg; avoids expensive backdrop-filter per card. */
  background: var(--team-card-bg);
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
:global([data-theme="dark"]) .pick-role { color: rgba(255, 255, 255, 0.55); }

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

/* ---------- Toolbar ---------- */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(167, 139, 250, 0.2);
  gap: 1rem;
  flex-wrap: wrap;
}
.hint {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}
:global([data-theme="dark"]) .hint { color: rgba(255, 255, 255, 0.6); }

.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 0.4rem;
  border-radius: 6px;
  background: rgba(107, 70, 193, 0.15);
  border: 1px solid rgba(107, 70, 193, 0.3);
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 0.72rem;
  color: var(--color-accent-primary);
}
:global([data-theme="dark"]) .kbd {
  background: rgba(157, 111, 255, 0.15);
  border-color: rgba(157, 111, 255, 0.3);
  color: #c3b0ff;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.ctrl {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(167, 139, 250, 0.12);
  border: 1px solid rgba(167, 139, 250, 0.3);
  color: var(--color-accent-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.15s ease;
}
.ctrl:hover {
  background: rgba(167, 139, 250, 0.22);
  transform: translateY(-1px);
}
.ctrl:focus-visible {
  outline: 2px solid rgba(236, 72, 153, 0.7);
  outline-offset: 2px;
}
:global([data-theme="dark"]) .ctrl { color: #c3b0ff; }
.ctrl :deep(svg) { width: 16px; height: 16px; }

/* When the section is off-screen, kill every ambient animation so the
   compositor only works on the real scroll. This is what gives us back
   the frame budget scroll-side. */
.team-section.is-idle .orbit-arc,
.team-section.is-idle .orbit-bead,
.team-section.is-idle .section-eyebrow-dot,
.team-section.is-idle .float-chip.top-right,
.team-section.is-idle .float-chip.mid-right,
.team-section.is-idle .float-chip.bot-left {
  animation: none !important;
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .orbit-arc,
  .orbit-bead,
  .section-eyebrow-dot,
  .float-chip.top-right,
  .float-chip.mid-right,
  .float-chip.bot-left,
  .morph.is-morphing .morph-shape,
  .morph.is-morphing .orbit-arc,
  .bio-card.is-swapping .bio-content {
    animation: none !important;
  }
  .morph-photo {
    transition: opacity 0.2s ease;
    transform: none !important;
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
