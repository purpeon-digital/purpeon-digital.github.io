import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import References from '../References.vue';

// Mock useI18n composable
vi.mock('@/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, any> = {
        'references.eyebrow': 'References',
        'references.titleStart': 'Companies that build with',
        'references.titleEm': 'us.',
        'references.lede': 'References lede text',
        'references.visit': 'Visit website',
        'references.clients': [
          {
            id: 'vision3f',
            name: 'Vision3F',
            sector: 'Aquaculture technology',
            location: 'Rotselaar, Belgium',
            url: 'https://www.vision3f.com/',
            urlLabel: 'vision3f.com',
            description: 'Vision3F description',
            tags: ['Cloud', 'AI'],
          },
          {
            id: 'saetren',
            name: 'Sætren',
            sector: 'Electrical & automation',
            location: 'Måløy, Norway',
            url: 'https://www.saetren.no/',
            urlLabel: 'saetren.no',
            description: 'Sætren description',
            tags: ['Consultancy', 'Software', 'Automation'],
          },
        ],
      };
      return translations[key] || key;
    },
    locale: { value: 'no' },
  }),
}));

describe('References', () => {
  describe('rendering', () => {
    it('renders references section with correct id', () => {
      const wrapper = mount(References, {
        props: { locale: 'no' },
      });
      expect(wrapper.find('#references').exists()).toBe(true);
      expect(wrapper.find('.refs-section').exists()).toBe(true);
    });

    it('renders section title', () => {
      const wrapper = mount(References, {
        props: { locale: 'no' },
      });
      expect(wrapper.find('h2').text().replace(/\s+/g, ' ').trim()).toBe(
        'Companies that build with us.',
      );
    });

    it('renders one card per client', () => {
      const wrapper = mount(References, {
        props: { locale: 'no' },
      });
      const cards = wrapper.findAll('.ref-card');
      expect(cards.length).toBe(2);
      expect(cards[0].text()).toContain('Vision3F');
      expect(cards[1].text()).toContain('Sætren');
    });

    it('links each card to the client website in a new tab', () => {
      const wrapper = mount(References, {
        props: { locale: 'no' },
      });
      const cards = wrapper.findAll('a.ref-card');
      expect(cards[0].attributes('href')).toBe('https://www.vision3f.com/');
      expect(cards[1].attributes('href')).toBe('https://www.saetren.no/');
      for (const card of cards) {
        expect(card.attributes('target')).toBe('_blank');
        expect(card.attributes('rel')).toBe('noopener noreferrer');
      }
    });

    it('renders theme-variant logos for each client', () => {
      const wrapper = mount(References, {
        props: { locale: 'no' },
      });
      const cards = wrapper.findAll('.ref-card');
      expect(cards[0].find('img.ref-logo-light').attributes('src')).toBe(
        '/references/vision3f-light.png',
      );
      expect(cards[0].find('img.ref-logo-dark').attributes('src')).toBe(
        '/references/vision3f-dark.png',
      );
      expect(cards[1].find('img.ref-logo-light').attributes('src')).toBe(
        '/references/saetren-light.png',
      );
      expect(cards[1].find('img.ref-logo-dark').attributes('src')).toBe(
        '/references/saetren-dark.png',
      );
    });

    it('renders client tags', () => {
      const wrapper = mount(References, {
        props: { locale: 'no' },
      });
      const cards = wrapper.findAll('.ref-card');
      expect(cards[0].findAll('.ref-tags li').map((t) => t.text())).toEqual(['Cloud', 'AI']);
      expect(cards[1].findAll('.ref-tags li').length).toBe(3);
    });

    it('renders sector and location for each client', () => {
      const wrapper = mount(References, {
        props: { locale: 'no' },
      });
      const cards = wrapper.findAll('.ref-card');
      expect(cards[0].find('.ref-sector').text()).toBe('Aquaculture technology');
      expect(cards[0].find('.ref-loc').text()).toContain('Rotselaar, Belgium');
      expect(cards[1].find('.ref-sector').text()).toBe('Electrical & automation');
      expect(cards[1].find('.ref-loc').text()).toContain('Måløy, Norway');
    });
  });

  describe('reveal', () => {
    it('marks the section revealed once the IntersectionObserver fires', async () => {
      const wrapper = mount(References, {
        props: { locale: 'no' },
      });
      // Global test setup mocks IntersectionObserver to fire immediately;
      // the class lands after the next reactive flush.
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.refs-section').classes()).toContain('is-revealed');
    });
  });
});
