<script setup lang="ts">
import { computed, useId } from 'vue';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const model = defineModel<string>({ required: true });

const props = withDefaults(
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

const displayOptions = computed<SelectOption[]>(() =>
  props.placeholder && !props.options.some((o) => o.value === '')
    ? [{ value: '', label: props.placeholder, disabled: true }, ...props.options]
    : props.options,
);

const classes =
  'flex h-9 w-full appearance-none rounded-md border border-input bg-secondary px-3 pr-8 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';
</script>

<template>
  <div class="w-full space-y-1.5">
    <label v-if="label" :for="selectId" class="text-xs font-medium text-muted-foreground">{{ label }}</label>
    <div class="relative">
      <select
        :id="selectId"
        v-model="model"
        :disabled="disabled || loading"
        :class="classes"
      >
        <option v-for="opt in displayOptions" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
          {{ opt.label }}
        </option>
      </select>
      <span
        class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground"
        aria-hidden="true"
      >
        {{ loading ? '…' : '▾' }}
      </span>
    </div>
    <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
