<script setup lang="ts">
import { onBeforeUnmount } from 'vue';

const props = defineProps<{ width: number; min?: number; max?: number; side: 'left' | 'right' }>();

const emit = defineEmits<{ resize: [number] }>();

let startX = 0;
let startWidth = 0;

function onMove(e: MouseEvent): void {
  const delta = e.clientX - startX;
  const raw = props.side === 'left' ? startWidth + delta : startWidth - delta;
  const clamped = Math.min(props.max ?? 480, Math.max(props.min ?? 180, raw));
  emit('resize', clamped);
}

function onUp(): void {
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onUp);
}

function onDown(e: MouseEvent): void {
  startX = e.clientX;
  startWidth = props.width;
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

onBeforeUnmount(onUp);
</script>

<template>
  <div class="resize-handle" role="separator" aria-orientation="vertical" @mousedown.prevent="onDown"></div>
</template>
