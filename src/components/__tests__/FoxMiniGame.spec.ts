import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import FoxMiniGame from '../FoxMiniGame.vue';
import { registerFoxClick } from '@/composables/useFoxEasterEgg';

describe('FoxMiniGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts hidden by default', () => {
    const wrapper = mount(FoxMiniGame, {
      props: { locale: 'no' }
    });
    expect(wrapper.find('.fox-game-overlay').exists()).toBe(false);
  });

  it('opens when open-fox-game event is dispatched', async () => {
    const wrapper = mount(FoxMiniGame, {
      props: { locale: 'no' },
      attachTo: document.body
    });

    window.dispatchEvent(new CustomEvent('open-fox-game'));
    await wrapper.vm.$nextTick();

    expect(document.querySelector('.fox-game-overlay')).not.toBeNull();
    wrapper.unmount();
  });

  it('triggers open-fox-game on 5 clicks via registerFoxClick', () => {
    const eventSpy = vi.fn();
    window.addEventListener('open-fox-game', eventSpy);

    for (let i = 0; i < 4; i++) {
      registerFoxClick();
    }
    expect(eventSpy).not.toHaveBeenCalled();

    registerFoxClick(); // 5th click
    expect(eventSpy).toHaveBeenCalledTimes(1);

    window.removeEventListener('open-fox-game', eventSpy);
  });
});
