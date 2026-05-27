import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Services from '../Services.vue';

// Mock useI18n composable
vi.mock('@/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, any> = {
        'services.title': 'Our Services',
        'services.eyebrow': 'What we do',
        'services.titleStart': 'Our',
        'services.titleEm': 'services.',
        'services.intro': 'Services intro text',
        'services.description': 'Services description',
        'services.items': [
          { icon: 'mdi:code', title: 'Development', description: 'We build' },
          { icon: 'mdi:design', title: 'Design', description: 'We design' }
        ]
      };
      return translations[key] || key;
    },
    locale: { value: 'no' }
  })
}));

describe('Services', () => {
  describe('rendering', () => {
    it('renders services section with correct id', () => {
      const wrapper = mount(Services, {
        props: { locale: 'no' }
      });
      expect(wrapper.find('#services').exists()).toBe(true);
      expect(wrapper.find('.services-section').exists()).toBe(true);
    });

    it('renders section title', () => {
      const wrapper = mount(Services, {
        props: { locale: 'no' }
      });
      expect(wrapper.find('h2').text().replace(/\s+/g, ' ').trim()).toBe('Our services.');
    });

    it('renders intro and description paragraphs', () => {
      const wrapper = mount(Services, {
        props: { locale: 'no' }
      });
      const paragraphs = wrapper.findAll('.section-text > p');
      expect(paragraphs.length).toBe(2);
    });

    it('renders SectionImage component with animation', () => {
      const wrapper = mount(Services, {
        props: { locale: 'no' }
      });
      const image = wrapper.find('.section-image');
      expect(image.exists()).toBe(true);
      expect(image.classes()).toContain('section-image--animate');
    });

    it('renders Features component', () => {
      const wrapper = mount(Services, {
        props: { locale: 'no' }
      });
      expect(wrapper.find('.features').exists()).toBe(true);
    });
  });

  describe('layout', () => {
    it('has services-content grid', () => {
      const wrapper = mount(Services, {
        props: { locale: 'no' }
      });
      expect(wrapper.find('.services-content').exists()).toBe(true);
    });

    it('has section-text container', () => {
      const wrapper = mount(Services, {
        props: { locale: 'no' }
      });
      expect(wrapper.find('.section-text').exists()).toBe(true);
    });
  });
});
