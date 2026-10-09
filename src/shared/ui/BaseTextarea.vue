<script setup lang="ts">
const model = defineModel<string>({ required: true });

withDefaults(defineProps<{ label?: string; placeholder?: string; rows?: number }>(), {
  label: undefined,
  placeholder: '',
  rows: 3,
});

const classes =
  'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y';
</script>

<template>
  <div class="w-full space-y-1.5">
    <label v-if="label" class="text-xs font-medium text-muted-foreground">{{ label }}</label>
    <textarea v-model="model" :rows="rows" :placeholder="placeholder" :class="classes" />
  </div>
</template>
