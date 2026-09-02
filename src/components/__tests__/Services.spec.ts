import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import Services from '../Services.vue';

const PACKAGES = [
  {
    id: 'ninja',
    icon: 'fa7-solid:user-ninja',
    title: 'Automation Ninja',
    tagline: 'Get yourself a ninja',
    description: 'We find where your time goes',
    tags: ['AI', 'Automation'],
  },
  {
    id: 'lag',
    icon: 'fa7-solid:people-group',
    title: 'Innovation Crew',
    tagline: 'Bring in a crew',
    description: 'We take the whole technical delivery',
    tags: ['Cloud'],
  },
  {
    id: 'forsterkingar',
    icon: 'fa7-solid:user-plus',
    title: 'Reinforcements',
    tagline: 'Need reinforcements?',
    description: 'We lend you specialists',
    tags: ['Cloud'],
  },
];
const N = PACKAGES.length;

vi.mock('@/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, any> = {
        'services.title': 'Our Services',
        'services.eyebrow': 'What we deliver',
        'services.titleStart': 'Our',
        'services.titleEm': 'services.',
        'services.prev': 'Previous package',
        'services.next': 'Next package',
        'services.slide': 'Package {n} of {m}',
        'services.carouselRole': 'carousel',
        'services.items': PACKAGES,
      };
      return translations[key] || key;
    },
    locale: { value: 'no' },
  }),
}));

// jsdom has no layout, so the carousel's measurements have to be stubbed:
// a 1000px viewport holding 700px slides on a 724px pitch.
const VIEWPORT = 1000;
const SLIDE = 700;
const STEP = 724;
const CENTRE = (VIEWPORT - SLIDE) / 2;

const transformAt = (pos: number) => `translate3d(${CENTRE - pos * STEP}px, 0, 0)`;

/** The pos the track is currently translated to, read back off the transform. */
function posOf(wrapper: VueWrapper<any>): number {
  const style = wrapper.find('.pkg-track').attributes('style') ?? '';
  const px = Number(/translate3d\((-?[\d.]+)px/.exec(style)?.[1] ?? NaN);
  return (CENTRE - px) / STEP;
}

/** Mount and let the onMounted measurement reach the DOM. */
async function mountCarousel() {
  const wrapper = mount(Services, { props: { locale: 'no' } });
  await wrapper.vm.$nextTick();
  return wrapper;
}

/** VTU's `trigger` cannot set clientX (read-only on MouseEvent), so pointer
 *  gestures are dispatched directly. */
async function pointer(
  wrapper: VueWrapper<any>,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
) {
  wrapper
    .find('.pkg-track')
    .element.dispatchEvent(
      new PointerEvent(type, { clientX, pointerId: 1, pointerType: 'touch', bubbles: true }),
    );
  await wrapper.vm.$nextTick();
}

const activeDot = (wrapper: VueWrapper<any>) =>
  wrapper.findAll('.pkg-dot').findIndex((d) => d.classes().includes('is-active'));

/** Slide transitions never run in jsdom, so the wrap-around has to be nudged. */
const settle = async (wrapper: VueWrapper<any>) => {
  await wrapper.find('.pkg-track').trigger('transitionend', { propertyName: 'transform' });
  await wrapper.vm.$nextTick();
};

let spies: any[] = [];

beforeEach(() => {
  (HTMLElement.prototype as any).setPointerCapture = vi.fn();
  (HTMLElement.prototype as any).releasePointerCapture = vi.fn();
  spies = [
    vi.spyOn(Element.prototype, 'clientWidth' as any, 'get').mockReturnValue(VIEWPORT),
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(SLIDE),
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      const parent = this.parentElement;
      if (!parent) return 0;
      return Array.prototype.indexOf.call(parent.children, this) * STEP;
    }),
  ];
});

afterEach(() => {
  spies.forEach((s) => s.mockRestore());
  vi.restoreAllMocks();
});

