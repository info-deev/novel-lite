<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import {
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/shared/ui/lib/utils';

defineOptions({ inheritAttrs: false });

const props = defineProps<
  DialogContentProps & {
    class?: HTMLAttributes['class'];
    /** Ширина панели диалога, например max-w-sm. */
    maxWidth?: string;
  }
>();
const emits = defineEmits<DialogContentEmits>();

// Классы и анимации совпадают с shared DialogContent (включая оверлей).
// Обёртка нужна, чтобы гарантировать наличие aria-labelledby на контенте:
// reka-ui проставляет его сам, но атрибут не реактивен (plain-контекст DialogRoot),
// поэтому при первом рендере он "null" — см. useWarning в DialogContentImpl.
const delegatedProps = reactiveOmit(props, 'class', 'maxWidth');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DialogPortal>
    <DialogOverlay class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogContent
      data-slot="confirm-dialog-content"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn(
        'fixed left-1/2 top-1/2 z-[60] grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        maxWidth ?? 'max-w-md',
        props.class,
      )"
    >
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
