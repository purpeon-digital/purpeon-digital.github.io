<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import { registerFoxClick } from '@/composables/useFoxEasterEgg';
import LanguagePicker from './LanguagePicker.vue';
import ThemeToggle from './ThemeToggle.vue';
import IconBriefcase from '~icons/fa7-solid/briefcase';
import IconUsers from '~icons/fa7-solid/users';
import IconCircleInfo from '~icons/fa7-solid/circle-info';
import IconHandshake from '~icons/fa7-solid/handshake';
import IconPaperPlane from '~icons/fa7-solid/paper-plane';
import IconChevronRight from '~icons/fa7-solid/chevron-right';

const props = defineProps<{
  locale: Locale;
}>();

const { t } = useI18n(props.locale);
const mobileMenuOpen = ref(false);
const isMobile = ref(false);
const mobileNavRef = ref<HTMLElement | null>(null);

watch([isMobile, mobileMenuOpen], () => {
  if (!mobileNavRef.value) return;
  if (isMobile.value && !mobileMenuOpen.value) {
    mobileNavRef.value.setAttribute('inert', '');
  } else {
    mobileNavRef.value.removeAttribute('inert');
  }
});

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
  // Match Tailwind's `md` breakpoint exactly (mobile = width < 768px) so the
  // header's mobile/desktop switch lines up with the content's `max-md:`/`md:`.
  mobileMq = window.matchMedia('(width < 768px)');
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
function onLogoClick(e: MouseEvent) {
  registerFoxClick(e.currentTarget as HTMLElement);
  scrollToSection(e, '#');
}
</script>

<template>
  <header class="header-bar">
    <nav class="max-w-[1400px] mx-auto px-8 flex justify-between items-center w-full h-full max-md:px-4 max-md:h-auto max-md:min-h-[52px]">
      <a href="#" class="logo" @click.prevent="onLogoClick($event)">
        <span class="logo-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 31 31" fill="#bb33bb" class="h-full w-full">
            <g transform="translate(-63.805999,-44.420964)">
              <path d="m 75.339167,44.748374 c 1.538708,2.236283 2.233711,4.426022 2.619527,7.236845 0.491186,0.03549 1.510277,0.181952 2.040628,0.328818 1.493142,0.407963 3.054007,1.24347 4.184063,2.316411 2.079792,1.989633 1.291201,4.016798 4.12042,6.033356 1.142295,0.803686 1.646537,0.990941 2.944265,1.653472 0.371246,0.175424 2.036141,0.749019 1.888866,1.229599 -1.114145,3.722246 -5.428756,4.00782 -8.480315,3.616176 -1.786467,-0.09914 -3.275938,0.375326 -3.435044,2.215236 -0.128508,2.349048 0.207718,1.687696 2.070475,4.822888 -3.653561,1.268486 -7.0595,0.989712 -10.211594,-0.06401 1.843428,-9.262548 7.459295,-8.646886 14.566453,-8.095597 1.705278,0.06564 2.840717,-0.58176 3.389019,-1.01828 0.117085,-0.09302 0.180727,-0.27619 -0.199902,-0.702919 -0.07996,-0.167266 -1.247549,0.290469 -3.033201,0.06731 -2.97731,-0.207246 -4.207316,-1.834201 -8.193925,-2.063068 -1.714666,-0.137483 -3.641065,0.308828 -4.968983,1.440108 0.117085,0.01509 1.272435,-0.545446 3.189451,-0.245594 -4.748381,2.577459 -5.276814,8.499296 -5.485384,10.329003 -2.19484,-4.457189 -2.815221,-9.378375 -2.123785,-16.499131 0.73037,-6.138753 0.753822,-9.296233 5.118966,-12.600627 z m 7.546081,13.50804 c -0.860801,-0.376957 -2.773736,-0.0257 -2.712542,0.113006 0.47446,0.302708 0.513217,0.259872 1.109658,0.701695 0.667834,0.49445 1.194922,0.547486 1.62165,0.571147 1.024802,0.194598 0.667835,0.101175 1.345053,0.32637 -0.118826,-0.579793 -0.867629,-1.488753 -1.363819,-1.712218 z M 74.971593,46.802057 c -1.955453,2.008404 -2.83374,5.923502 -1.89213,8.331816 4.666334,-2.428666 2.64845,-6.491261 1.89213,-8.331816 z"/>
              <path d="m 81.752447,52.094714 c -0.413266,-0.197862 -1.879483,-0.645397 -3.060127,-0.820004 -0.253344,-0.909757 -0.289245,-1.274883 -0.369206,-1.707731 1.187754,-1.875519 3.246986,-3.447637 4.086152,-3.834031 0.181135,0.877119 0.11219,4.225675 -0.656819,6.361766"/>
              <path d="m 65.676886,68.450794 c 0.704978,-2.326819 2.35973,-3.282608 3.508387,-5.770105 -0.118978,2.067203 0.01609,6.209292 2.078794,10.661263 -2.677865,-1.420999 -4.404292,-3.248265 -5.587181,-4.891158 z"/>
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

      <div id="mobile-nav" ref="mobileNavRef" class="nav-right" :class="{ 'mobile-open': mobileMenuOpen }">
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
            <a href="#references" @click="(e) => scrollToSection(e, '#references')">
              <span class="nav-link-icon"><IconHandshake /></span>
              <span class="nav-link-label">{{ t('nav.references') }}</span>
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
/* Header bar - Glassmorphism */
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
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.22), inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  transition: all 0.3s ease;
  border-bottom: 1px solid var(--header-border, rgba(255, 255, 255, 0.18));
  display: flex;
  align-items: center;
}