describe('Services', () => {
  describe('rendering', () => {
    it('renders services section with correct id', () => {
      const wrapper = mount(Services, { props: { locale: 'no' } });
      expect(wrapper.find('#services').exists()).toBe(true);
      expect(wrapper.find('.services-section').exists()).toBe(true);
    });

    it('renders section title', () => {
      const wrapper = mount(Services, { props: { locale: 'no' } });
      expect(wrapper.find('h2').text().replace(/\s+/g, ' ').trim()).toBe('Our services.');
    });

    it('renders three copies of the package list so both directions have a slide to step onto', () => {
      const wrapper = mount(Services, { props: { locale: 'no' } });
      expect(wrapper.findAll('.pkg-slide').length).toBe(N * 3);
    });

    it('hides the copies from assistive tech, keeping only the middle set', () => {
      const wrapper = mount(Services, { props: { locale: 'no' } });
      const hidden = wrapper.findAll('.pkg-slide').map((s) => s.attributes('aria-hidden'));
      expect(hidden.slice(0, N).every((h) => h === 'true')).toBe(true);
      expect(hidden.slice(N, N * 2).every((h) => h === undefined)).toBe(true);
      expect(hidden.slice(N * 2).every((h) => h === 'true')).toBe(true);
    });

    it('renders title, tagline, description and tags on a slide', () => {
      const wrapper = mount(Services, { props: { locale: 'no' } });
      const slide = wrapper.findAll('.pkg-slide')[0]!;
      expect(slide.find('.pkg-title').text()).toBe('Automation Ninja');
      expect(slide.find('.pkg-tagline').text()).toBe('Get yourself a ninja');
      expect(slide.find('.pkg-desc').text()).toBe('We find where your time goes');
      expect(slide.findAll('.pkg-tags li').map((t) => t.text())).toEqual(['AI', 'Automation']);
    });

    it('resolves every icon name to a bundled icon component', () => {
      const wrapper = mount(Services, { props: { locale: 'no' } });
      expect(wrapper.findAll('.pkg-icon svg').length).toBe(N * 3);
    });

    it('gives each slide its own accent hue', () => {
      const wrapper = mount(Services, { props: { locale: 'no' } });
      const slides = wrapper.findAll('.pkg-slide');
      expect(slides[0]!.attributes('style')).toContain('--pkg-hue: 312');
      expect(slides[1]!.attributes('style')).toContain('--pkg-hue: 302');
      expect(slides[2]!.attributes('style')).toContain('--pkg-hue: 292');
    });
  });

  describe('carousel', () => {
    it('opens centred on the first package, in the middle copy', async () => {
      const wrapper = await mountCarousel();
      expect(posOf(wrapper)).toBe(N);
      expect(activeDot(wrapper)).toBe(0);
      expect(wrapper.find('.pkg-track').attributes('style')).toContain(transformAt(N));
    });

    it('labels the viewport as a carousel and each slide by position', async () => {
      const wrapper = await mountCarousel();
      const viewport = wrapper.find('.pkg-viewport');
      expect(viewport.attributes('aria-roledescription')).toBe('carousel');
      expect(viewport.attributes('aria-label')).toBe('Our Services');
      expect(wrapper.findAll('.pkg-slide')[N + 1]!.attributes('aria-label')).toBe(
        `Package 2 of ${N}`,
      );
    });

    it('advances one slide per next click', async () => {
      const wrapper = await mountCarousel();
      await wrapper.find('.pkg-nav--next').trigger('click');
      expect(posOf(wrapper)).toBe(N + 1);
      expect(activeDot(wrapper)).toBe(1);
    });

    it('wraps backwards past the first package', async () => {
      const wrapper = await mountCarousel();
      await wrapper.find('.pkg-nav--prev').trigger('click');
      // Steps onto the real slide before the middle copy, so nothing jumps...
      expect(posOf(wrapper)).toBe(N - 1);
      expect(activeDot(wrapper)).toBe(N - 1);
      // ...then the finished transition puts it back inside the middle copy.
      await settle(wrapper);
      expect(posOf(wrapper)).toBe(N + (N - 1));
      expect(activeDot(wrapper)).toBe(N - 1);
    });

    it('wraps forwards past the last package', async () => {
      const wrapper = await mountCarousel();
      for (let i = 0; i < N; i++) {
        await wrapper.find('.pkg-nav--next').trigger('click');
        await settle(wrapper);
      }
      expect(activeDot(wrapper)).toBe(0);
      expect(posOf(wrapper)).toBe(N);
    });

    it('keeps looping in either direction without running out of slides', async () => {
      const wrapper = await mountCarousel();
      for (let i = 0; i < N * 3 + 1; i++) {
        await wrapper.find('.pkg-nav--prev').trigger('click');
        await settle(wrapper);
        expect(posOf(wrapper)).toBeGreaterThanOrEqual(N);
        expect(posOf(wrapper)).toBeLessThan(N * 2);
      }
      expect(activeDot(wrapper)).toBe(N - 1);
    });

    it('takes the shorter way round when a dot is clicked', async () => {
      const wrapper = await mountCarousel();
      // From package 1 of 3, package 3 is one step backwards, not two forwards.
      await wrapper.findAll('.pkg-dot')[N - 1]!.trigger('click');
      expect(posOf(wrapper)).toBe(N - 1);
      expect(activeDot(wrapper)).toBe(N - 1);
    });

    it('moves a slide per arrow key on the viewport', async () => {
      const wrapper = await mountCarousel();
      await wrapper.find('.pkg-viewport').trigger('keydown', { key: 'ArrowRight' });
      expect(activeDot(wrapper)).toBe(1);
      await wrapper.find('.pkg-viewport').trigger('keydown', { key: 'ArrowLeft' });
      expect(activeDot(wrapper)).toBe(0);
    });

    it('marks only the centred slide active', async () => {
      const wrapper = await mountCarousel();
      const active = () =>
        wrapper.findAll('.pkg-slide').filter((s) => s.classes().includes('is-active'));
      expect(active().length).toBe(1);
      expect(active()[0]!.find('.pkg-title').text()).toBe(PACKAGES[0]!.title);
      await wrapper.find('.pkg-nav--next').trigger('click');
      expect(active()[0]!.find('.pkg-title').text()).toBe(PACKAGES[1]!.title);
    });
  });

  describe('drag', () => {
    it('advances when dragged further than the threshold', async () => {
      const wrapper = await mountCarousel();
      await pointer(wrapper, 'pointerdown', 500);
      await pointer(wrapper, 'pointermove', 200);
      await pointer(wrapper, 'pointerup', 200);
      expect(activeDot(wrapper)).toBe(1);
    });

    it('goes back when dragged the other way', async () => {
      const wrapper = await mountCarousel();
      await pointer(wrapper, 'pointerdown', 200);
      await pointer(wrapper, 'pointermove', 500);
      await pointer(wrapper, 'pointerup', 500);
      expect(activeDot(wrapper)).toBe(N - 1);
    });

    it('springs back when the drag is too short to count', async () => {
      const wrapper = await mountCarousel();
      await pointer(wrapper, 'pointerdown', 500);
      await pointer(wrapper, 'pointermove', 480);
      await pointer(wrapper, 'pointerup', 480);
      expect(activeDot(wrapper)).toBe(0);
      expect(posOf(wrapper)).toBe(N);
    });
  });

  describe('layout', () => {
    it('reveals the carousel once the section intersects', async () => {
      const wrapper = await mountCarousel();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.services-section').classes()).toContain('is-revealed');
    });
  });
});
