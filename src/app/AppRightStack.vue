<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import AssistantPanel from '@/features/assistant/AssistantPanel.vue';
import CodexPanel from '@/features/codex/CodexPanel.vue';
import VerticalResizeHandle from '@/shared/ui/VerticalResizeHandle.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import { useWorkspaceStore } from '@/stores/workspace';

const workspace = useWorkspaceStore();

const stackRef = ref<HTMLDivElement | null>(null);
const stackHeight = ref(0);

let ro: ResizeObserver | null = null;

function measure(): void {
  if (stackRef.value) stackHeight.value = stackRef.value.clientHeight;
}

watch(stackRef, (el) => {
  ro?.disconnect();
  ro = null;
  if (!el) return;
  measure();
  ro = new ResizeObserver(() => measure());
  ro.observe(el);
});

onBeforeUnmount(() => {
  ro?.disconnect();
});

/** Мин/макс высоты AI-панели в px с учётом текущей высоты колонки. */
const aiMinPx = computed(() => Math.max(120, stackHeight.value * 0.2));
const aiMaxPx = computed(() => Math.max(aiMinPx.value, stackHeight.value * 0.8));

const aiHeightPx = computed(() => (stackHeight.value * workspace.aiFlexPct) / 100);

function onAiResize(px: number): void {
  if (stackHeight.value <= 0) return;
  const pct = (px / stackHeight.value) * 100;
  workspace.updateAiSize(pct);
}
</script>

<template>
  <div class="flex min-h-0 flex-col border-l border-border bg-card" @mousedown.capture="measure">
    <!-- Стек панелей: AI сверху, Кодекс снизу -->
    <div v-if="workspace.rightColumnVisible" ref="stackRef" class="flex min-h-0 flex-1 flex-col">
      <!-- AI АССИСТЕНТ -->
      <section
        v-if="workspace.aiOpen"
        class="flex min-h-0 overflow-hidden"
        :style="{
          flexGrow: String(workspace.aiFlexPct),
          flexShrink: '0',
          flexBasis: '0%',
          minHeight: workspace.bothPanelsOpen ? '120px' : '0',
        }"
      >
        <div class="flex min-w-0 flex-1 flex-col">
          <header
            class="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background/30 px-3 py-1.5"
          >
            <span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              ✦ AI-ассистент
            </span>
            <BaseButton
              variant="ghost"
              size="sm"
              class="h-5 w-6 px-0 text-xs text-muted-foreground hover:text-foreground"
              title="Скрыть AI-ассистент"
              aria-label="Скрыть AI-ассистент"
              @click="workspace.toggleAi()"
            >
              ✕
            </BaseButton>
          </header>
          <div class="min-h-0 flex-1 overflow-hidden">
            <AssistantPanel />
          </div>
        </div>
      </section>

      <!-- Разделитель -->
      <VerticalResizeHandle
        v-if="workspace.bothPanelsOpen"
        :top-height="aiHeightPx"
        :min="aiMinPx"
        :max="aiMaxPx"
        @resize="onAiResize"
      />

      <!-- КОДЕКС -->
      <section
        v-if="workspace.codexOpen"
        class="flex min-h-0 overflow-hidden"
        :style="{
          flexGrow: String(workspace.codexFlexPct),
          flexShrink: '0',
          flexBasis: '0%',
          minHeight: workspace.bothPanelsOpen ? '120px' : '0',
        }"
      >
        <div class="flex min-w-0 flex-1 flex-col">
          <header
            class="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background/30 px-3 py-1.5"
          >
            <span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              ◆ Кодекс
            </span>
            <BaseButton
              variant="ghost"
              size="sm"
              class="h-5 w-6 px-0 text-xs text-muted-foreground hover:text-foreground"
              title="Скрыть Кодекс"
              aria-label="Скрыть Кодекс"
              @click="workspace.toggleCodex()"
            >
              ✕
            </BaseButton>
          </header>
          <div class="min-h-0 flex-1 overflow-hidden">
            <CodexPanel />
          </div>
        </div>
      </section>
    </div>

    <!-- Возврат скрытых панелей -->
    <div
      v-if="!workspace.rightColumnVisible"
      class="flex min-h-0 flex-1 flex-col items-stretch gap-2 p-3"
    >
      <p class="mb-1 text-xs text-muted-foreground">Обе панели скрыты.</p>
      <BaseButton variant="outline" size="sm" @click="workspace.openAll()">
        ✦ Показать AI и Кодекс
      </BaseButton>
    </div>
    <div
      v-else-if="!workspace.aiOpen || !workspace.codexOpen"
      class="flex shrink-0 items-center justify-center gap-2 border-t border-border bg-background/20 py-1.5"
    >
      <BaseButton
        v-if="!workspace.aiOpen"
        variant="ghost"
        size="sm"
        class="h-6 text-xs text-muted-foreground hover:text-foreground"
        @click="workspace.toggleAi()"
      >
        ✦ AI
      </BaseButton>
      <BaseButton
        v-if="!workspace.codexOpen"
        variant="ghost"
        size="sm"
        class="h-6 text-xs text-muted-foreground hover:text-foreground"
        @click="workspace.toggleCodex()"
      >
        ◆ Кодекс
      </BaseButton>
    </div>
  </div>
</template>
