/**
 * Reading and writing the high score.
 *
 * This is obfuscation, not security. The value is checksummed and scrambled so
 * that opening devtools and typing a bigger number into localStorage does not
 * work, and so a corrupted entry is rejected rather than shown. Anyone willing
 * to read this file can still forge one, and anyone poking at the running page
 * can set the score directly. That is fine: the bar is "not trivially edited",
 * not "tamper proof".
 */

const KEY = 'purpeon_fox_score';
/** The plain number the game used to write, kept for a one-time migration. */
const LEGACY_KEY = 'purpeon_fox_highscore';
const SALT = 'revebjelle';
/** Above this we assume forgery rather than a very good run. */
const CEILING = 10_000_000;

/** FNV-1a. Short, no dependencies, and plenty for catching a hand edit. */
function checksum(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** XOR against the salt, so the stored text carries no readable digits. */
function scramble(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    out += String.fromCharCode(input.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
  }
  return out;
}

export function encodeScore(score: number): string {
  const body = `${score}|${checksum(`${score}${SALT}`)}`;
  return btoa(scramble(body));
}

export function decodeScore(raw: string | null): number {
  if (!raw) return 0;
  try {
    const [value, sum] = scramble(atob(raw)).split('|');
    const score = Number.parseInt(value, 10);
    if (!Number.isFinite(score) || score < 0 || score > CEILING) return 0;
    if (checksum(`${score}${SALT}`) !== Number(sum)) return 0;
    return score;
  } catch {
    // Not base64, not ours, or edited into nonsense. Start from zero rather
    // than showing whatever was in there.
    return 0;
  }
}

export function loadHighScore(): number {
  try {
    const stored = decodeScore(localStorage.getItem(KEY));
    if (stored) return stored;

    // One-time migration, so nobody loses the score they already had.
    const legacy = Number.parseInt(localStorage.getItem(LEGACY_KEY) ?? '', 10);
    if (Number.isFinite(legacy) && legacy > 0 && legacy <= CEILING) {
      localStorage.setItem(KEY, encodeScore(legacy));
      localStorage.removeItem(LEGACY_KEY);
      return legacy;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(KEY, encodeScore(score));
  } catch {
    // Private mode, storage disabled, quota. The run still counts on screen.
  }
}
