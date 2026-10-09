<script setup lang="ts">
import { useId } from 'vue';
import { Label } from '@/shared/ui/components/label';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/components/select';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const model = defineModel<string>({ required: true });

withDefaults(
  defineProps<{
    options: SelectOption[];
    label?: string;
    placeholder?: string;
    hint?: string;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    label: undefined,
    hint: undefined,
    placeholder: '',
    loading: false,
    disabled: false,
  },
);

const selectId = useId();
</script>

<template>
  <div class="w-full space-y-1.5">
    <Label v-if="label" :for="selectId" class="block">{{ label }}</Label>
    <SelectRoot v-model="model" :disabled="disabled || loading">
      <SelectTrigger :id="selectId">
        <SelectValue :placeholder="loading ? '…' : (placeholder || ' ')" />
        <span class="pointer-events-none text-[10px] text-muted-foreground" aria-hidden="true">▾</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem v-for="opt in options" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
            {{ opt.label }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
    <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
