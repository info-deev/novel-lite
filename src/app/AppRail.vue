<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import BaseButton from '@/shared/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();

const items = [
  { name: 'editor', label: 'Редактор', icon: '✎', key: '1' },
  { name: 'board', label: 'Доска', icon: '▦', key: '2' },
  { name: 'settings', label: 'Настройки', icon: '⚙', key: '3' },
] as const;
</script>

<template>
  <nav class="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-3">
    <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground shadow-sm" title="Lite Novelcrafter">
      ✒
    </div>
    <BaseButton
      v-for="item in items"
      :key="item.name"
      variant="ghost"
      size="icon"
      :active="route.name === item.name"
      :title="`${item.label} (Ctrl+${item.key})`"
      class="h-10 w-10 text-lg"
      @click="void router.push({ name: item.name })"
    >
      {{ item.icon }}
    </BaseButton>
    <div class="mt-auto flex flex-col items-center gap-1 text-[10px] text-muted-foreground">
      <span title="Локальное приложение">◉</span>
    </div>
  </nav>
</template>
