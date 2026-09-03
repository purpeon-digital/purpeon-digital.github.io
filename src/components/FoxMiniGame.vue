<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';
import { useFoxPower, POWER_MS } from '@/composables/useFoxPower';
import IconVolumeHigh from '~icons/fa7-solid/volume-high';
import IconVolumeXmark from '~icons/fa7-solid/volume-xmark';
import IconXmark from '~icons/fa7-solid/xmark';
import IconRotateRight from '~icons/fa7-solid/rotate-right';

const props = defineProps<{
  locale: Locale;
}>();

const { t } = useI18n(props.locale);

// Five foxgloves in a row light the fox up in Purpeon colours and buy one
// extra life for ten seconds. Rules live in the composable so they can be
// tested; everything here is what they look and sound like.
const power = useFoxPower();

const isOpen = ref(false);
const isPlaying = ref(false);
const isGameOver = ref(false);
const isMuted = ref(false);
const isNewRecord = ref(false);

const score = ref(0);
// Everything earned while the fox is lit counts twice. Rather than scaling the
// running totals, the second copy is banked here and added to the score, so the
// 🌸 counter keeps meaning "foxgloves picked" and nothing double-counts on a
// recompute.
const bonusScore = ref(0);
// Three separate numbers, because the old one was all three at once: it was
// labelled foxgloves, counted 1/2/4 depending on what you grabbed, and doubled
// as the score currency. A crystal made the "foxglove" tally jump by two.
/** How many things have been picked up, whatever they were. */
const pickupsCollected = ref(0);
/** Foxgloves only. This is the one the streak and the extra life run on. */
const flowerCount = ref(0);
/** Score currency: 1 per foxglove, 2 per crystal, 4 per star, 25 points each. */
const pickupPoints = ref(0);
const distanceMeters = ref(0);
const highScore = ref(0);

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let audioCtx: AudioContext | null = null;

// Game state variables
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'star' | 'sparkle';
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  fade: number;
  size: number;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'rock' | 'stump' | 'bush' | 'pillar';
}

interface Collectible {
  x: number;
  /** Live position, recomputed every frame from baseY plus the type's wave. */
  y: number;
  /** The height it was spawned at; the wave swings around this. */
  baseY: number;
  size: number;
  type: 'flower' | 'crystal' | 'star';
  collected: boolean;
  pulseOffset: number;
}

// Purpeon violets and magentas, cycled per frame so the lit fox shimmers
// rather than sitting on one flat colour.
const POWER_COAT = ['#7c3aed', '#a855f7', '#c026d3', '#ec4899'];
const POWER_COAT_DARK = ['#5b21b6', '#7e22ce', '#86198f', '#be185d'];

/**
 * How each pickup drifts. The star is worth the most, so it is the one that
 * refuses to sit still; the crystal moves too, but slower and over less ground.
 * The amplitudes are capped so the lowest spawn height still clears the ground.
 *
 * This drives the hitbox, not just the drawing. The old bob was applied at
 * render time only, so a collectible was caught where it looked like it was
 * not, and moving it would have changed nothing about the difficulty.
 */
const DRIFT: Record<Collectible['type'], { amp: number; speed: number }> = {
  flower: { amp: 4, speed: 2 },
  crystal: { amp: 14, speed: 1.2 },
  star: { amp: 34, speed: 3.4 }
};

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GROUND_Y = 320;
const GRAVITY = 0.62;
const JUMP_FORCE = -12.2;
const DOUBLE_JUMP_FORCE = -10.8;

const fox = {
  x: 100,
  y: GROUND_Y - 38,
  vy: 0,
  w: 58,
  h: 38,
  isGrounded: true,
  jumpsLeft: 2,
  rotation: 0,
  isSpinning: false,
  spinProgress: 0,
  runTick: 0,
  deathTimer: 0
};

let obstacles: Obstacle[] = [];
let collectibles: Collectible[] = [];
let particles: Particle[] = [];
let floatingTexts: FloatingText[] = [];

let gameSpeed = 5.2;
// Frames of grace after the extra life absorbs a hit, so the fox is not struck
// again by the same rock on the very next frame while it is still overlapping.
let hitCooldown = 0;
let spawnTimer = 0;
let collectibleTimer = 0;
let cloudOffset = 0;
let mountainOffset = 0;
let treeOffset = 0;
let groundOffset = 0;

// Sound Synthesizer (Web Audio API)
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type: 'jump' | 'doubleJump' | 'flower' | 'crystal' | 'star' | 'hit' | 'record' | 'power' | 'save' | 'fail') {
  if (isMuted.value) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    if (type === 'jump') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'doubleJump') {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.16);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.16);
      osc2.stop(now + 0.16);
    } else if (type === 'flower') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'crystal') {
      const notes = [587.33, 880, 1174.66];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.15, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.14);
      });
    } else if (type === 'star') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.18, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.18);
      });
    } else if (type === 'fail') {
      // Two notes down, dull and low: the streak just went.
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(196, now);
      osc.frequency.setValueAtTime(146.83, now + 0.11);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'power') {
      // Rising arpeggio, the star fanfare. Four notes up the Purpeon chord.
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.24);
      });
    } else if (type === 'save') {
      // Thud plus a recovery chirp: something was spent, but the run goes on.
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.18);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === 'hit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'record') {
      const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      fanfare.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    }
  } catch (e) {
    // Ignore audio errors on unsupported environments
  }
}

