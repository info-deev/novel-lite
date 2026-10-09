<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { SelectScrollDownButton, type SelectScrollDownButtonProps } from 'reka-ui';
import { cn } from '@/shared/ui/lib/utils';

const props = defineProps<SelectScrollDownButtonProps & { class?: HTMLAttributes['class'] }>();
</script>

<template>
  <SelectScrollDownButton data-slot="select-scroll-down-button" :class="cn('flex items-center justify-center py-1', props.class)">
    <slot>↓</slot>
  </SelectScrollDownButton>
</template>
