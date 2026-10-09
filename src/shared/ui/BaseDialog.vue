<script setup lang="ts">
import { onKeydown } from '@/shared/ui/dialogProvider';

withDefaults(
  defineProps<{
    open: boolean;
    labelledBy?: string;
    maxWidth?: string;
  }>(),
  { labelledBy: undefined, maxWidth: 'max-w-md' },
);

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        role="presentation"
        @click.self="emit('close')"
        @keydown="onKeydown"
      >
        <div
          :class="['dialog-panel w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl', maxWidth]"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="labelledBy"
          tabindex="-1"
          @click.stop
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 150ms ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
.dialog-enter-active .dialog-panel,
.dialog-leave-active .dialog-panel {
  transition: transform 150ms ease;
}
.dialog-enter-from .dialog-panel,
.dialog-leave-to .dialog-panel {
  transform: scale(0.96);
}
</style>
