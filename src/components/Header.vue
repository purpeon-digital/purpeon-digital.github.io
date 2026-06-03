<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import LanguagePicker from './LanguagePicker.vue';
import ThemeToggle from './ThemeToggle.vue';
import IconBriefcase from '~icons/fa7-solid/briefcase';
import IconUsers from '~icons/fa7-solid/users';
import IconCircleInfo from '~icons/fa7-solid/circle-info';
import IconPaperPlane from '~icons/fa7-solid/paper-plane';
import IconChevronRight from '~icons/fa7-solid/chevron-right';

const props = defineProps<{
  locale: Locale;
}>();

const { t } = useI18n(props.locale);
const mobileMenuOpen = ref(false);
const isMobile = ref(false);

function openMobileMenu() {
  mobileMenuOpen.value = true;
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
  document.body.style.overflow = '';
}

function toggleMobileMenu() {
  mobileMenuOpen.value ? closeMobileMenu() : openMobileMenu();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && mobileMenuOpen.value) {
    closeMobileMenu();
  }
}

let themeObserver: MutationObserver | null = null;
let mobileMq: MediaQueryList | null = null;
const updateIsMobile = (e: MediaQueryListEvent | MediaQueryList) => {
  isMobile.value = e.matches;
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  themeObserver = new MutationObserver(() => {
    if (mobileMenuOpen.value) closeMobileMenu();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  mobileMq = window.matchMedia('(max-width: 768px)');
  isMobile.value = mobileMq.matches;
  mobileMq.addEventListener('change', updateIsMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  themeObserver?.disconnect();
  mobileMq?.removeEventListener('change', updateIsMobile);
  document.body.style.overflow = '';
});

function scrollToSection(e: Event, href: string) {
  e.preventDefault();

  // Close mobile menu if open
  if (mobileMenuOpen.value) {
    closeMobileMenu();
  }

  // Handle scrolling to top for home/logo
  if (href === '#' || href === '#top') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    return;
  }

  const target = document.querySelector(href);
  if (target) {
    const headerOffset = 80;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}
</script>

<template>
  <header class="header-bar">
    <nav class="max-w-[1400px] mx-auto px-8 flex justify-between items-center w-full h-full max-md:px-4 max-md:h-auto max-md:min-h-[52px]">
      <a href="#" class="logo" @click.prevent="scrollToSection($event, '#')">
        <span class="logo-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.29 32.29" fill="#c040c0" class="h-full w-full">
            <g transform="translate(-113.21 -142)">
              <path d="m114.89 142 .7 1.1h1c.8 0 1.2 0 2.4.8l2.39 1q1 0 .5.5-.81.9-3 .7-1.3-.1-1 .2l1.8.6 2.3.8q1.7.8 4.99 5.2c2.3 3 4.19 4.7 6.89 5.5q1.8.6 2.4 2.2.69 1.7-.6 4c-.6 1.3-.6 1.5-.6 4.2 0 2.4-.1 2.9-.5 3.6a3 3 0 0 1-1.9 1.8c-1.3.4-4-.5-5.7-1.9-.6-.4-1-.5-2.19-.5q-4.1 0-4-3.8c0-3-.5-4.7-2.99-9.1-2.3-4.3-2.7-6.1-2.2-8.8l.2-1.9v-.9l-.4 1.2c-.6 2-2.59 4-2.09 2v-2.4q0-2.7.7-3.6c.2-.3.2-.5-.4-1.6m19.07 29.7q1.2-.81 1-4.5l-.1-2.3.7-1.3q1.8-3.6-.4-4.5c-1-.4-3.4-.4-4.7 0-2.6.8-4.99 2.8-6.19 5-.7 1.5-1 3.5-.6 4.3q.7 1.1 2.8 1c1 0 1.2 0 2.7 1l1.7 1 1 .3c1.39.4 1.59.4 2.09 0"/>
              <circle cx="124.71" cy="167.13" r="1.1"/>
              <circle cx="128.21" cy="163.23" r="1.1"/>
              <circle cx="128.51" cy="166.93" r=".6"/>
              <circle cx="131.8" cy="162.03" r=".6"/>
              <ellipse cx="131.61" cy="165.33" rx=".7" ry=".8"/>
              <circle cx="130.61" cy="169.93" r=".8"/>
            </g>
          </svg>
        </span>
        <span class="logo-text">Purpeon <span class="font-normal opacity-85">Digital</span></span>
      </a>

      <button
        class="hamburger hidden max-md:flex"
        @click="toggleMobileMenu"
        :class="{ open: mobileMenuOpen }"
        :aria-expanded="mobileMenuOpen"
        aria-controls="mobile-nav"
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div id="mobile-nav" class="nav-right" :class="{ 'mobile-open': mobileMenuOpen }" :inert="(isMobile && !mobileMenuOpen) || null">
        <span class="nav-accent" aria-hidden="true"></span>
        <ul class="nav-links">
          <li>
            <a href="#services" @click="(e) => scrollToSection(e, '#services')">
              <span class="nav-link-icon"><IconBriefcase /></span>
              <span class="nav-link-label">{{ t('nav.services') }}</span>
              <IconChevronRight class="nav-link-chevron" />
            </a>
          </li>
          <li>
            <a href="#team" @click="(e) => scrollToSection(e, '#team')">
              <span class="nav-link-icon"><IconUsers /></span>
              <span class="nav-link-label">{{ t('nav.team') }}</span>
              <IconChevronRight class="nav-link-chevron" />
            </a>
          </li>
          <li>
            <a href="#about" @click="(e) => scrollToSection(e, '#about')">
              <span class="nav-link-icon"><IconCircleInfo /></span>
              <span class="nav-link-label">{{ t('nav.about') }}</span>
              <IconChevronRight class="nav-link-chevron" />
            </a>
          </li>
          <li>
            <a href="#contact" @click="(e) => scrollToSection(e, '#contact')">
              <span class="nav-link-icon"><IconPaperPlane /></span>
              <span class="nav-link-label">{{ t('nav.contact') }}</span>
              <IconChevronRight class="nav-link-chevron" />
            </a>
          </li>
        </ul>
        <div class="nav-controls">
          <div class="nav-control">
            <LanguagePicker :locale="props.locale" />
          </div>
          <div class="nav-control">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  </header>

  <Transition name="backdrop">
    <div
      v-if="mobileMenuOpen"
      class="mobile-backdrop"
      @click="closeMobileMenu"
      @touchmove.prevent
      aria-hidden="true"
    ></div>
  </Transition>
</template>

<style scoped>
/* Header bar */
.header-bar {
  background: var(--header-bg);
  color: white;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 56px;
  z-index: 100;
  box-shadow: 0 2px 20px var(--color-shadow);
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .header-bar {
    height: 52px;
  }
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: white;
}

@media (max-width: 768px) {
  .logo {
    gap: 0.5rem;
  }
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  transition: all 0.3s ease;
  filter: drop-shadow(0 1px 6px rgba(0, 0, 0, 0.35));
}

@media (max-width: 768px) {
  .logo-icon {
    width: 32px;
    height: 32px;
  }
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.3px;
}

@media (max-width: 768px) {
  .logo-text {
    font-size: 1.1rem;
  }
}

/* Navigation right side */
.nav-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 0.25rem;
}

.nav-links a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  position: relative;
  font-size: 0.925rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
}