@media (width < 768px) {
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
  transition: transform 0.2s ease;
}

.logo:hover {
  transform: scale(1.02);
}

@media (width < 768px) {
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
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

@media (width < 768px) {
  .logo-icon {
    width: 32px;
    height: 32px;
  }
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  /* "Purpeon Digital" must never break across two lines when the bar gets
     tight at tablet widths. */
  white-space: nowrap;
}

@media (width < 768px) {
  .logo-text {
    font-size: 1.1rem;
  }
}

/* Navigation right side */
.nav-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 0.35rem;
}

.nav-links a {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  padding: 0.45rem 0.85rem;
  border-radius: 12px;
  position: relative;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
}

.nav-links a:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.35), 0 4px 16px rgba(0, 0, 0, 0.15), 0 0 12px rgba(147, 197, 253, 0.2);
  transform: translateY(-1px);
}

.nav-links a:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.24);
}

/* Desktop: chevron is a mobile affordance, hide it */
@media (width >= 768px) {
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
  font-size: 0.9em;
  color: #93c5fd;
  transition: color 0.2s ease, transform 0.2s ease;
}

.nav-links a:hover .nav-link-icon {
  color: #ffffff;
  transform: scale(1.08);
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
  padding: 0.3rem 0.45rem;
  border-radius: 8px;
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.nav-controls :deep(button:hover) {
  background-color: rgba(255, 255, 255, 0.16);
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
  /* Two-word labels ("Våre Tenester", "Kontakt Oss") must stay on one line —
     otherwise they wrap and stagger the bar at tablet widths. */
  white-space: nowrap;
}

/* Nav Controls capsule container on desktop - Glassmorphic */
.nav-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.45rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.22), 0 4px 12px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(12px);
}

/* Tablet (iPad portrait ~768–1024px): the full horizontal nav still shows here,
   so tighten the link padding and gaps to keep all four items on one line with
   breathing room instead of crowding the edges. */
@media (width >= 768px) and (max-width: 1080px) {
  .nav-right {
    gap: 0.85rem;
  }
  .nav-links a {
    padding-left: 0.55rem;
    padding-right: 0.55rem;
  }
  .nav-controls {
    padding-left: 0.35rem;
    padding-right: 0.35rem;
  }
}

