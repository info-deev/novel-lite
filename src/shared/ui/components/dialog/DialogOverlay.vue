<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { DialogOverlay, type DialogOverlayProps } from 'reka-ui';
import { cn } from '@/shared/ui/lib/utils';

const props = defineProps<DialogOverlayProps & { class?: HTMLAttributes['class'] }>();
</script>

<template>
  <DialogOverlay
    data-slot="dialog-overlay"
    v-bind="props"
    :class="cn('fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm', props.class)"
  >
    <slot />
  </DialogOverlay>
</template>
