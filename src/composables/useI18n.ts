import { ref, computed, onMounted } from 'vue';
import en from '@/i18n/en.json';
import no from '@/i18n/no.json';

export type Locale = 'en' | 'no';

const translations = { en, no } as const;

// Get current locale from DOM (source of truth)
const getCurrentLocale = (): Locale => {
  // First check window.__INITIAL_LOCALE__ set by SSR
  if (typeof window !== 'undefined' && (window as any).__INITIAL_LOCALE__) {
    return (window as any).__INITIAL_LOCALE__ as Locale;
  }
  // Fallback to reading from HTML lang attribute
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang === 'en' || htmlLang === 'no') {
      return htmlLang;
    }
  }
  return 'no';
};

// Global reactive state - shared across all components
// Initialize with locale from window.__INITIAL_LOCALE__ if available, otherwise 'no'
const currentLocale = ref<Locale>(
  typeof window !== 'undefined' && (window as any).__INITIAL_LOCALE__
    ? (window as any).__INITIAL_LOCALE__
    : 'no'
);

type TranslationSchema = typeof en;

type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

function detectBrowserLanguage(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const lang = browserLang.split('-')[0].toLowerCase();
  
  return lang === 'no' || lang === 'nb' || lang === 'nn' ? 'no' : 'en';
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? path;
}

export function useI18n(initialLocale?: Locale) {
  if (initialLocale && currentLocale.value !== initialLocale) {
    currentLocale.value = initialLocale;
  }

  // Active locale is deterministic: if initialLocale prop was provided,
  // it takes precedence for SSR and client hydration matching.
  const activeLocale = computed<Locale>(() => {
    return initialLocale || currentLocale.value || 'no';
  });

  const setLocale = (newLocale: Locale) => {
    currentLocale.value = newLocale;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', newLocale);
    }
    
    // Update __INITIAL_LOCALE__ for the new page
    if (typeof window !== 'undefined') {
      (window as any).__INITIAL_LOCALE__ = newLocale;
    }
    
    // Redirect to the correct language path
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const newPath = newLocale === 'no' ? '/' : '/en/';
      
      if (newLocale === 'en' && !currentPath.startsWith('/en')) {
        window.location.href = newPath;
      } else if (newLocale === 'no' && currentPath.startsWith('/en')) {
        window.location.href = newPath;
      }
    }
  };

  // Reactive translation function - returns computed for reactivity
  const t = <K extends string>(key: K): PathValue<TranslationSchema, K> => {
    const loc = activeLocale.value;
    const dict = translations[loc] || translations.no;
    return getNestedValue(dict, key);
  };

  const locale = computed(() => activeLocale.value);

  // Expose a reactive getter for current translations
  const messages = computed(() => translations[activeLocale.value] || translations.no);

  return {
    locale,
    messages,
    t,
    setLocale
  };
}