/* Narrow tablets (~768–920px): with five nav items the inline link icons no
   longer fit alongside the non-wrapping logo + controls — drop them and keep
   the labels, which carry the meaning. */
@media (width >= 768px) and (max-width: 920px) {
  .nav-link-icon {
    display: none;
  }
}

/* Narrow tablets (iPad portrait, ~769–860px): tightest band where all five
   nav items + the non-wrapping logo + controls must share one line. Trim the
   bar's outer padding, the link padding and the logo a touch more so nothing
   wraps or crowds. */
@media (width >= 768px) and (max-width: 860px) {
  nav {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .nav-links a {
    padding-left: 0.4rem;
    padding-right: 0.4rem;
  }
  .logo {
    gap: 0.5rem;
  }
  .logo-text {
    font-size: 1.1rem;
  }
}

/* Hamburger Menu - Glassmorphic */
.hamburger {
  flex-direction: column;
  gap: 5px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  cursor: pointer;
  padding: 8px 10px;
  z-index: 1001;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
}

.hamburger:focus {
  outline: none;
}

.hamburger:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.7);
  outline-offset: 2px;
}

.hamburger:hover,
.hamburger:active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.35), 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hamburger span {
  display: block;
  width: 22px;
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

/* Mobile nav drawer - Glassmorphic */
@media (width < 768px) {
  .nav-right {
    position: fixed;
    top: 52px;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 0;
    background:
      radial-gradient(130% 70% at 50% 0%, rgba(59, 130, 246, 0.3), transparent 65%),
      radial-gradient(120% 80% at 100% 100%, rgba(37, 99, 235, 0.25), transparent 70%),
      var(--header-bg-solid, rgba(10, 20, 42, 0.9));
    backdrop-filter: blur(28px) saturate(200%);
    -webkit-backdrop-filter: blur(28px) saturate(200%);
    flex-direction: column;
    padding: 0 1.25rem;
    gap: 1.75rem;
    overflow: hidden;
    overscroll-behavior: contain;
    pointer-events: none;
    transition:
      max-height 0.45s cubic-bezier(0.32, 0.72, 0, 1),
      padding 0.45s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    border-bottom: 1px solid rgba(255, 255, 255, 0.18);
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
      rgba(96, 165, 250, 0.5) 30%,
      rgba(147, 197, 253, 0.8) 50%,
      rgba(96, 165, 250, 0.5) 70%,
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
  .nav-right.mobile-open .nav-links li:nth-child(5) { transition-delay: 0.36s; }

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
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(12px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 4px 14px rgba(0, 0, 0, 0.15);
    transition:
      background 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.15s ease;
  }

  .nav-links a:hover,
  .nav-links a:active {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.32) 0%,
      rgba(37, 99, 235, 0.22) 100%
    );
    border-color: rgba(147, 197, 253, 0.45);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      0 6px 20px rgba(37, 99, 235, 0.3);
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
      rgba(59, 130, 246, 0.45) 0%,
      rgba(37, 99, 235, 0.35) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      0 2px 10px rgba(37, 99, 235, 0.35);
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
    box-shadow: none;
    backdrop-filter: none;
    border-radius: 0;
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
    transition-delay: 0.36s;
  }

  .nav-control {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    padding: 0;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(12px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 4px 14px rgba(0, 0, 0, 0.18);
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
      rgba(96, 165, 250, 0.4) 0%,
      rgba(59, 130, 246, 0.3) 50%,
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
      rgba(59, 130, 246, 0.32) 0%,
      rgba(37, 99, 235, 0.2) 100%
    );
    border-color: rgba(147, 197, 253, 0.5);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 6px 20px rgba(59, 130, 246, 0.3);
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

@media (width >= 768px) {
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
