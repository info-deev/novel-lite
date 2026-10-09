<script setup lang="ts">
import { onBeforeUnmount } from 'vue';

const props = defineProps<{
  /** Текущая высота верхней панели в px */
  topHeight: number;
  min?: number;
  max?: number;
}>();

const emit = defineEmits<{ resize: [number] }>();

let startY = 0;
let startHeight = 0;

function onMove(e: MouseEvent): void {
  const delta = e.clientY - startY;
  const raw = startHeight + delta;
  const clamped = Math.min(props.max ?? 4000, Math.max(props.min ?? 80, raw));
  emit('resize', clamped);
}

function onUp(): void {
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onUp);
  document.body.style.userSelect = '';
}

function onDown(e: MouseEvent): void {
  startY = e.clientY;
  startHeight = props.topHeight;
  document.body.style.userSelect = 'none';
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

onBeforeUnmount(() => {
  onUp();
});
</script>

<template>
  <div
    class="group relative z-10 h-1.5 shrink-0 cursor-row-resize"
    role="separator"
    aria-orientation="horizontal"
    tabindex="0"
    @mousedown.prevent="onDown"
  >
    <div
      class="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 rounded-full bg-border transition-colors group-hover:bg-primary/60"
    ></div>
  </div>
</template>
