<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { DialogDescription, type DialogDescriptionProps, useForwardProps } from 'reka-ui';
import { reactiveOmit } from '@vueuse/core';
import { cn } from '@/shared/ui/lib/utils';

const props = defineProps<DialogDescriptionProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogDescription
    data-slot="dialog-description"
    v-bind="forwardedProps"
    :class="cn('text-sm leading-relaxed text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
