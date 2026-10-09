<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { copyToClipboard } from '@/core/clipboard';

interface Props {
  /** Текст, который копируется в буфер обмена по нажатию. */
  text: string;
  /** Необязательное уточнение для подсказки (например, «Скопировать ответ»). */
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Скопировать в буфер обмена',
});

/** Состояние сразу после копирования: показываем кратковременное подтверждение. */
const copied = ref(false);
const failed = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Копирует `props.text` и на 1.5 секунды показывает состояние «скопировано».
 */
async function copy(): Promise<void> {
  const ok = await copyToClipboard(props.text);
  copied.value = ok;
  failed.value = !ok;
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    copied.value = false;
    failed.value = false;
  }, 1500);
}

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer);
});
</script>

<template>
  <button
    type="button"
    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    :title="failed ? 'Не удалось скопировать' : copied ? 'Скопировано!' : title"
    :aria-label="title"
    @click="copy()"
  >
    <!-- Иконка «успех» на время подтверждения копирования -->
    <svg v-if="copied" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500">
      <path d="M20 6 9 17l-5-5" />
    </svg>
    <!-- Иконка «ошибка» -->
    <svg v-else-if="failed" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destructive">
      <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
    </svg>
    <!-- Иконка «копировать» (два перекрывающихся прямоугольника) -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  </button>
</template>
