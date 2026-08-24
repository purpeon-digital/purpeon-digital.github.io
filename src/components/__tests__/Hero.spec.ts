import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Hero from '../Hero.vue';

// Mock useI18n composable
vi.mock('@/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, any> = {
        'hero.title': 'Test Title',
        'hero.titleStart': 'Test',
        'hero.titleEm': 'Title',
        'hero.subtitle': 'Test Subtitle',
        'hero.tagline': 'Test Tagline',
        'hero.cta.services': 'Services',
        'hero.cta.sales': 'Sales',
        'hero.features': [
          { icon: 'mdi:test', title: 'Feature 1', description: 'Desc 1' },
          { icon: 'mdi:test', title: 'Feature 2', description: 'Desc 2' }
        ]
      };
      return translations[key] || key;
    },
    locale: { value: 'no' }
  })
}));

describe('Hero', () => {
  describe('rendering', () => {
    it('renders hero section', () => {
      const wrapper = mount(Hero, {
        props: { locale: 'no' }
      });
      expect(wrapper.find('.hero').exists()).toBe(true);
    });

    it('renders hero content with text', () => {
      const wrapper = mount(Hero, {
        props: { locale: 'no' }
      });
      expect(wrapper.find('.hero-text').exists()).toBe(true);
      expect(wrapper.find('h1').text().replace(/\s+/g, ' ').trim()).toBe('Test Title');
    });

    it('renders subtitle and tagline', () => {
      const wrapper = mount(Hero, {
        props: { locale: 'no' }
      });
      const paragraphs = wrapper.findAll('.hero-text p');
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('renders SectionButton components', () => {
      const wrapper = mount(Hero, {
        props: { locale: 'no' }
      });
      const buttons = wrapper.findAll('.hero-buttons .btn');
      expect(buttons.length).toBe(2);
    });

    it('inlines the animated mark rather than loading it through an img', () => {
      const wrapper = mount(Hero, {
        props: { locale: 'no' }
      });
      const mark = wrapper.find('.hero-mark');
      expect(mark.exists()).toBe(true);
      // inlined so the keyframes are page CSS and replay on every load
      expect(mark.find('svg.pd-lockup').exists()).toBe(true);
      expect(mark.find('img').exists()).toBe(false);
    });

    it('renders Features component', () => {
      const wrapper = mount(Hero, {
        props: { locale: 'no' }
      });
      expect(wrapper.find('.features').exists()).toBe(true);
    });
  });

  describe('button links', () => {
    it('has correct href for services button', () => {
      const wrapper = mount(Hero, {
        props: { locale: 'no' }
      });
      const primaryBtn = wrapper.find('.btn-primary');
      expect(primaryBtn.attributes('href')).toBe('#services');
    });

    it('has correct href for contact button', () => {
      const wrapper = mount(Hero, {
        props: { locale: 'no' }
      });
      const secondaryBtn = wrapper.find('.btn-secondary');
      expect(secondaryBtn.attributes('href')).toBe('#contact');
    });
  });
});
