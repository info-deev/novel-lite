<script setup lang="ts">
import { useId } from 'vue';
import { Label } from '@/shared/ui/components/label';

const props = defineProps<{ label?: string; for?: string; hint?: string }>();

const autoId = useId();
/** id поля: явный `for` или автоматически сгенерированный (пробрасывается слоту через slot-props). */
const fieldId = () => props.for ?? autoId;
</script>

<template>
  <div class="w-full space-y-1.5">
    <Label v-if="label" :for="fieldId()" class="block">{{ label }}</Label>
    <slot :id="fieldId()" />
    <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