function activatePower() {
  playSound('power');
  createSparkleBurst(fox.x + fox.w / 2, fox.y + fox.h / 2, '#e879f9', 30);
  createSparkleBurst(fox.x + fox.w / 2, fox.y + fox.h / 2, '#a855f7', 22);
  addFloatingText(fox.x + fox.w / 2, fox.y - 26, t('game.powerUp'), '#f0abfc');
}

/**
 * The pickup, pitched up a semitone per top-up so a chain of foxgloves climbs.
 * Caps after an octave, otherwise a long run turns into a dog whistle.
 */
function playPitchedPickup(step: number) {
  if (isMuted.value) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const ratio = Math.pow(2, Math.min(step, 12) / 12);
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25 * ratio, now);
    osc.frequency.setValueAtTime(880 * ratio, now + 0.06);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {}
}

// A top-up, not a new power-up: the pickup climbing in pitch, and a small
// burst, so keeping the fox lit sounds different from earning it.
function refreshPower(x: number, y: number) {
  playPitchedPickup(power.refreshes.value);
  createSparkleBurst(x, y, '#f0abfc', 14);
}

// ----------------------------------------------------
// MUSIC
// A synthesised chiptune loop, same approach as the sound effects: no audio
// assets, nothing to download. Notes are queued against the AudioContext clock
// by a look-ahead scheduler rather than fired from a timer, because setInterval
// drifts and the game already owns the animation frame.
// ----------------------------------------------------
const NOTE: Record<string, number> = {
  C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0
};

// Eight bars of C major, sixteen sixteenths to the bar, written a bar at a
// time so the tune stays readable. `null` is a rest; a note holds until the
// next entry. At 132 BPM the loop runs 14.5 seconds before it comes round,
// which is long enough not to nag.
const bar = (...steps: (string | null)[]) => steps;
const _ = null;

const MELODY: (string | null)[] = [
  // C                                    G
  ...bar('E5', _, 'E5', _, 'G5', _, _, _, 'A5', _, _, _, 'G5', _, _, _),
  ...bar('E5', _, _, _, 'D5', _, _, _, 'D5', _, _, _, _, _, _, _),
  // Am                                   Em
  ...bar('C5', _, 'C5', _, 'E5', _, _, _, 'G5', _, _, _, 'E5', _, _, _),
  ...bar('D5', _, _, _, 'C5', _, _, _, 'B4', _, _, _, _, _, _, _),
  // F                                    C
  ...bar('A5', _, _, _, 'A5', _, _, _, 'G5', _, _, _, 'F5', _, _, _),
  ...bar('E5', _, _, _, 'F5', _, _, _, 'G5', _, _, _, _, _, _, _),
  // F                                    G
  ...bar('F5', _, _, _, 'E5', _, _, _, 'D5', _, _, _, 'E5', _, _, _),
  ...bar('D5', _, _, _, 'G4', _, _, _, 'C5', _, _, _, _, _, _, _)
];

// Root and fifth, one pair per bar, so the harmony moves once a bar instead of
// once a beat. The old loop changed chord every quarter note, which is part of
// why it felt like it was hurrying.
const BASS: (string | null)[] = [
  ...bar('C3', _, _, _, _, _, _, _, 'G3', _, _, _, _, _, _, _),
  ...bar('G3', _, _, _, _, _, _, _, 'B3', _, _, _, _, _, _, _),
  ...bar('A3', _, _, _, _, _, _, _, 'E3', _, _, _, _, _, _, _),
  ...bar('E3', _, _, _, _, _, _, _, 'B3', _, _, _, _, _, _, _),
  ...bar('F3', _, _, _, _, _, _, _, 'C4', _, _, _, _, _, _, _),
  ...bar('C3', _, _, _, _, _, _, _, 'G3', _, _, _, _, _, _, _),
  ...bar('F3', _, _, _, _, _, _, _, 'C4', _, _, _, _, _, _, _),
  ...bar('G3', _, _, _, _, _, _, _, 'B3', _, _, _, _, _, _, _)
];

const MUSIC_BPM = 132;
let musicTimer: number | null = null;
let musicStep = 0;
let nextNoteTime = 0;

