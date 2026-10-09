<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { DialogTitle, type DialogTitleProps, useForwardProps } from 'reka-ui';
import { reactiveOmit } from '@vueuse/core';
import { cn } from '@/shared/ui/lib/utils';

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogTitle
    data-slot="dialog-title"
    v-bind="forwardedProps"
    :class="cn('font-serif text-base font-semibold leading-snug', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