.nav-links a:hover {
  color: white;
  background: rgba(255, 255, 255, 0.12);
}

/* Desktop: chevron is a mobile affordance, hide it */
@media (min-width: 769px) {
  .nav-link-chevron {
    display: none;
  }
}

/* Desktop: inline icon next to label, no chip styling */
.nav-link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 0.95em;
}

.nav-link-icon svg {
  width: 1em;
  height: 1em;
  display: block;
}

/* Desktop: align LanguagePicker / ThemeToggle icons with header text */
.nav-controls :deep(button) {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

/* Sized via parent button > span > svg to avoid matching ThemeToggle's
   own SVG (which carries its own `.theme-toggle__classic` styles). */
.nav-controls :deep(button > span > svg) {
  font-size: 1.35rem;
  display: block;
  line-height: 1;
}

.nav-controls :deep(.theme-toggle__classic) {
  display: block;
}

.nav-link-label {
  position: relative;
}

.nav-link-label::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.8);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.25s ease;
  border-radius: 1px;
}

.nav-links a:hover .nav-link-label::after {
  transform: scaleX(1);
}

/* Nav Controls */
.nav-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
}

/* Hamburger Menu */
.hamburger {
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  z-index: 1001;
  border-radius: 8px;
  outline: none;
  transition: background 0.2s ease;
}

