<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { SelectScrollUpButton, type SelectScrollUpButtonProps } from 'reka-ui';
import { cn } from '@/shared/ui/lib/utils';

const props = defineProps<SelectScrollUpButtonProps & { class?: HTMLAttributes['class'] }>();
</script>

<template>
  <SelectScrollUpButton data-slot="select-scroll-up-button" :class="cn('flex items-center justify-center py-1', props.class)">
    <slot>↑</slot>
  </SelectScrollUpButton>
</template>
