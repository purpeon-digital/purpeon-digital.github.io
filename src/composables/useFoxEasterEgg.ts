import { ref } from 'vue';

const clickCount = ref(0);
let resetTimer: ReturnType<typeof setTimeout> | null = null;

export function registerFoxClick(element?: HTMLElement | null): number {
  clickCount.value++;

  if (element) {
    element.classList.remove('fox-wiggle-1', 'fox-wiggle-2', 'fox-wiggle-3');
    // Force reflow
    void element.offsetWidth;
    const animClass = `fox-wiggle-${(clickCount.value % 3) + 1}`;
    element.classList.add(animClass);
    setTimeout(() => {
      element.classList.remove(animClass);
    }, 400);
  }

  if (resetTimer) {
    clearTimeout(resetTimer);
  }

  if (clickCount.value >= 5) {
    clickCount.value = 0;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-fox-game'));
    }
    return 5;
  }

  resetTimer = setTimeout(() => {
    clickCount.value = 0;
  }, 3500);

  return clickCount.value;
}
