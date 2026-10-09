<script setup lang="ts">
import { Label } from '@/shared/ui/components/label';
import { Textarea } from '@/shared/ui/components/textarea';

const model = defineModel<string>({ required: true });

withDefaults(defineProps<{ label?: string; placeholder?: string; rows?: number; hint?: string }>(), {
  label: undefined,
  placeholder: '',
  rows: 3,
  hint: undefined,
});
</script>

<template>
  <div class="w-full space-y-1.5">
    <Label v-if="label">{{ label }}</Label>
    <Textarea v-model="model" :rows="rows" :placeholder="placeholder" />
    <p v-if="hint" class="text-[11px] text-muted-foreground">{{ hint }}</p>
  </div>
</template>
