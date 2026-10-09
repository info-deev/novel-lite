<script setup lang="ts">
import { Button, type ButtonVariants } from '@/shared/ui/components/button';

withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant'];
    size?: ButtonVariants['size'];
    active?: boolean;
    classes?: string;
  }>(),
  { variant: 'secondary', size: 'md', active: false, classes: '' },
);
</script>

<template>
  <Button type="button" :variant="variant" :size="size" :active="active" :class="classes" v-bind="$attrs">
    <slot />
  </Button>
</template>
