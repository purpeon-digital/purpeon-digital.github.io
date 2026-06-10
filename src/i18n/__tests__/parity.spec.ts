import { describe, it, expect } from 'vitest';
import en from '@/i18n/en.json';
import no from '@/i18n/no.json';

// Only en.json is type-checked (useI18n's TranslationSchema = typeof en).
// A key missing from no.json fails silently at runtime by rendering the raw
// key path on the default-locale page — this test makes drift fail in CI.
function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => keyPaths(item, `${prefix}[${i}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      keyPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

describe('i18n translations', () => {
  it('en.json and no.json have identical key structure', () => {
    expect(keyPaths(no).sort()).toEqual(keyPaths(en).sort());
  });
});
