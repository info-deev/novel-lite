<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { SelectTrigger, type SelectTriggerProps, useForwardProps } from 'reka-ui';
import { cn } from '@/shared/ui/lib/utils';

const props = withDefaults(
  defineProps<SelectTriggerProps & { class?: HTMLAttributes['class']; size?: 'sm' | 'default' }>(),
  { size: 'default' },
);

const delegatedProps = reactiveOmit(props, 'class', 'size');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="cn(
      'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-secondary px-3 py-2 text-sm shadow-sm transition-colors data-[placeholder]:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 [&>span]:truncate text-start',
      size === 'sm' && 'h-7 rounded-md px-2.5 text-xs',
      props.class,
    )"
  >
    <slot />
  </SelectTrigger>
</template>
