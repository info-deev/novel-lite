<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUiStore } from '@/stores/ui';
import { useBookStore } from '@/stores/book';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';
import { eventBus, AppEvents } from '@/core/eventBus';

interface Command {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

const ui = useUiStore();
const book = useBookStore();
const settings = useSettingsStore();
const workspace = useWorkspaceStore();
const router = useRouter();
const query = ref('');
const cursor = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const commands = computed<Command[]>(() => {
  const list: Command[] = [
    { id: 'nav-editor', label: 'Открыть: Редактор', hint: 'Навигация', run: () => void router.push({ name: 'editor' }) },
    { id: 'nav-board', label: 'Открыть: Доска', hint: 'Навигация', run: () => void router.push({ name: 'board' }) },
    { id: 'nav-settings', label: 'Открыть: Настройки', hint: 'Навигация', run: () => void router.push({ name: 'settings' }) },
    { id: 'toggle-theme', label: 'Переключить тему', hint: 'Интерфейс', run: () => toggleThemeSafe() },
    { id: 'new-scene', label: 'Новая сцена', hint: 'Книга', run: () => addSceneSafe() },
    {
      id: 'toggle-ai',
      label: workspace.aiOpen ? 'Скрыть: AI-ассистент' : 'Показать: AI-ассистент',
      hint: 'Панели',
      run: () => workspace.toggleAi(),
    },
    {
      id: 'toggle-codex',
      label: workspace.codexOpen ? 'Скрыть: Кодекс' : 'Показать: Кодекс',
      hint: 'Панели',
      run: () => workspace.toggleCodex(),
    },
    {
      id: 'toggle-right',
      label: workspace.rightColumnVisible ? 'Скрыть правую панель' : 'Показать правую панель',
      hint: 'Ctrl+\\',
      run: () => workspace.toggleRightPanels(),
    },
  ];
  for (const scene of book.scenes) {
    list.push({
      id: `scene-${scene.id}`,
      label: scene.title || 'Без названия',
      hint: 'Сцена',
      run: () => {
        book.setActiveScene(scene.id);
        eventBus.emit(AppEvents.openScene, scene.id);
        void router.push({ name: 'editor' });
      },
    });
  }
  return list;
});

function toggleThemeSafe(): void {
  settings.setTheme(settings.state.theme === 'dark' ? 'light' : 'dark');
}
function addSceneSafe(): void {
  const act = book.sortedActs[0];
  if (!act) return;
  const scene = book.addScene(act.id);
  book.setActiveScene(scene.id);
  void router.push({ name: 'editor' });
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return commands.value.slice(0, 12);
  return commands.value.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 12);
});

watch(filtered, () => (cursor.value = 0));
watch(
  () => ui.paletteOpen,
  (open) => {
    if (open) {
      query.value = '';
      cursor.value = 0;
      setTimeout(() => inputRef.value?.focus(), 10);
    }
  },
);

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    cursor.value = Math.min(cursor.value + 1, filtered.value.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    cursor.value = Math.max(cursor.value - 1, 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const cmd = filtered.value[cursor.value];
    if (cmd) {
      cmd.run();
      ui.closePalette();
    }
  } else if (e.key === 'Escape') {
    ui.closePalette();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="ui.paletteOpen" class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm" @click.self="ui.closePalette()">
        <div class="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl">
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="Команды, сцены, навигация…"
            class="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
            @keydown="onKeydown"
          />
          <ul class="max-h-80 overflow-y-auto border-t border-border py-1">
            <li v-if="filtered.length === 0" class="px-4 py-6 text-center text-sm text-muted-foreground">Ничего не найдено</li>
            <li v-for="(cmd, i) in filtered" :key="cmd.id">
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors"
                :class="i === cursor ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
                @mouseenter="cursor = i"
                @click="cmd.run(); ui.closePalette()"
              >
                <span class="truncate">{{ cmd.label }}</span>
                <span class="ml-3 shrink-0 text-xs text-muted-foreground">{{ cmd.hint }}</span>
              </button>
            </li>
          </ul>
          <div class="flex items-center gap-3 border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <span><kbd>↑↓</kbd> выбор</span><span><kbd>Enter</kbd> выполнить</span><span><kbd>Esc</kbd> закрыть</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
