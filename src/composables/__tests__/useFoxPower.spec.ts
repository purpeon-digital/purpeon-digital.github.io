import { describe, it, expect } from 'vitest';
import {
  useFoxPower,
  POWER_STREAK,
  POWER_MS,
  POWER_WARN_MS,
} from '@/composables/useFoxPower';

/** Pick n foxgloves, returning how many of them lit the power-up. */
function pick(power: ReturnType<typeof useFoxPower>, n: number): number {
  let lit = 0;
  for (let i = 0; i < n; i++) if (power.collectFlower() === 'lit') lit++;
  return lit;
}

describe('useFoxPower', () => {
  describe('earning it', () => {
    it('stays dark for the first four foxgloves', () => {
      const power = useFoxPower();
      expect(pick(power, POWER_STREAK - 1)).toBe(0);
      expect(power.isActive.value).toBe(false);
      expect(power.shieldReady.value).toBe(false);
      expect(power.streak.value).toBe(POWER_STREAK - 1);
    });

    it('lights up on the fifth in a row', () => {
      const power = useFoxPower();
      expect(pick(power, POWER_STREAK)).toBe(1);
      expect(power.isActive.value).toBe(true);
      expect(power.shieldReady.value).toBe(true);
      expect(power.timeLeft.value).toBe(POWER_MS);
      // The streak starts over, so the next five earn it again.
      expect(power.streak.value).toBe(0);
    });

    it('starts the count over when a foxglove is missed', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK - 1);
      power.missFlower();
      expect(power.streak.value).toBe(0);
      expect(pick(power, POWER_STREAK - 1)).toBe(0);
      expect(power.isActive.value).toBe(false);
    });

    it('can be earned again later in the same run', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.tick(POWER_MS);
      expect(power.isActive.value).toBe(false);
      expect(pick(power, POWER_STREAK)).toBe(1);
      expect(power.shieldReady.value).toBe(true);
    });
  });

  describe('keeping it lit', () => {
    it('pushes the clock back to full on every further foxglove', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.tick(7000);
      expect(power.timeLeft.value).toBe(POWER_MS - 7000);

      expect(power.collectFlower()).toBe('refreshed');
      expect(power.timeLeft.value).toBe(POWER_MS);
      expect(power.shieldReady.value).toBe(true);
    });

    it('does not spend the streak while already lit', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.collectFlower();
      power.collectFlower();
      expect(power.streak.value).toBe(0);
      // Once it lapses, a fresh five is still what it takes.
      power.tick(POWER_MS);
      expect(pick(power, POWER_STREAK - 1)).toBe(0);
      expect(pick(power, 1)).toBe(1);
    });

    it('lets a miss cost the top-up without cutting the window short', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.tick(6000);
      const left = power.timeLeft.value;

      power.missFlower();
      expect(power.timeLeft.value).toBe(left);
      expect(power.isActive.value).toBe(true);
      expect(power.shieldReady.value).toBe(true);

      // And it still runs out on schedule rather than being extended.
      power.tick(left);
      expect(power.isActive.value).toBe(false);
    });

    it('cannot be refreshed once the window has closed', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.tick(POWER_MS);
      expect(power.collectFlower()).toBe('none');
      expect(power.timeLeft.value).toBe(0);
      expect(power.streak.value).toBe(1);
    });
  });

  describe('signals for the sound design', () => {
    it('counts the top-ups so the pickup can climb in pitch', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      expect(power.refreshes.value).toBe(0);
      power.collectFlower();
      power.collectFlower();
      expect(power.refreshes.value).toBe(2);
    });

    it('starts the climb over when the mode lapses', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.collectFlower();
      power.tick(POWER_MS);
      expect(power.refreshes.value).toBe(0);
      pick(power, POWER_STREAK);
      expect(power.refreshes.value).toBe(0);
    });

    it('starts the climb over when the extra life is spent', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.collectFlower();
      power.consumeShield();
      expect(power.refreshes.value).toBe(0);
    });

    it('reports a broken streak, so only a real loss sounds a fail', () => {
      const power = useFoxPower();
      // Nothing going: a missed foxglove is not a loss.
      expect(power.missFlower()).toBe(false);
      pick(power, 2);
      expect(power.missFlower()).toBe(true);
      // And the next miss, with the count already at zero, is not either.
      expect(power.missFlower()).toBe(false);
    });

    it('does not call a miss during the mode a broken streak', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      expect(power.missFlower()).toBe(false);
    });
  });

  describe('the ten seconds', () => {
    it('counts down and drops the extra life when the window closes', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);

      power.tick(4000);
      expect(power.timeLeft.value).toBe(POWER_MS - 4000);
      expect(power.shieldReady.value).toBe(true);

      power.tick(POWER_MS);
      expect(power.timeLeft.value).toBe(0);
      expect(power.isActive.value).toBe(false);
      expect(power.shieldReady.value).toBe(false);
    });

    it('reports seconds left for the HUD, rounded up', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      expect(power.secondsLeft.value).toBe(10);
      power.tick(1200);
      expect(power.secondsLeft.value).toBe(9);
      power.tick(POWER_MS);
      expect(power.secondsLeft.value).toBe(0);
    });

    it('flags the last stretch so the fox can blink a warning', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      expect(power.isExpiring.value).toBe(false);
      power.tick(POWER_MS - POWER_WARN_MS);
      expect(power.isExpiring.value).toBe(true);
      power.tick(POWER_WARN_MS);
      expect(power.isExpiring.value).toBe(false);
    });

    it('does nothing on tick while dark', () => {
      const power = useFoxPower();
      power.tick(5000);
      expect(power.timeLeft.value).toBe(0);
      expect(power.isActive.value).toBe(false);
    });
  });

  describe('spending it', () => {
    it('absorbs one hit', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      expect(power.consumeShield()).toBe(true);
    });

    it('is gone after that one hit, and so is the power-up', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.consumeShield();
      expect(power.consumeShield()).toBe(false);
      expect(power.isActive.value).toBe(false);
      expect(power.timeLeft.value).toBe(0);
    });

    it('absorbs nothing when it was never earned', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK - 1);
      expect(power.consumeShield()).toBe(false);
    });

    it('absorbs nothing once the window has closed', () => {
      const power = useFoxPower();
      pick(power, POWER_STREAK);
      power.tick(POWER_MS);
      expect(power.consumeShield()).toBe(false);
    });
  });

  it('clears everything on reset, so a new run starts dark', () => {
    const power = useFoxPower();
    pick(power, POWER_STREAK);
    power.collectFlower();
    power.reset();
    expect(power.streak.value).toBe(0);
    expect(power.timeLeft.value).toBe(0);
    expect(power.shieldReady.value).toBe(false);
    expect(power.isActive.value).toBe(false);
  });
});
