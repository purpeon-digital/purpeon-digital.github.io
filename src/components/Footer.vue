<template>
  <footer>
    <p>&copy; {{ currentYear }} Purpeon Digital.</p>
  </footer>
</template>

<script setup lang="ts">
import { useI18n, type Locale } from '@/composables/useI18n';

const props = defineProps<{
  locale: Locale;
}>();

const { t } = useI18n(props.locale);
const currentYear = new Date().getFullYear();
</script>
