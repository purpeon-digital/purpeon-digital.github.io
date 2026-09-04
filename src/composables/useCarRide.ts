import { computed, ref } from 'vue';

/** Objects the car flattens before the one that finishes it. */
export const CAR_SMASH_LIMIT = 5;
/** Points per flattened object. */
export const CAR_SMASH_POINTS = 100;
/** Score interval at which the next car turns up. */
export const CAR_SCORE_STEP = 5000;

/**
 * The car's one rule: it goes through five things and the sixth ends it.
 *
 * Kept out of the component because it is the part that decides whether a run
 * continues, and that deserves tests rather than a canvas and a stopwatch.
 */
export function useCarRide() {
  const smashed = ref(0);
  const remaining = computed(() => Math.max(0, CAR_SMASH_LIMIT - smashed.value));
  const doomed = computed(() => smashed.value >= CAR_SMASH_LIMIT);

  /**
   * Register hitting something. `smashed` for the first five, `crash` for the
   * sixth, which is the one that stops the car.
   */
  function hit(): 'smashed' | 'crash' {
    if (doomed.value) return 'crash';
    smashed.value += 1;
    return 'smashed';
  }

  function reset() {
    smashed.value = 0;
  }

  return { smashed, remaining, doomed, hit, reset };
}
