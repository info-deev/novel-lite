<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { SelectSeparator, type SelectSeparatorProps } from 'reka-ui';
import { cn } from '@/shared/ui/lib/utils';

const props = defineProps<SelectSeparatorProps & { class?: HTMLAttributes['class'] }>();
</script>

<template>
  <SelectSeparator data-slot="select-separator" :class="cn('pointer-events-none my-1 h-px bg-border', props.class)" />
</template>
