<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import LanguagePicker from './LanguagePicker.vue';

type Theme = 'light' | 'dark';

const props = defineProps<{
  locale: Locale;
}>();

const { t } = useI18n(props.locale);
const mobileMenuOpen = ref(false);
const themeReady = ref(false);

const initialTheme: Theme = (() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'light';
  const fromHead = (window as typeof window & { __INITIAL_THEME__?: Theme }).__INITIAL_THEME__;
  const attrTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
  if (fromHead || attrTheme) return (fromHead || attrTheme) as Theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();

const theme = ref<Theme>(initialTheme);

onMounted(() => {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme.value);

  try {
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', theme.value);
    }
  } catch (e) {}

  themeReady.value = true;
});

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', newTheme);
  try {
    localStorage.setItem('theme', newTheme);
  } catch (e) {}
  theme.value = newTheme;
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : '';
}

function scrollToSection(e: Event, href: string) {
  e.preventDefault();

  // Close mobile menu if open
  if (mobileMenuOpen.value) {
    mobileMenuOpen.value = false;
    document.body.style.overflow = '';
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
  <header>
    <nav>
      <a href="#" class="logo" @click.prevent="scrollToSection($event, '#')">
        <span class="logo-icon">
          <img src="/logo.png" alt="Logo" width="40" height="40" />
        </span>
        <span class="logo-text">Purpeon <span class="logo-accent">Digital</span></span>
      </a>

      <button class="hamburger" @click="toggleMobileMenu" :class="{ open: mobileMenuOpen }" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="nav-right" :class="{ 'mobile-open': mobileMenuOpen }">
        <ul class="nav-links">
          <li><a href="#services" @click="(e) => scrollToSection(e, '#services')">{{ t('nav.services') }}</a></li>
          <li><a href="#about" @click="(e) => scrollToSection(e, '#about')">{{ t('nav.about') }}</a></li>
          <li><a href="#contact" @click="(e) => scrollToSection(e, '#contact')">{{ t('nav.contact') }}</a></li>
        </ul>
        <div class="nav-controls">
          <LanguagePicker :locale="props.locale" />
          <button v-if="themeReady" class="theme-toggle" :class="{ 'theme-toggle--toggled': theme === 'dark' }" type="button"
            title="Toggle theme" aria-label="Toggle theme" @click="toggleTheme" style="color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="2rem" height="2rem" fill="currentColor"
              stroke-linecap="round" class="theme-toggle__classic" viewBox="0 0 32 32">
              <clipPath id="theme-toggle__classic__cutout">
                <path d="M0-5h30a1 1 0 0 0 9 13v24H0Z" />
              </clipPath>
              <g clip-path="url(#theme-toggle__classic__cutout)">
                <circle cx="16" cy="16" r="9.34" />
                <g stroke="currentColor" stroke-width="1.5">
                  <path d="M16 5.5v-4" />
                  <path d="M16 30.5v-4" />
                  <path d="M1.5 16h4" />
                  <path d="M26.5 16h4" />
                  <path d="m23.4 8.6 2.8-2.8" />
                  <path d="m5.7 26.3 2.9-2.9" />
                  <path d="m5.8 5.8 2.8 2.8" />
                  <path d="m23.4 23.4 2.9 2.9" />
                </g>
              </g>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>
<style scoped>
/* Header */
header {
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
  box-shadow: 0 2px 20px var(--shadow-color);
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
}

nav {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: white;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.logo:hover .logo-icon {
  transform: scale(1.05);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%);
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.logo-accent {
  font-weight: 400;
  opacity: 0.85;
}

/* Navigation */
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
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  position: relative;
  font-size: 0.925rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.nav-links a:hover {
  color: white;
  background: rgba(255, 255, 255, 0.12);
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.25s ease;
  transform: translateX(-50%);
  border-radius: 1px;
}

.nav-links a:hover::after {
  width: 60%;
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
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  z-index: 1001;
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
</style>