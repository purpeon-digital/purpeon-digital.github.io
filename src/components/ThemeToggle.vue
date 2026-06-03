<script setup lang="ts">
import { ref, onMounted } from 'vue';

type Theme = 'light' | 'dark' | 'uninitialized';

const theme = ref<Theme>('uninitialized');

onMounted(() => {
    const html = document.documentElement;
    const domTheme = (html.getAttribute('data-theme') || 'light') as 'light' | 'dark';

    // Small delay to ensure smooth animation from neutral state
    requestAnimationFrame(() => {
        theme.value = domTheme;
    });

    try {
        if (!localStorage.getItem('theme')) {
            localStorage.setItem('theme', domTheme);
        }
    } catch (e) { }
});

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    const apply = () => {
        html.setAttribute('data-theme', newTheme);

        const themeColorMeta = document.querySelector('meta[data-theme-color]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', newTheme === 'dark' ? '#1a1a2e' : '#6b46c1');
        }

        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) { }
        theme.value = newTheme;
    };

    const startViewTransition = (document as Document & {
        startViewTransition?: (cb: () => void) => void;
    }).startViewTransition?.bind(document);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (startViewTransition && !prefersReducedMotion) {
        startViewTransition(apply);
    } else {
        apply();
    }
}
</script>

<template>
    <button
        class="theme-toggle border-none bg-none cursor-pointer text-white/90 leading-none"
        :class="{
            'theme-toggle--toggled': theme === 'dark',
            'theme-toggle--uninitialized': theme === 'uninitialized'
        }"
        type="button"
        title="Toggle theme"
        aria-label="Toggle theme"
        @click="toggleTheme"
    >
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="1.5rem" height="1.5rem" fill="currentColor"
            stroke-linecap="round" class="theme-toggle__classic" viewBox="0 0 32 32">
            <clipPath id="theme-toggle__classic__cutout">
                <path d="M0-5h30a1 1 0 0 0 9 13v24H0Z" />
            </clipPath>
            <g clip-path="url(#theme-toggle__classic__cutout)">
                <circle cx="16" cy="16" r="9.34" />
                <g stroke="currentColor" stroke-width="1.5">
                    <path d="M16 5.5v-4" />
                    <path d="M16 30.5v-4" />
                    <path d="M1.5 16h4" />
                    <path d="M26.5 16h4" />
                    <path d="m23.4 8.6 2.8-2.8" />
                    <path d="m5.7 26.3 2.9-2.9" />
                    <path d="m5.8 5.8 2.8 2.8" />
                    <path d="m23.4 23.4 2.9 2.9" />
                </g>
            </g>
        </svg>
    </button>
</template>

<style scoped>
/* SVG morphing animation — cannot be expressed as Tailwind utilities */
.theme-toggle {
    --theme-toggle__classic--duration: 500ms;
}

.theme-toggle__classic path {
    transition-timing-function: cubic-bezier(0, 0, 0.15, 1.25);
    transform-origin: center;
    transition-duration: calc(var(--theme-toggle__classic--duration) * 0.8);
}

.theme-toggle__classic g path {
    transition-property: opacity, transform;
    transition-delay: calc(var(--theme-toggle__classic--duration) * 0.2);
}

.theme-toggle__classic :first-child path {
    transition-property: transform, d;
}

/* Uninitialized state: full circle, no rays */
.theme-toggle--uninitialized .theme-toggle__classic g path {
    opacity: 0;
    transition: none;
}

.theme-toggle--uninitialized .theme-toggle__classic :first-child path {
    d: path("M0-5h30a1 1 0 0 0 9 13v24H0Z");
    transition: none;
}

/* Dark state (toggled) */
.theme-toggle--toggled .theme-toggle__classic g path {
    transform: scale(0.5) rotate(45deg);
    opacity: 0;
    transition-delay: 0s;
}

.theme-toggle--toggled .theme-toggle__classic :first-child path {
    d: path("M-12 5h30a1 1 0 0 0 9 13v24h-39Z");
    transition-delay: calc(var(--theme-toggle__classic--duration) * 0.2);
}

/* Fallback for browsers without d: path() support */
@supports not (d: path("")) {
    .theme-toggle--uninitialized .theme-toggle__classic :first-child path {
        transform: translate3d(0, 0, 0);
        transition: none;
    }

    .theme-toggle--toggled .theme-toggle__classic :first-child path {
        transform: translate3d(-12px, 10px, 0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .theme-toggle * {
        transition: none !important;
    }
}
</style>