function playTone(freq: number, at: number, dur: number, type: OscillatorType, level: number) {
  const ctx = audioCtx;
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function scheduleMusic() {
  const ctx = audioCtx;
  if (!ctx || isMuted.value) return;
  // A suspended context has a frozen clock, so scheduling against it would
  // queue a pile of notes that all fire at once the moment it resumes.
  if (ctx.state !== 'running') return;
  // While the fox is lit the loop runs half again as fast and an octave up:
  // the same tune, wound up.
  const lit = power.isActive.value;
  const stepDur = 60 / (MUSIC_BPM * (lit ? 1.5 : 1)) / 4;

  while (nextNoteTime < ctx.currentTime + 0.15) {
    const i = musicStep % MELODY.length;
    const mel = MELODY[i];
    if (mel) {
      playTone(NOTE[mel] * (lit ? 2 : 1), nextNoteTime, stepDur * 1.8,
               lit ? 'square' : 'triangle', lit ? 0.05 : 0.055);
    }
    const bass = BASS[i];
    if (bass) playTone(NOTE[bass], nextNoteTime, stepDur * 3.2, 'triangle', 0.05);

    nextNoteTime += stepDur;
    musicStep += 1;
  }
}

function startMusic() {
  const ctx = getAudioContext();
  if (!ctx || isMuted.value || musicTimer !== null) return;
  musicStep = 0;
  nextNoteTime = ctx.currentTime + 0.08;
  scheduleMusic();
  musicTimer = window.setInterval(scheduleMusic, 25);
}

function stopMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

function resetGame() {
  score.value = 0;
  bonusScore.value = 0;
  pickupsCollected.value = 0;
  flowerCount.value = 0;
  pickupPoints.value = 0;
  distanceMeters.value = 0;
  isGameOver.value = false;
  isNewRecord.value = false;
  gameSpeed = 5.2;
  spawnTimer = 50;
  collectibleTimer = 30;

  fox.y = GROUND_Y - fox.h;
  fox.vy = 0;
  fox.isGrounded = true;
  fox.jumpsLeft = 2;
  fox.rotation = 0;
  fox.isSpinning = false;
  fox.spinProgress = 0;
  fox.runTick = 0;
  fox.deathTimer = 0;

  obstacles = [];
  collectibles = [];
  particles = [];
  floatingTexts = [];
  power.reset();
  hitCooldown = 0;
}

function startGame() {
  resetGame();
  isPlaying.value = true;
  getAudioContext();
  startMusic();
  lastFrameTime = performance.now();
  if (!animationFrameId) {
    gameLoop(performance.now());
  }
}

function jump() {
  if (!isPlaying.value) {
    if (isGameOver.value) {
      startGame();
    } else {
      startGame();
    }
    return;
  }

  if (fox.jumpsLeft > 0) {
    if (fox.isGrounded) {
      // First jump
      fox.vy = JUMP_FORCE;
      fox.isGrounded = false;
      fox.jumpsLeft = 1;
      playSound('jump');

      // Dust puff on jump
      createDustPuff(fox.x + 15, GROUND_Y, 8);
    } else {
      // Double jump
      fox.vy = DOUBLE_JUMP_FORCE;
      fox.jumpsLeft = 0;
      fox.isSpinning = true;
      fox.spinProgress = 0;
      playSound('doubleJump');

      // Sparkle particles for double jump
      createSparkleBurst(fox.x + fox.w / 2, fox.y + fox.h / 2, '#c084fc', 12);
    }
  }
}

function createDustPuff(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - Math.random() * 4,
      vx: -gameSpeed * 0.3 - Math.random() * 2,
      vy: -Math.random() * 1.8,
      size: 3 + Math.random() * 4,
      color: 'rgba(216, 180, 254, 0.6)',
      alpha: 0.8,
      life: 0,
      maxLife: 20 + Math.random() * 15,
      shape: 'circle'
    });
  }
}

function createSparkleBurst(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const spd = 2 + Math.random() * 3.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      size: 3 + Math.random() * 3,
      color,
      alpha: 1,
      life: 0,
      maxLife: 25 + Math.random() * 15,
      shape: 'sparkle'
    });
  }
}

function addFloatingText(
  x: number,
  y: number,
  text: string,
  color: string,
  opts: { vy?: number; fade?: number; size?: number } = {}
) {
  floatingTexts.push({
    x,
    y,
    text,
    color,
    alpha: 1,
    // Slower fade than before across the board: the old 0.025 per frame gave
    // about 1.6 s at best, which was gone before you had read it.
    vy: opts.vy ?? -1.8,
    fade: opts.fade ?? 0.014,
    size: opts.size ?? 16
  });
}

function triggerGameOver() {
  isPlaying.value = false;
  isGameOver.value = true;
  stopMusic();
  playSound('hit');

  // Death particles
  createSparkleBurst(fox.x + fox.w / 2, fox.y + fox.h / 2, '#f97316', 20);

  // Check highscore
  if (score.value > highScore.value) {
    highScore.value = score.value;
    isNewRecord.value = true;
    try {
      localStorage.setItem('purpeon_fox_highscore', String(highScore.value));
    } catch (e) {}
    setTimeout(() => {
      playSound('record');
      createSparkleBurst(GAME_WIDTH / 2, GAME_HEIGHT / 2, '#fbbf24', 40);
    }, 200);
  }
}

let lastFrameTime = 0;

