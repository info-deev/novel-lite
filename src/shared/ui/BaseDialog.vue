<script setup lang="ts">
import { ref, watch } from 'vue';
import { cn } from '@/shared/ui/lib/utils';
import { DialogContent, DialogRoot } from '@/shared/ui/components/dialog';

const props = withDefaults(
  defineProps<{
    open: boolean;
    labelledBy?: string;
    maxWidth?: string;
    class?: string;
  }>(),
  { labelledBy: undefined, maxWidth: 'max-w-md', class: '' },
);

const emit = defineEmits<{ close: [] }>();

const isOpen = ref(props.open);
watch(() => props.open, (v) => (isOpen.value = v));
watch(isOpen, (v) => { if (!v) emit('close'); });
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogContent
      :force-mount="true"
      role="alertdialog"
      :aria-labelledby="labelledBy"
      :max-width="maxWidth"
      :class="cn('overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl', props.class)"
    >
      <slot />
    </DialogContent>
  </DialogRoot>
</template>
