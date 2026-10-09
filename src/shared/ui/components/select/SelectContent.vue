<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import {
  SelectContent,
  type SelectContentEmits,
  type SelectContentProps,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/shared/ui/lib/utils';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes['class'] }>(),
  { position: 'popper' },
);
const emits = defineEmits<SelectContentEmits>();

const delegatedProps = reactiveOmit(props, 'class');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SelectPortal>
    <SelectContent
      data-slot="select-content"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn(
        'relative z-[70] min-w-32 rounded-md border border-border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        props.class,
      )"
    >
      <SelectViewport class="p-1">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>
