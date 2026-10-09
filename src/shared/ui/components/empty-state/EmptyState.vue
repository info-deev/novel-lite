<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/shared/ui/lib/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div data-slot="empty-state" :class="cn('flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center', props.class)">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl text-muted-foreground" aria-hidden="true">✦</div>
    <p class="text-sm font-medium text-foreground"><slot name="title" /></p>
    <p v-if="$slots.hint" class="max-w-xs text-xs leading-relaxed text-muted-foreground"><slot name="hint" /></p>
    <div v-if="$slots.default" class="mt-2"><slot /></div>
  </div>
</template>
