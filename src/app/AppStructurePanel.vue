<script setup lang="ts">
import { computed } from 'vue';
import { useBookStore } from '@/stores/book';
import { useSettingsStore } from '@/stores/settings';
import { STATUS_LABELS, type Scene } from '@/core/types';
import BaseButton from '@/shared/ui/BaseButton.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';

const book = useBookStore();
const settings = useSettingsStore();

const wordBadge = (scene: Scene): string => (scene.wordCount > 0 ? `${scene.wordCount}` : '');

const grouped = computed(() =>
  book.sortedActs.map((act) => ({
    act,
    scenes: book.scenesByAct.get(act.id) ?? [],
  })),
);

function openScene(scene: Scene): void {
  book.setActiveScene(scene.id);
}

function statusDot(scene: Scene): string {
  return scene.status === 'done'
    ? 'bg-emerald-500'
    : scene.status === 'revised'
      ? 'bg-sky-500'
      : scene.status === 'draft'
        ? 'bg-amber-500'
        : 'bg-muted-foreground/40';
}
</script>

<template>
  <aside
    v-if="settings.state.structureOpen"
    class="flex shrink-0 flex-col border-r border-border bg-card"
    :style="{ width: `${settings.state.structureWidth}px` }"
  >
    <div class="flex items-center justify-between px-3 pb-1 pt-3">
      <h2 class="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">Структура</h2>
      <div class="flex gap-1">
        <BaseButton variant="ghost" size="sm" title="Новый акт" @click="book.addAct()">+ Акт</BaseButton>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
      <div class="mb-3 rounded-lg border border-border bg-background/50 px-3 py-2.5">
        <p class="font-serif text-sm font-semibold leading-snug">{{ book.book?.title ?? '—' }}</p>
        <p class="mt-0.5 text-xs text-muted-foreground">{{ book.totalWords.toLocaleString('ru') }} слов · {{ book.scenes.length }} сцен</p>
      </div>

      <EmptyState v-if="grouped.length === 0" title="Книга пуста" hint="Добавьте акт, чтобы начать структуру романа." />

      <section v-for="group in grouped" :key="group.act.id" class="mb-2">
        <details open>
          <summary class="group flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent/50">
            <span class="text-[10px] text-muted-foreground transition-transform group-open:rotate-90">▶</span>
            <span class="truncate">{{ group.act.title }}</span>
            <span class="ml-auto text-xs text-muted-foreground">{{ group.scenes.length }}</span>
          </summary>
          <ul class="mt-0.5 space-y-0.5 pl-3">
            <li v-for="scene in group.scenes" :key="scene.id" class="group/scene flex items-center gap-1">
              <button
                class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
                :class="book.activeSceneId === scene.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'"
                @click="openScene(scene)"
              >
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="statusDot(scene)" :title="STATUS_LABELS[scene.status]"></span>
                <span class="truncate">{{ scene.title || 'Без названия' }}</span>
                <span class="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ wordBadge(scene) }}</span>
              </button>
              <button
                class="shrink-0 rounded-md p-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover/scene:opacity-100"
                :class="book.activeSceneId === scene.id ? 'opacity-100' : ''"
                title="Удалить сцену"
                @click.stop="book.requestDeleteScene(scene.id)"
              >
                ✕
              </button>
            </li>
            <li v-if="group.scenes.length === 0" class="px-2 py-1 text-xs italic text-muted-foreground">Нет сцен</li>
          </ul>
        </details>
      </section>
    </div>

    <div class="border-t border-border p-2">
      <BaseButton variant="outline" size="sm" classes="w-full" @click="book.addScene(book.sortedActs[0]?.id ?? '')">
        + Новая сцена
      </BaseButton>
    </div>
  </aside>
</template>
