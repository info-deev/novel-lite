<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
    size?: 'sm' | 'md' | 'icon';
    active?: boolean;
    classes?: string;
  }>(),
  { variant: 'secondary', size: 'md', active: false, classes: '' },
);

const styles = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none';
  const variants: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70 border border-border',
    ghost: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/85',
  };
  const sizes: Record<string, string> = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-8 px-3 text-sm',
    icon: 'h-8 w-8 p-0 text-base',
  };
  const activeCls = props.active ? ' bg-accent text-accent-foreground' : '';
  return [base, variants[props.variant], sizes[props.size], activeCls, props.classes].join(' ');
});
</script>

<template>
  <button :class="styles" type="button" v-bind="$attrs">
    <slot />
  </button>
</template>
