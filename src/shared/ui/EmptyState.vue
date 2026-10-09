<script setup lang="ts">
withDefaults(defineProps<{ title: string; hint?: string }>(), { hint: '' });
</script>

<template>
  <div class="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl text-muted-foreground">✦</div>
    <p class="text-sm font-medium text-foreground">{{ title }}</p>
    <p v-if="hint" class="max-w-xs text-xs leading-relaxed text-muted-foreground">{{ hint }}</p>
    <div class="mt-2"><slot /></div>
  </div>
</template>