function gameLoop(currentTime: number) {
  const delta = Math.min((currentTime - lastFrameTime) / 16.666, 2.5);
  lastFrameTime = currentTime;

  updateGame(delta);
  renderGame();

  if (isOpen.value) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function updateGame(delta: number) {
  if (!isPlaying.value) {
    // Idle animation background scroll slowly
    cloudOffset = (cloudOffset + 0.3 * delta) % GAME_WIDTH;
    mountainOffset = (mountainOffset + 0.15 * delta) % GAME_WIDTH;
    treeOffset = (treeOffset + 0.5 * delta) % GAME_WIDTH;
    groundOffset = (groundOffset + 1.0 * delta) % GAME_WIDTH;
    fox.runTick += 0.08 * delta;
    updateParticles(delta);
    return;
  }

  // Update distance and score
  const gained = (gameSpeed * 0.15) * delta;
  distanceMeters.value += gained;
  if (power.isActive.value) bonusScore.value += gained;
  score.value = Math.floor(distanceMeters.value + bonusScore.value) + pickupPoints.value * 25;

  // Gradually increase speed smoothly
  if (gameSpeed < 10.5) {
    gameSpeed += 0.0012 * delta;
  }

  // Parallax offsets
  cloudOffset = (cloudOffset + 0.4 * delta) % GAME_WIDTH;
  mountainOffset = (mountainOffset + gameSpeed * 0.12 * delta) % GAME_WIDTH;
  treeOffset = (treeOffset + gameSpeed * 0.35 * delta) % GAME_WIDTH;
  groundOffset = (groundOffset + gameSpeed * delta) % GAME_WIDTH;

  // Fox physics
  fox.vy += GRAVITY * delta;
  fox.y += fox.vy * delta;
  fox.runTick += (gameSpeed * 0.08) * delta;

  // Ground collision
  if (fox.y >= GROUND_Y - fox.h) {
    if (!fox.isGrounded) {
      createDustPuff(fox.x + 10, GROUND_Y, 5);
    }
    fox.y = GROUND_Y - fox.h;
    fox.vy = 0;
    fox.isGrounded = true;
    fox.jumpsLeft = 2;
    fox.isSpinning = false;
    fox.rotation = 0;
  }

  // Running dust particles
  if (fox.isGrounded && Math.random() < 0.3) {
    particles.push({
      x: fox.x + 5,
      y: GROUND_Y - 2,
      vx: -gameSpeed * 0.5 - Math.random() * 1.5,
      vy: -Math.random() * 1.2,
      size: 2.5 + Math.random() * 3,
      color: 'rgba(233, 213, 255, 0.5)',
      alpha: 0.7,
      life: 0,
      maxLife: 16 + Math.random() * 10,
      shape: 'circle'
    });
  }

  // Spin animation on double jump
  if (fox.isSpinning) {
    fox.spinProgress += 0.18 * delta;
    fox.rotation = fox.spinProgress * Math.PI * 2;
    if (fox.spinProgress >= 1) {
      fox.isSpinning = false;
      fox.rotation = 0;
    }
    // Particle trail
    particles.push({
      x: fox.x + fox.w / 2 + (Math.random() - 0.5) * 20,
      y: fox.y + fox.h / 2 + (Math.random() - 0.5) * 20,
      vx: -gameSpeed * 0.3,
      vy: (Math.random() - 0.5) * 1.5,
      size: 3 + Math.random() * 3,
      color: Math.random() > 0.5 ? '#e879f9' : '#c084fc',
      alpha: 0.9,
      life: 0,
      maxLife: 20,
      shape: 'sparkle'
    });
  }

  // Power-up countdown. `delta` is in frames, so scale it back to real time.
  power.tick(delta * 16.666);
  if (hitCooldown > 0) hitCooldown -= delta;

  // Comet trail while the fox is lit
  if (power.isActive.value) {
    particles.push({
      x: fox.x + 4 + Math.random() * fox.w * 0.6,
      y: fox.y + Math.random() * fox.h,
      vx: -gameSpeed * 0.6,
      vy: (Math.random() - 0.5) * 1.2,
      size: 2 + Math.random() * 3.5,
      color: POWER_COAT[Math.floor(Math.random() * POWER_COAT.length)],
      alpha: 0.85,
      life: 0,
      maxLife: 16 + Math.random() * 12,
      shape: 'sparkle'
    });
  }

  // Spawn obstacles
  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    // The pillar is the odd one out and is weighted to roughly one in seven,
    // because it is the only obstacle a single jump cannot clear.
    const obstacleTypes: Obstacle['type'][] =
      ['rock', 'stump', 'bush', 'rock', 'stump', 'bush', 'pillar'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    let w = 32;
    let h = 34;
    if (type === 'rock') {
      w = 34 + Math.random() * 12;
      h = 30 + Math.random() * 10;
    } else if (type === 'stump') {
      w = 30 + Math.random() * 8;
      h = 38 + Math.random() * 8;
    } else if (type === 'pillar') {
      // A single jump lifts the fox about 120px, a double about 214. Anything
      // in between forces the second jump; 132 to 144 sits clear of both edges
      // so a sloppy double still makes it and a single never does.
      w = 24 + Math.random() * 6;
      h = 132 + Math.random() * 12;
    } else {
      w = 42 + Math.random() * 10;
      h = 28 + Math.random() * 8;
    }

    obstacles.push({
      x: GAME_WIDTH + 20,
      y: GROUND_Y - h,
      w,
      h,
      type
    });

    // Random interval between obstacles (spaced so always jumpable). A pillar
    // gets extra room after it, since the double jump needs to be started early
    // and lands the fox further along.
    spawnTimer = (55 + Math.random() * 45) / (gameSpeed / 5.2);
    if (type === 'pillar') spawnTimer *= 1.6;
  }

  // Spawn collectibles
  collectibleTimer -= delta;
  if (collectibleTimer <= 0) {
    const types: ('flower' | 'crystal' | 'star')[] = ['flower', 'flower', 'crystal', 'star'];
    const type = types[Math.floor(Math.random() * types.length)];
    const heightLevels = [GROUND_Y - 55, GROUND_Y - 95, GROUND_Y - 130];
    const y = heightLevels[Math.floor(Math.random() * heightLevels.length)];

    collectibles.push({
      x: GAME_WIDTH + 30,
      y,
      baseY: y,
      size: type === 'star' ? 16 : 14,
      type,
      collected: false,
      pulseOffset: Math.random() * Math.PI * 2
    });

    collectibleTimer = (40 + Math.random() * 50) / (gameSpeed / 5.2);
  }

  // Move and check obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed * delta;

    // Collision check (shrink hitbox slightly for forgiving gameplay)
    const paddingX = 8;
    const paddingY = 6;
    if (
      hitCooldown <= 0 &&
      fox.x + paddingX < obs.x + obs.w - paddingX &&
      fox.x + fox.w - paddingX > obs.x + paddingX &&
      fox.y + paddingY < obs.y + obs.h &&
      fox.y + fox.h > obs.y + paddingY
    ) {
      if (power.consumeShield()) {
        // The obstacle is removed rather than jumped over: the fox smashed
        // through it, and leaving it in place would just hit again next frame.
        obstacles.splice(i, 1);
        hitCooldown = 30;
        playSound('save');
        createSparkleBurst(obs.x + obs.w / 2, obs.y + obs.h / 2, '#c026d3', 24);
        addFloatingText(fox.x + fox.w / 2, fox.y - 22, t('game.powerUsed'), '#f0abfc');
        continue;
      }
      triggerGameOver();
      return;
    }

    if (obs.x + obs.w < -50) {
      obstacles.splice(i, 1);
    }
  }

  // Move and check collectibles
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const col = collectibles[i];
    col.x -= gameSpeed * delta;
    const drift = DRIFT[col.type];
    col.y = col.baseY + Math.sin(fox.runTick * drift.speed + col.pulseOffset) * drift.amp;

    // Check pickup
    if (!col.collected) {
      const dx = (fox.x + fox.w / 2) - col.x;
      const dy = (fox.y + fox.h / 2) - col.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < fox.w / 2 + col.size) {
        col.collected = true;
        // `x2` has to be read before collectFlower(), or a foxglove that
        // lights the fox would already be counting double when it is the
        // pickup that earned the mode in the first place.
        pickupsCollected.value++;
        // `x2` has to be read before collectFlower(), or a foxglove that
        // lights the fox would already be counting double when it is the
        // pickup that earned the mode in the first place.
        const x2 = power.isActive.value;
        const worth = (base: number) => {
          pickupPoints.value += base;
          if (x2) bonusScore.value += base * 25;
          return `+${base * 25 * (x2 ? 2 : 1)}`;
        };

        if (col.type === 'flower') {
          flowerCount.value++;
          const label = worth(1);
          const outcome = power.collectFlower();
          if (outcome === 'lit') activatePower();
          else if (outcome === 'refreshed') refreshPower(col.x, col.y);
          else {
            playSound('flower');
            createSparkleBurst(col.x, col.y, '#e879f9', 10);
          }
          addFloatingText(col.x, col.y - 10, `${label} 🌸`, x2 ? '#f0abfc' : '#f472b6');
          // The running foxglove tally, thrown higher and held longer than the
          // points so the two read as separate things rather than one line.
          addFloatingText(col.x, col.y - 26, String(flowerCount.value), '#fbcfe8', {
            vy: -3.1,
            fade: 0.0105,
            size: 21
          });
        } else if (col.type === 'crystal') {
          const label = worth(2);
          playSound('crystal');
          createSparkleBurst(col.x, col.y, '#a78bfa', 14);
          addFloatingText(col.x, col.y - 10, `${label} 💎`, '#c084fc');
        } else if (col.type === 'star') {
          const label = worth(4);
          playSound('star');
          createSparkleBurst(col.x, col.y, '#fbbf24', 18);
          addFloatingText(col.x, col.y - 10, `${label} ⭐`, '#fbbf24');
        }
      }
    }

    if (col.x < -50 || col.collected) {
      // A foxglove that went past uncollected breaks the run of five.
      // Crystals and stars are a different pickup and leave the streak alone.
      if (!col.collected && col.type === 'flower' && power.missFlower()) playSound('fail');
      collectibles.splice(i, 1);
    }
  }

  updateParticles(delta);
}

