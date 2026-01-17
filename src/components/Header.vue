<script setup lang="ts">
import { ref } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import LanguagePicker from './LanguagePicker.vue';

const props = defineProps<{
  locale: Locale;
}>();

const { t } = useI18n(props.locale);
const mobileMenuOpen = ref(false);

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
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
        <span class="logo-icon">P</span>
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
          <button class="theme-toggle" @click="toggleTheme" aria-label="Toggle theme">
            <span class="theme-option theme-light">☀️</span>
            <span class="theme-option theme-dark">🌙</span>
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>
