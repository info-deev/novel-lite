<script setup lang="ts">
import { Label } from '@/shared/ui/components/label';
import { Input } from '@/shared/ui/components/input';

const model = defineModel<string>({ required: true });

withDefaults(defineProps<{ label?: string; placeholder?: string; type?: string }>(), {
  label: undefined,
  placeholder: '',
  type: 'text',
});
</script>

<template>
  <div class="w-full space-y-1.5">
    <Label v-if="label">{{ label }}</Label>
    <Input v-model="model" :type="type" :placeholder="placeholder" />
  </div>
</template>
