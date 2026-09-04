import { describe, it, expect } from 'vitest';
import { useCarRide, CAR_SMASH_LIMIT } from '@/composables/useCarRide';

describe('useCarRide', () => {
  it('flattens the first five', () => {
    const car = useCarRide();
    for (let i = 1; i <= CAR_SMASH_LIMIT; i++) {
      expect(car.hit()).toBe('smashed');
      expect(car.smashed.value).toBe(i);
    }
    expect(car.doomed.value).toBe(true);
  });

  it('crashes on the sixth', () => {
    const car = useCarRide();
    for (let i = 0; i < CAR_SMASH_LIMIT; i++) car.hit();
    expect(car.hit()).toBe('crash');
  });

  it('stays crashed, and stops counting', () => {
    const car = useCarRide();
    for (let i = 0; i < CAR_SMASH_LIMIT; i++) car.hit();
    car.hit();
    expect(car.hit()).toBe('crash');
    expect(car.smashed.value).toBe(CAR_SMASH_LIMIT);
  });

  it('counts down what is left, for the HUD', () => {
    const car = useCarRide();
    expect(car.remaining.value).toBe(CAR_SMASH_LIMIT);
    car.hit();
    car.hit();
    expect(car.remaining.value).toBe(CAR_SMASH_LIMIT - 2);
    for (let i = 0; i < 9; i++) car.hit();
    expect(car.remaining.value).toBe(0);
  });

  it('is not doomed before the fifth', () => {
    const car = useCarRide();
    for (let i = 0; i < CAR_SMASH_LIMIT - 1; i++) car.hit();
    expect(car.doomed.value).toBe(false);
  });

  it('starts over on reset, so the next car is a fresh five', () => {
    const car = useCarRide();
    for (let i = 0; i < 9; i++) car.hit();
    car.reset();
    expect(car.smashed.value).toBe(0);
    expect(car.doomed.value).toBe(false);
    expect(car.hit()).toBe('smashed');
  });
});
