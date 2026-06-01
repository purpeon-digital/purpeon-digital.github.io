<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n, type Locale } from '@/composables/useI18n';

const props = defineProps<{ locale: Locale }>();
const { t } = useI18n(props.locale);

const STORAGE_KEY = 'purpeon:no-cookies-dismissed:v1';
const AUTO_DISMISS_MS = 4000;
const ENTER_DELAY_MS = 400;

const visible = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let enterTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleAutoDismiss() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(dismiss, AUTO_DISMISS_MS);
}

function pauseAutoDismiss() {
  clearTimeout(hideTimer);
}

function dismiss() {
  visible.value = false;
  clearTimeout(hideTimer);
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {}
}

onMounted(() => {
  let alreadyDismissed = false;
  try {
    alreadyDismissed = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {}
  if (alreadyDismissed) return;

  enterTimer = setTimeout(() => {
    visible.value = true;
    scheduleAutoDismiss();
  }, ENTER_DELAY_MS);
});

onBeforeUnmount(() => {
  clearTimeout(hideTimer);
  clearTimeout(enterTimer);
});
</script>

<template>
  <Transition name="cookies-toast">
    <div
      v-if="visible"
      class="cookies-toast"
      role="status"
      aria-live="polite"
      :aria-label="t('cookies.ariaLabel')"
      @mouseenter="pauseAutoDismiss"
      @mouseleave="scheduleAutoDismiss"
      @focusin="pauseAutoDismiss"
      @focusout="scheduleAutoDismiss"
    >
      <span class="cookies-toast__message">
        {{ t('cookies.before') }}<strong>{{ t('cookies.emphasis') }}</strong>{{ t('cookies.after') }}
      </span>
      <button
        type="button"
        class="cookies-toast__dismiss"
        @click="dismiss"
      >
        {{ t('cookies.dismiss') }}
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.cookies-toast {
  position: fixed;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  max-width: calc(100vw - 1.5rem);
  padding: 0.7rem 0.7rem 0.7rem 1.2rem;
  border-radius: 18px;
  background:
    radial-gradient(140% 120% at 0% 0%, rgba(236, 72, 153, 0.14), transparent 55%),
    radial-gradient(140% 120% at 100% 100%, rgba(124, 58, 237, 0.24), transparent 60%),
    linear-gradient(135deg, rgba(20, 16, 40, 0.82) 0%, rgba(30, 20, 58, 0.74) 100%);
  color: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(167, 139, 250, 0.3);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    0 14px 40px rgba(76, 29, 149, 0.42),
    0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 0.925rem;
  line-height: 1.35;
  overflow: hidden;
}

/* Decorative top shimmer — mirrors the mobile nav accent */
.cookies-toast::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18%;
  right: 18%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(236, 72, 153, 0.45) 30%,
    rgba(167, 139, 250, 0.75) 50%,
    rgba(236, 72, 153, 0.45) 70%,
    transparent 100%
  );
  pointer-events: none;
}

.cookies-toast__message {
  margin: 0;
  letter-spacing: 0.005em;
  text-wrap: balance;
}

.cookies-toast__message strong {
  font-weight: 700;
  color: var(--color-accent-light);
}

.cookies-toast__dismiss {
  border: 1px solid rgba(167, 139, 250, 0.4);
  background: linear-gradient(135deg, #8b5cf6 0%, #6b46c1 100%);
  color: white;
  padding: 0.5rem 1.05rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.005em;
  cursor: pointer;
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    filter 200ms ease,
    border-color 200ms ease;
  flex-shrink: 0;
  white-space: nowrap;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 4px 14px rgba(124, 58, 237, 0.32);
}

.cookies-toast__dismiss:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  border-color: rgba(236, 72, 153, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 6px 18px rgba(124, 58, 237, 0.48);
}

.cookies-toast__dismiss:focus-visible {
  outline: 2px solid rgba(236, 72, 153, 0.7);
  outline-offset: 2px;
}

/* Light theme */
:global([data-theme="light"] .cookies-toast) {
  color: var(--color-text-primary);
  background:
    radial-gradient(140% 120% at 0% 0%, rgba(236, 72, 153, 0.08), transparent 55%),
    radial-gradient(140% 120% at 100% 100%, rgba(124, 58, 237, 0.12), transparent 60%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 247, 252, 0.9) 100%);
  border: 1px solid rgba(107, 70, 193, 0.25);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 14px 40px rgba(107, 70, 193, 0.2),
    0 2px 6px rgba(107, 70, 193, 0.08);
}

:global([data-theme="light"] .cookies-toast::before) {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(236, 72, 153, 0.4) 30%,
    rgba(107, 70, 193, 0.55) 50%,
    rgba(236, 72, 153, 0.4) 70%,
    transparent 100%
  );
}

:global([data-theme="light"] .cookies-toast__message strong) {
  color: var(--color-accent-primary);
}

:global([data-theme="light"] .cookies-toast__dismiss) {
  background: linear-gradient(135deg, #7c3aed 0%, #6b46c1 100%);
  border-color: rgba(107, 70, 193, 0.4);
}

:global([data-theme="light"] .cookies-toast__dismiss:hover) {
  background: linear-gradient(135deg, #7c3aed 0%, #553c9a 100%);
}

/* Transitions */
.cookies-toast-enter-active,
.cookies-toast-leave-active {
  transition:
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 260ms ease;
}
.cookies-toast-enter-from,
.cookies-toast-leave-to {
  transform: translate(-50%, 160%);
  opacity: 0;
}
.cookies-toast-enter-to,
.cookies-toast-leave-from {
  transform: translate(-50%, 0);
  opacity: 1;
}

/* Desktop: tight pill, single line */
@media (min-width: 768px) {
  .cookies-toast__message {
    white-space: nowrap;
  }
}

/* Mobile: near-full-width sheet so text wraps cleanly */
@media (max-width: 767px) {
  .cookies-toast {
    width: calc(100vw - 1.25rem);
    max-width: none;
    bottom: 0.9rem;
    padding: 0.75rem 0.75rem 0.75rem 1.1rem;
    gap: 0.75rem;
    border-radius: 16px;
  }
  .cookies-toast__message {
    flex: 1;
    min-width: 0;
    font-size: 0.88rem;
  }
  .cookies-toast__dismiss {
    padding: 0.55rem 0.95rem;
    font-size: 0.82rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cookies-toast-enter-active,
  .cookies-toast-leave-active {
    transition: opacity 180ms ease;
  }
  .cookies-toast-enter-from,
  .cookies-toast-leave-to {
    transform: translate(-50%, 0);
  }
}
</style>
