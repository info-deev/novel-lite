<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { Primitive, useForwardProps } from 'reka-ui';
import { cn } from '@/shared/ui/lib/utils';
import { buttonVariants, type ButtonVariants } from '.';

interface Props {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  active?: boolean;
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();

const delegatedProps = reactiveOmit(props, 'class', 'active');
const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <Primitive
    data-slot="button"
    as="button"
    :class="cn(buttonVariants({ variant, size }), props.active && 'bg-accent text-accent-foreground', props.class)"
    v-bind="forwarded"
  >
    <slot />
  </Primitive>
</template>