function updateParticles(delta: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += delta;
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.alpha = 1 - p.life / p.maxLife;

    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
    }
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy * delta;
    ft.alpha -= ft.fade * delta;

    if (ft.alpha <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

// ----------------------------------------------------
// CANVAS RENDERING
// ----------------------------------------------------
function renderGame() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // 1. Sky Gradient (Sogn twilight purple / amber)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(0.35, '#1e1b4b');
  skyGrad.addColorStop(0.7, '#431407');
  skyGrad.addColorStop(0.85, '#581c87');
  skyGrad.addColorStop(1, '#1e1035');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Distant stars / moon glow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  const starSeeds = [
    [50, 40, 1.5], [120, 70, 2], [230, 30, 1], [340, 80, 2.5],
    [450, 45, 1.5], [560, 90, 2], [670, 35, 1.5], [740, 65, 2]
  ];
  starSeeds.forEach(([sx, sy, sz]) => {
    ctx.beginPath();
    ctx.arc(sx, sy, sz, 0, Math.PI * 2);
    ctx.fill();
  });

  // Soft crescent moon
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(710, 65, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(702, 60, 20, 0, Math.PI * 2);
  ctx.fill();

  // 2. Parallax Mountains
  ctx.fillStyle = '#2e1065';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= GAME_WIDTH + 100; x += 100) {
    const worldX = x + mountainOffset;
    const peakY = 160 + Math.sin(worldX * 0.015) * 45 + Math.cos(worldX * 0.008) * 30;
    ctx.lineTo(x, peakY);
  }
  ctx.lineTo(GAME_WIDTH, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // 3. Parallax Pine Forest Layer
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = -20; x <= GAME_WIDTH + 40; x += 35) {
    const worldX = x + treeOffset;
    const treeHeight = 55 + Math.sin(worldX * 0.05) * 18;
    ctx.lineTo(x, GROUND_Y - treeHeight);
    ctx.lineTo(x + 18, GROUND_Y);
  }
  ctx.closePath();
  ctx.fill();

  // 4. Ground Layer
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
  groundGrad.addColorStop(0, '#064e3b');
  groundGrad.addColorStop(0.15, '#022c22');
  groundGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

  // Top grass trim
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(GAME_WIDTH, GROUND_Y);
  ctx.stroke();

  // Decorative grass blades
  ctx.fillStyle = '#10b981';
  for (let x = 0; x < GAME_WIDTH; x += 22) {
    const gx = (x - groundOffset % 22 + GAME_WIDTH) % GAME_WIDTH;
    ctx.fillRect(gx, GROUND_Y - 4, 3, 4);
    ctx.fillRect(gx + 6, GROUND_Y - 6, 2, 6);
  }

  // 5. Render Obstacles
  obstacles.forEach(obs => {
    ctx.save();
    if (obs.type === 'rock') {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Moss top
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.w / 2, obs.y + 4, obs.w / 2.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.type === 'stump') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.w / 2, obs.y + 3, obs.w / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Green sprout
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(obs.x + 4, obs.y - 5, 4, 6);
    } else if (obs.type === 'pillar') {
      // Standing stone: narrow, tall, and unmistakably not a hop.
      const cx = obs.x + obs.w / 2;
      ctx.fillStyle = '#3f4a5f';
      ctx.beginPath();
      ctx.moveTo(obs.x + 3, obs.y + obs.h);
      ctx.lineTo(obs.x + 1, obs.y + 14);
      ctx.lineTo(cx, obs.y);
      ctx.lineTo(obs.x + obs.w - 1, obs.y + 14);
      ctx.lineTo(obs.x + obs.w - 3, obs.y + obs.h);
      ctx.closePath();
      ctx.fill();
      // Lit edge down the left, so it reads as stone rather than a bar.
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(obs.x + 3, obs.y + obs.h);
      ctx.lineTo(obs.x + 1, obs.y + 14);
      ctx.lineTo(cx, obs.y);
      ctx.lineTo(cx, obs.y + obs.h);
      ctx.closePath();
      ctx.fill();
      // Moss at the foot and a violet cap, to tie it to the rest of the scene.
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(cx, obs.y + obs.h - 4, obs.w / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, obs.y + 6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Bush
      ctx.fillStyle = '#1e3a29';
      ctx.beginPath();
      ctx.arc(obs.x + 12, obs.y + 16, 12, 0, Math.PI * 2);
      ctx.arc(obs.x + 24, obs.y + 12, 14, 0, Math.PI * 2);
      ctx.arc(obs.x + 34, obs.y + 16, 11, 0, Math.PI * 2);
      ctx.fill();
      // Flower buds on bush
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(obs.x + 16, obs.y + 8, 3, 0, Math.PI * 2);
      ctx.arc(obs.x + 28, obs.y + 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // 6. Render Collectibles
  collectibles.forEach(col => {
    if (col.collected) return;
    ctx.save();
    // col.y already carries the drift, so what you see is what you can catch.
    const cy = col.y;

    if (col.type === 'flower') {
      // Foxglove (Revebjelle)
      ctx.fillStyle = '#d946ef';
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(col.x, cy, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf4ff';
      ctx.beginPath();
      ctx.arc(col.x, cy + 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (col.type === 'crystal') {
      // Purpeon Crystal
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(col.x, cy - 10);
      ctx.lineTo(col.x + 8, cy);
      ctx.lineTo(col.x, cy + 10);
      ctx.lineTo(col.x - 8, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(col.x - 2, cy - 4, 4, 8);
    } else {
      // Golden Star
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 15;
      drawStar(ctx, col.x, cy, 5, 10, 5);
    }
    ctx.restore();
  });

  // 7. Render Particles
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    if (p.shape === 'sparkle') {
      drawStar(ctx, p.x, p.y, 4, p.size, p.size * 0.4);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // 8. Render Fox
  renderFox(ctx);

  // 9. Floating score text popups
  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.alpha);
    ctx.font = `bold ${ft.size}px -apple-system, sans-serif`;
    ctx.fillStyle = ft.color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function renderFox(ctx: CanvasRenderingContext2D) {
  // While the power-up is up the coat runs through the Purpeon palette. In the
  // last stretch it flickers back to orange every other beat, so the window
  // closing is visible without a number having to be read.
  const shimmer = Math.floor(fox.runTick * 3);
  const blinkOff = power.isExpiring.value && shimmer % 2 === 0;
  const lit = power.isActive.value && !blinkOff;
  const coat = lit ? POWER_COAT[shimmer % POWER_COAT.length] : '#ea580c';
  const coatDark = lit ? POWER_COAT_DARK[shimmer % POWER_COAT_DARK.length] : '#c2410c';

  ctx.save();
  ctx.translate(fox.x + fox.w / 2, fox.y + fox.h / 2);

  // Aura, drawn before the rotation so it stays a steady halo through a spin.
  if (power.isActive.value) {
    const pulse = 1 + Math.sin(fox.runTick * 5) * 0.12;
    const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 44 * pulse);
    glow.addColorStop(0, 'rgba(232, 121, 249, 0.42)');
    glow.addColorStop(0.55, 'rgba(168, 85, 247, 0.20)');
    glow.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 44 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Two slow-turning sparks, the bit that reads as a Mario star.
    for (const dir of [1, -1]) {
      const a = fox.runTick * 1.6 * dir;
      ctx.fillStyle = dir > 0 ? '#f0abfc' : '#fde68a';
      drawStar(ctx, Math.cos(a) * 34, Math.sin(a) * 22, 5, 5.5, 2.4);
    }
  }

  if (fox.rotation !== 0) {
    ctx.rotate(fox.rotation);
  }

  // Gallop bounce
  const legCycle = fox.isGrounded ? Math.sin(fox.runTick * 2) : 0.8;
  const tailSway = Math.sin(fox.runTick * 1.5) * 0.25;

  // Tail (Bushy orange with white tip)
  ctx.save();
  ctx.translate(-16, -2);
  ctx.rotate(-0.35 + tailSway);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(-14, 0, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // White tip
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-24, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Back legs
  ctx.strokeStyle = coatDark;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, 6);
  ctx.lineTo(-14 + legCycle * 8, 18);
  ctx.stroke();

  // Body
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // White Belly / Chest
  ctx.fillStyle = '#fff1f2';
  ctx.beginPath();
  ctx.ellipse(4, 3, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front legs
  ctx.strokeStyle = coat;
  ctx.beginPath();
  ctx.moveTo(10, 6);
  ctx.lineTo(14 - legCycle * 8, 18);
  ctx.stroke();

  // Head
  ctx.save();
  ctx.translate(14, -6);

  // Ears
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.lineTo(0, -18);
  ctx.lineTo(6, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-2, -7);
  ctx.lineTo(0, -14);
  ctx.lineTo(4, -7);
  ctx.closePath();
  ctx.fill();

  // Face
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(16, 0); // Snout
  ctx.lineTo(-4, 8);
  ctx.closePath();
  ctx.fill();

  // White snout cheek
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(16, 0);
  ctx.lineTo(0, 7);
  ctx.closePath();
  ctx.fill();

  // Nose
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(16, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(4.8, -2, 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return;

  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    jump();
  } else if (e.code === 'Escape') {
    closeGame();
  }
}

function openGame() {
  isOpen.value = true;
  document.body.style.overflow = 'hidden';

  try {
    const saved = localStorage.getItem('purpeon_fox_highscore');
    if (saved) highScore.value = parseInt(saved, 10) || 0;
    const muted = localStorage.getItem('foxGame_muted');
    if (muted) isMuted.value = muted === 'true';
  } catch (e) {}

  resetGame();
  nextTick(() => {
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  });
}

function closeGame() {
  isOpen.value = false;
  isPlaying.value = false;
  stopMusic();
  document.body.style.overflow = '';
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value;
  // The mute button has to reach the music too, not just the effects.
  if (isMuted.value) stopMusic();
  else if (isPlaying.value) startMusic();
  try {
    localStorage.setItem('foxGame_muted', String(isMuted.value));
  } catch (e) {}
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('open-fox-game', openGame);
});

onBeforeUnmount(() => {
  stopMusic();
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('open-fox-game', openGame);
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="fox-game-overlay fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="t('game.title')"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-slate-950/75 backdrop-blur-md" @click="closeGame"></div>

        <!-- Game Card (Glassmorphic) -->
        <div
          class="game-card relative w-full max-w-[840px] bg-slate-900/90 text-white rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col items-center backdrop-blur-2xl z-10"
        >
          <!-- Top Header Bar -->
          <div class="w-full px-6 py-3.5 flex items-center justify-between border-b border-white/10 bg-white/5">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">🦊</span>
              <div>
                <h3 class="font-bold text-lg leading-tight tracking-tight text-amber-300">
                  {{ t('game.title') }}
                </h3>
                <p class="text-xs text-purple-200/80 font-medium">
                  {{ t('game.subtitle') }}
                </p>
              </div>
            </div>

            <!-- Controls (Sound & Close) -->
            <div class="flex items-center gap-2">
              <button
                @click="toggleMute"
                class="sound-btn p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 transition-colors cursor-pointer"
                :title="isMuted ? t('game.soundOff') : t('game.soundOn')"
                :aria-label="isMuted ? t('game.soundOff') : t('game.soundOn')"
              >
                <IconVolumeXmark v-if="isMuted" class="w-4 h-4 text-rose-300" />
                <IconVolumeHigh v-else class="w-4 h-4 text-emerald-300" />
              </button>

              <button
                @click="closeGame"
                class="close-btn p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white/90 border border-white/10 hover:border-rose-400/40 transition-colors cursor-pointer"
                :title="t('game.close')"
                :aria-label="t('game.close')"
              >
                <IconXmark class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Canvas Container -->
          <div
            class="canvas-container relative w-full aspect-[2/1] max-h-[440px] bg-slate-950 flex items-center justify-center select-none cursor-pointer overflow-hidden"
            @click="jump"
            @touchstart.prevent="jump"
          >
            <canvas
              ref="canvasRef"
              :width="GAME_WIDTH"
              :height="GAME_HEIGHT"
              class="w-full h-full object-contain block"
            ></canvas>

            <!-- Top In-Game HUD -->
            <div
              v-if="isPlaying"
              class="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none text-sm font-semibold tracking-wide select-none"
            >
              <div class="flex items-center gap-4 bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
                <span class="text-amber-300 flex items-center gap-1">
                  ⭐ <span class="font-mono text-base">{{ score }}</span>
                </span>
                <span class="text-sky-300 flex items-center gap-1" :title="t('game.pickups')">
                  🧺 <span class="font-mono text-base">{{ pickupsCollected }}</span>
                </span>
                <span class="text-fuchsia-300 flex items-center gap-1" :title="t('game.flowers')">
                  🌸 <span class="font-mono text-base">{{ flowerCount }}</span>
                </span>
                <span class="text-slate-300 text-xs font-mono">
                  {{ Math.floor(distanceMeters) }}m
                </span>
              </div>

              <div
                v-if="power.isActive.value"
                class="fox-power-pill bg-fuchsia-500/25 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-fuchsia-300/60 text-fuchsia-100 text-xs flex items-center gap-1.5 shadow-lg"
                :class="{ 'is-expiring': power.isExpiring.value }"
              >
                <span>🛡️ {{ t('game.powerShield') }}</span>
                <span class="font-mono font-bold text-base tabular-nums">{{ power.secondsLeft.value }}s</span>
                <span class="font-mono font-bold text-amber-300">2×</span>
              </div>

              <div class="bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-amber-200 text-xs flex items-center gap-1.5 shadow-lg">
                <span>🏆 {{ t('game.highScore') }}:</span>
                <span class="font-mono font-bold text-amber-300">{{ highScore }}</span>
              </div>
            </div>

            <!-- Start Screen Overlay -->
            <div
              v-if="!isPlaying && !isGameOver"
              class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              @click.stop
            >
              <div class="fox-avatar text-6xl mb-3 animate-bounce">🦊</div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-amber-300 mb-2 drop-shadow-md">
                {{ t('game.title') }}
              </h2>
              <p class="text-sm text-purple-100/90 max-w-md mb-6 leading-relaxed">
                {{ t('game.instructions') }}
              </p>

              <button
                @click.stop="startGame"
                class="start-btn px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-lg tracking-wide shadow-xl hover:shadow-orange-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                {{ t('game.start') }}
              </button>
            </div>

            <!-- Game Over Overlay -->
            <div
              v-if="isGameOver"
              class="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
              @click.stop
            >
              <div class="text-5xl mb-2">🦊💤</div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-rose-400 mb-1">
                {{ t('game.gameOver') }}
              </h2>
              <p v-if="isNewRecord" class="text-amber-300 font-bold text-base mb-3 animate-pulse">
                {{ t('game.newRecord') }}
              </p>
              <p v-else class="text-purple-200/80 text-sm mb-4">
                {{ t('game.subtitle') }}
              </p>

              <div class="grid grid-cols-2 gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-6 w-full max-w-xs backdrop-blur-md">
                <div class="text-center">
                  <div class="text-xs text-slate-400 font-medium">{{ t('game.score') }}</div>
                  <div class="text-xl font-mono font-bold text-amber-300">{{ score }}</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-slate-400 font-medium">{{ t('game.highScore') }}</div>
                  <div class="text-xl font-mono font-bold text-purple-300">{{ highScore }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <button
                  @click.stop="startGame"
                  class="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base tracking-wide shadow-lg shadow-emerald-500/25 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <IconRotateRight class="w-4 h-4" />
                  {{ t('game.restart') }}
                </button>
                <button
                  @click.stop="closeGame"
                  class="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 text-base font-semibold transition-colors cursor-pointer"
                >
                  {{ t('game.close') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Touch Helper for Mobile -->
          <div class="w-full px-6 py-3 flex items-center justify-between border-t border-white/10 bg-white/5 text-xs text-purple-200/70">
            <span class="flex items-center gap-1.5">
              <span>⌨️</span> {{ t('game.instructions') }}
            </span>
            <button
              v-if="isPlaying"
              @click.stop="jump"
              class="jump-touch-btn sm:hidden px-5 py-1.5 rounded-full bg-orange-500 text-slate-950 font-bold active:scale-95 transition-transform"
            >
              {{ t('game.jump') }} 🦊
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.game-card {
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset,
    0 0 30px rgba(168, 85, 247, 0.2);
}

/* The shield pill breathes while it is up, and blinks faster once the window
   is closing — the same warning the fox itself gives by flickering orange. */
.fox-power-pill {
  animation: fox-power-pulse 1.1s ease-in-out infinite;
}
.fox-power-pill.is-expiring {
  animation-duration: 0.35s;
}
@keyframes fox-power-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(232, 121, 249, 0.45); }
  50%      { transform: scale(1.05); box-shadow: 0 0 18px 4px rgba(232, 121, 249, 0.35); }
}
@media (prefers-reduced-motion: reduce) {
  .fox-power-pill { animation: none; }
}
</style>
