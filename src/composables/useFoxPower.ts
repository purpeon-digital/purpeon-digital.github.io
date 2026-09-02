import { computed, ref } from 'vue';

/** Foxgloves in a row needed to light the fox up. */
export const POWER_STREAK = 5;
/** How long the extra life lasts once earned, in milliseconds. */
export const POWER_MS = 10_000;
/** Below this the HUD and the fox blink to warn the window is closing. */
export const POWER_WARN_MS = 2_500;

/**
 * The foxglove streak and the extra life it buys.
 *
 * Kept out of FoxMiniGame.vue because everything else in that component is
 * canvas drawing and audio, which cannot be asserted on in jsdom. The rules
 * here are plain state transitions, so they can be.
 *
 * A streak counts consecutive foxgloves. Crystals and stars are a different
 * pickup and leave it alone; only letting a foxglove go past resets it.
 *
 * Once lit, every further foxglove pushes the ten seconds back to full, so a
 * good run keeps the fox lit. Missing one costs the refresh but never cuts the
 * window short: the clock keeps running down from wherever it was.
 */
export function useFoxPower() {
  const streak = ref(0);
  const timeLeft = ref(0);
  const shieldReady = ref(false);

  const isActive = computed(() => timeLeft.value > 0);
  const isExpiring = computed(() => isActive.value && timeLeft.value <= POWER_WARN_MS);
  const secondsLeft = computed(() => Math.ceil(timeLeft.value / 1000));

/**
   * `lit` on the pickup that earns the extra life, `refreshed` when one tops
   * the clock back up, `none` otherwise. The caller wants to sound very
   * different for the first two.
   */
  function collectFlower(): 'lit' | 'refreshed' | 'none' {
    if (isActive.value) {
      timeLeft.value = POWER_MS;
      return 'refreshed';
    }
    streak.value += 1;
    if (streak.value < POWER_STREAK) return 'none';
    streak.value = 0;
    timeLeft.value = POWER_MS;
    shieldReady.value = true;
    return 'lit';
  }

  /**
   * Only the streak is lost. An active power-up keeps counting down from where
   * it was: a miss forfeits the top-up, it does not end the mode early.
   */
  function missFlower() {
    streak.value = 0;
  }

  function tick(deltaMs: number) {
    if (timeLeft.value <= 0) return;
    timeLeft.value = Math.max(0, timeLeft.value - deltaMs);
    if (timeLeft.value === 0) shieldReady.value = false;
  }

  /**
   * Spend the extra life on a hit that would otherwise end the run. It is one
   * life, not ten seconds of invulnerability, so using it ends the power-up:
   * the fox drops back to orange and the player can see they are exposed again.
   */
  function consumeShield(): boolean {
    if (!shieldReady.value) return false;
    shieldReady.value = false;
    timeLeft.value = 0;
    return true;
  }

  function reset() {
    streak.value = 0;
    timeLeft.value = 0;
    shieldReady.value = false;
  }

  return {
    streak,
    timeLeft,
    shieldReady,
    isActive,
    isExpiring,
    secondsLeft,
    collectFlower,
    missFlower,
    tick,
    consumeShield,
    reset,
  };
}
