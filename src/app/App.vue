<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppRail from '@/app/AppRail.vue';
import AppStructurePanel from '@/app/AppStructurePanel.vue';
import AppCommandPalette from '@/app/AppCommandPalette.vue';
import AppRightStack from '@/app/AppRightStack.vue';
import PanelResizeHandle from '@/shared/ui/PanelResizeHandle.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import { useBookStore } from '@/stores/book';
import { useCodexStore } from '@/stores/codex';
import { useSettingsStore } from '@/stores/settings';
import { useUiStore } from '@/stores/ui';
import { useWorkspaceStore } from '@/stores/workspace';
import { eventBus, AppEvents } from '@/core/eventBus';

const route = useRoute();
const book = useBookStore();
const codex = useCodexStore();
const settings = useSettingsStore();
const ui = useUiStore();
const workspace = useWorkspaceStore();

const showAssistantStack = computed(() => route.name === 'editor' || route.name === 'board');

async function loadAll(): Promise<void> {
  await book.load();
  await codex.load();
  const savedSceneId = localStorage.getItem('lite-novelcrafter.active-scene');
  if (savedSceneId && book.scenes.some((s) => s.id === savedSceneId)) {
    book.setActiveScene(savedSceneId);
  }
}

function onKeydown(e: KeyboardEvent): void {
  const mod = e.metaKey || e.ctrlKey;
  if (!mod) return;
  if (e.key.toLowerCase() === 'k') {
    e.preventDefault();
    ui.togglePalette();
    return;
  }
  if (e.key === '\\') {
    e.preventDefault();
    workspace.toggleRightPanels();
    return;
  }
  if (e.altKey) {
    if (e.key === '1') {
      e.preventDefault();
      void routerPushNamed('editor');
    } else if (e.key === '2') {
      e.preventDefault();
      void routerPushNamed('board');
    } else if (e.key === '3') {
      e.preventDefault();
      void routerPushNamed('settings');
    }
  }
}

function routerPushNamed(name: string): void {
  // navigation is delegated to the rail/router via window hash fallback
  window.location.hash = `/${name}`;
}

onMounted(() => {
  void loadAll();
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});

eventBus.on(AppEvents.openScene, (payload) => {
  if (typeof payload === 'string') localStorage.setItem('lite-novelcrafter.active-scene', payload);
});
</script>

<template>
  <div class="flex h-full min-h-0 w-full overflow-hidden bg-background text-foreground">
    <!-- Узкий рейл -->
    <AppRail />

    <!-- Панель структуры книги -->
    <AppStructurePanel />
    <PanelResizeHandle
      v-if="settings.state.structureOpen"
      side="left"
      :width="settings.state.structureWidth"
      :min="200"
      :max="420"
      @resize="(w: number) => settings.patch({ structureWidth: w })"
    />

    <!-- Центральная область -->
    <main class="flex min-w-0 flex-1 flex-col">
      <div class="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card/60 px-3 py-1.5">
        <button
          class="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-accent/50"
          :title="settings.state.structureOpen ? 'Свернуть структуру' : 'Показать структуру'"
          @click="settings.patch({ structureOpen: !settings.state.structureOpen })"
        >
          <span class="text-muted-foreground">{{ settings.state.structureOpen ? '⟨' : '⟩' }}</span>
          <span class="truncate font-serif">{{ book.book?.title ?? 'Lite Novelcrafter' }}</span>
        </button>
        <div class="flex items-center gap-2">
          <BaseButton variant="ghost" size="sm" title="Командная палитра (Ctrl+K)" @click="ui.openPalette()">
            ⌘K
          </BaseButton>
          <button
            v-if="showAssistantStack"
            class="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            :title="
              workspace.rightColumnVisible
                ? 'Свернуть правую панель (Ctrl+\\)'
                : 'Показать правую панель (Ctrl+\\)'
            "
            @click="workspace.toggleRightPanels()"
          >
            {{ workspace.rightColumnVisible ? 'Панель ⟩' : 'Панель ⟨' }}
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1">
        <RouterView v-if="book.loaded" />
        <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
          <span class="animate-pulse">Загрузка книги…</span>
        </div>
      </div>
    </main>

    <!-- Правая панель: вертикальный сплит AI + Кодекс -->
    <template v-if="showAssistantStack">
      <PanelResizeHandle
        v-if="workspace.rightColumnVisible"
        side="right"
        :width="settings.state.assistantWidth"
        :min="260"
        :max="560"
        @resize="(w: number) => settings.patch({ assistantWidth: w })"
      />
      <aside
        v-if="workspace.rightColumnVisible"
        class="flex shrink-0 flex-col"
        :style="{ width: `${settings.state.assistantWidth}px` }"
      >
        <AppRightStack />
      </aside>
    </template>

    <AppCommandPalette />
  </div>
</template>