.hamburger:focus {
  outline: none;
}

.hamburger:focus-visible {
  outline: 2px solid rgba(167, 139, 250, 0.7);
  outline-offset: 2px;
}

.hamburger:active {
  background: rgba(255, 255, 255, 0.08);
}

.hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: white;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger.open span:nth-child(1) {
  transform: rotate(45deg) translateY(9px);
}

.hamburger.open span:nth-child(2) {
  opacity: 0;
}

.hamburger.open span:nth-child(3) {
  transform: rotate(-45deg) translateY(-9px);
}

/* Decorative accent — hidden on desktop */
.nav-accent {
  display: none;
}

/* Mobile nav drawer */
@media (max-width: 768px) {
  .nav-right {
    position: fixed;
    top: 52px;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 0;
    background:
      radial-gradient(140% 60% at 50% 0%, rgba(236, 72, 153, 0.18), transparent 60%),
      radial-gradient(120% 80% at 100% 100%, rgba(124, 58, 237, 0.22), transparent 65%),
      var(--header-bg);
    flex-direction: column;
    padding: 0 1.25rem;
    gap: 1.75rem;
    overflow: hidden;
    overscroll-behavior: contain;
    pointer-events: none;
    transition:
      max-height 0.45s cubic-bezier(0.32, 0.72, 0, 1),
      padding 0.45s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 2;
  }

  .nav-right.mobile-open {
    max-height: calc(100vh - 52px);
    padding: 1.5rem 1.25rem 2rem;
    overflow-x: hidden;
    overflow-y: auto;
    pointer-events: auto;
  }

  /* Decorative top shimmer */
  .nav-accent {
    display: block;
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(236, 72, 153, 0.5) 30%,
      rgba(167, 139, 250, 0.7) 50%,
      rgba(236, 72, 153, 0.5) 70%,
      transparent 100%
    );
    opacity: 0;
    transition: opacity 0.5s ease 0.15s;
    pointer-events: none;
  }

  .nav-right.mobile-open .nav-accent {
    opacity: 1;
  }

  .nav-accent::after {
    content: '';
    position: absolute;
    inset: -8px 0;
    background: inherit;
    filter: blur(10px);
    opacity: 0.7;
  }

  .nav-links {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .nav-links li {
    width: 100%;
    opacity: 0;
    transform: translateY(-10px);
    transition:
      opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .nav-right.mobile-open .nav-links li {
    opacity: 1;
    transform: translateY(0);
  }

  .nav-right.mobile-open .nav-links li:nth-child(1) { transition-delay: 0.12s; }
  .nav-right.mobile-open .nav-links li:nth-child(2) { transition-delay: 0.18s; }
  .nav-right.mobile-open .nav-links li:nth-child(3) { transition-delay: 0.24s; }
  .nav-right.mobile-open .nav-links li:nth-child(4) { transition-delay: 0.30s; }

  .nav-links a {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.9rem 1rem;
    font-size: 1.05rem;
    font-weight: 500;
    letter-spacing: 0.005em;
    text-align: left;
    border-radius: 14px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.06) 0%,
      rgba(255, 255, 255, 0.02) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 1px 2px rgba(0, 0, 0, 0.15);
    transition:
      background 0.25s ease,
      border-color 0.25s ease,
      transform 0.15s ease;
  }

  .nav-link-label::after {
    display: none;
  }

  .nav-links a:hover,
  .nav-links a:active {
    background: linear-gradient(
      135deg,
      rgba(167, 139, 250, 0.22) 0%,
      rgba(124, 58, 237, 0.12) 100%
    );
    border-color: rgba(167, 139, 250, 0.35);
    transform: translateX(2px);
  }

  .nav-links a:active .nav-link-chevron {
    transform: translateX(3px);
  }

  .nav-link-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 11px;
    background: linear-gradient(
      135deg,
      rgba(167, 139, 250, 0.35) 0%,
      rgba(236, 72, 153, 0.25) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 2px 8px rgba(124, 58, 237, 0.25);
    color: #fff;
    font-size: 1rem;
  }

  .nav-link-icon svg {
    width: 1em;
    height: 1em;
  }

  .nav-link-label {
    flex: 1;
  }

  .nav-link-chevron {
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.8rem;
    transition: transform 0.25s ease, color 0.25s ease;
  }

  .nav-links a:hover .nav-link-chevron,
  .nav-links a:active .nav-link-chevron {
    color: rgba(255, 255, 255, 0.9);
  }

  .nav-controls {
    padding: 0;
    border-left: none;
    border: none;
    background: none;
    gap: 0.625rem;
    width: 100%;
    margin-top: 0.75rem;
    align-items: stretch;
    justify-content: stretch;
    opacity: 0;
    transform: translateY(-10px);
    transition:
      opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .nav-right.mobile-open .nav-controls {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0.3s;
  }

  .nav-control {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    padding: 0;
    border-radius: 14px;
    background: linear-gradient(
      135deg,
      rgba(167, 139, 250, 0.14) 0%,
      rgba(124, 58, 237, 0.06) 100%
    );
    border: 1px solid rgba(167, 139, 250, 0.22);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 4px 14px rgba(124, 58, 237, 0.18);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition:
      background 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.15s ease;
  }

  .nav-control::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(236, 72, 153, 0.35) 0%,
      rgba(167, 139, 250, 0.3) 50%,
      transparent 100%
    );
    -webkit-mask:
      linear-gradient(#000, #000) content-box,
      linear-gradient(#000, #000);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
  }

  .nav-control:hover,
  .nav-control:has(button:hover),
  .nav-control:has(button:active) {
    background: linear-gradient(
      135deg,
      rgba(236, 72, 153, 0.22) 0%,
      rgba(124, 58, 237, 0.14) 100%
    );
    border-color: rgba(236, 72, 153, 0.35);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 6px 20px rgba(236, 72, 153, 0.25);
  }

  .nav-control:has(button:hover)::before,
  .nav-control:has(button:active)::before {
    opacity: 1;
  }

  .nav-control:has(button:active) {
    transform: scale(0.97);
  }

  /* LanguagePicker wrapper: stretch it to fill the card */
  .nav-control :deep(.relative) {
    align-self: stretch;
    width: 100%;
    display: flex;
  }

  /* Button fills the entire card — no dead-zone clicks */
  .nav-control :deep(button) {
    align-self: stretch;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.55rem 0.85rem;
    gap: 0.5rem;
  }

  .nav-control :deep(button > span > svg) {
    font-size: 1.5rem;
  }

  .nav-control :deep(.theme-toggle__classic) {
    width: 1.5rem;
    height: 1.5rem;
  }

  /* Hide drawer scrollbar */
  .nav-right::-webkit-scrollbar {
    display: none;
  }

  .nav-right {
    scrollbar-width: none;
  }
}

/* Backdrop — blurs page, blocks clicks, tap-to-close */
.mobile-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(10, 10, 20, 0.35);
  backdrop-filter: blur(14px) saturate(130%);
  -webkit-backdrop-filter: blur(14px) saturate(130%);
  touch-action: none;
  cursor: pointer;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    -webkit-backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
  backdrop-filter: blur(0) saturate(100%);
  -webkit-backdrop-filter: blur(0) saturate(100%);
}

@media (min-width: 769px) {
  .mobile-backdrop {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-right,
  .nav-links li,
  .nav-controls,
  .backdrop-enter-active,
  .backdrop-leave-active {
    transition-duration: 0.01ms !important;
    transition-delay: 0 !important;
  }
}
</style>
