import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encodeScore,
  decodeScore,
  loadHighScore,
  saveHighScore,
} from '@/composables/useScoreStore';

const KEY = 'purpeon_fox_score';
const LEGACY_KEY = 'purpeon_fox_highscore';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useScoreStore', () => {
  describe('round trip', () => {
    it('gets back what it stored', () => {
      for (const n of [0, 1, 42, 1234, 987654]) {
        expect(decodeScore(encodeScore(n))).toBe(n);
      }
    });

    it('stores nothing that reads as the number', () => {
      const encoded = encodeScore(4321);
      expect(encoded).not.toContain('4321');
      expect(Number.parseInt(encoded, 10)).toBeNaN();
    });
  });

  describe('rejecting tampering', () => {
    it('refuses a hand-typed number', () => {
      expect(decodeScore('999999')).toBe(0);
    });

    it('refuses a value whose checksum no longer matches', () => {
      // Decode, bump the score, re-encode without fixing the checksum: this is
      // what editing the payload amounts to.
      const forged = btoa(
        [...'999|123456'].map((c, i) =>
          String.fromCharCode(c.charCodeAt(0) ^ 'revebjelle'.charCodeAt(i % 10)),
        ).join(''),
      );
      expect(decodeScore(forged)).toBe(0);
    });

    it('refuses junk, empty and missing values', () => {
      expect(decodeScore('not base64 at all !!')).toBe(0);
      expect(decodeScore('')).toBe(0);
      expect(decodeScore(null)).toBe(0);
    });

    it('refuses a number too large to have been played', () => {
      expect(decodeScore(encodeScore(50_000_000))).toBe(0);
    });

    it('refuses a negative score', () => {
      expect(decodeScore(encodeScore(-500))).toBe(0);
    });
  });

  describe('storage', () => {
    it('saves and loads through localStorage', () => {
      saveHighScore(7331);
      expect(localStorage.getItem(KEY)).not.toBeNull();
      expect(loadHighScore()).toBe(7331);
    });

    it('migrates the old plain number once, then drops it', () => {
      localStorage.setItem(LEGACY_KEY, '2500');
      expect(loadHighScore()).toBe(2500);
      expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
      expect(decodeScore(localStorage.getItem(KEY))).toBe(2500);
    });

    it('ignores an old value that was itself edited beyond reason', () => {
      localStorage.setItem(LEGACY_KEY, '99999999999');
      expect(loadHighScore()).toBe(0);
    });

    it('starts from zero when storage holds something corrupt', () => {
      localStorage.setItem(KEY, 'rubbish');
      expect(loadHighScore()).toBe(0);
    });

    it('survives storage being unavailable', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      expect(() => saveHighScore(10)).not.toThrow();
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(loadHighScore()).toBe(0);
    });
  });
});
