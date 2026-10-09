<script setup lang="ts">
const model = defineModel<string>({ required: true });

withDefaults(defineProps<{ label?: string; placeholder?: string; type?: string }>(), {
  label: undefined,
  placeholder: '',
  type: 'text',
});

const classes =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
</script>

<template>
  <div class="w-full space-y-1.5">
    <label v-if="label" class="text-xs font-medium text-muted-foreground">{{ label }}</label>
    <input v-model="model" :type="type" :placeholder="placeholder" :class="classes" />
  </div>
</template>
