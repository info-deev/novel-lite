<script setup lang="ts">
import { reactive } from 'vue';
import { useBookStore } from '@/stores/book';
import { useRouter } from 'vue-router';
import { STATUS_LABELS, SCENE_STATUSES, type Scene, type SceneStatus } from '@/core/types';
import BaseButton from '@/shared/ui/BaseButton.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';

const book = useBookStore();
const router = useRouter();

const drag = reactive<{ sceneId: string | null; overAct: string | null; overIndex: number }>({
  sceneId: null,
  overAct: null,
  overIndex: -1,
});

function statusColor(status: SceneStatus): string {
  return {
    idea: 'bg-muted-foreground/15 text-muted-foreground',
    draft: 'bg-amber-500/15 text-amber-500',
    revised: 'bg-sky-500/15 text-sky-500',
    done: 'bg-emerald-500/15 text-emerald-500',
  }[status];
}

function openScene(scene: Scene): void {
  book.setActiveScene(scene.id);
  void router.push({ name: 'editor' });
}

function onDragStart(scene: Scene, e: DragEvent): void {
  drag.sceneId = scene.id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', scene.id);
  }
}

function onDragOverColumn(actId: string, e: DragEvent): void {
  e.preventDefault();
  drag.overAct = actId;
}

function onDragOverCard(index: number, e: DragEvent): void {
  e.preventDefault();
  if (drag.sceneId) drag.overIndex = index;
}

function onDrop(actId: string, e: DragEvent): void {
  e.preventDefault();
  const id = drag.sceneId ?? e.dataTransfer?.getData('text/plain');
  if (!id) return;
  const targetList = book.scenes
    .filter((s) => s.actId === actId && s.id !== id)
    .sort((a, b) => a.order - b.order);
  const index = drag.overIndex >= 0 ? Math.min(drag.overIndex, targetList.length) : targetList.length;
  book.moveScene(id, actId, index);
  resetDrag();
}

function resetDrag(): void {
  drag.sceneId = null;
  drag.overAct = null;
  drag.overIndex = -1;
}

function cycleStatus(scene: Scene): void {
  const next = SCENE_STATUSES[(SCENE_STATUSES.indexOf(scene.status) + 1) % SCENE_STATUSES.length];
  book.updateScene(scene.id, { status: next });
}

function addSceneTo(actId: string): void {
  const scene = book.addScene(actId);
  book.setActiveScene(scene.id);
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="flex shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 py-2">
      <h1 class="font-serif text-base font-semibold">Канбан-доска сцен</h1>
      <BaseButton variant="primary" size="sm" @click="book.addAct()">+ Новый акт</BaseButton>
    </header>

    <div v-if="book.sortedActs.length === 0" class="flex-1">
      <EmptyState title="На доске пока пусто" hint="Создайте акт — он станет колонкой для сцен." />
    </div>

    <div v-else class="min-h-0 flex-1 overflow-x-auto p-4">
      <div class="flex h-full min-w-max gap-4">
        <section
          v-for="act in book.sortedActs"
          :key="act.id"
          class="flex h-full w-72 shrink-0 flex-col rounded-xl border bg-background/60 transition-colors"
          :class="drag.overAct === act.id ? 'border-primary/60 bg-accent/20' : 'border-border'"
          @dragover="onDragOverColumn(act.id, $event)"
          @drop="onDrop(act.id, $event)"
          @dragleave.self="drag.overAct = null"
        >
          <div class="shrink-0 space-y-1 border-b border-border px-3 py-2.5">
            <input
              :value="act.title"
              class="w-full rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold outline-none hover:bg-accent/30 focus:bg-accent/40"
              @change="book.updateAct(act.id, { title: ($event.target as HTMLInputElement).value })"
            />
            <p class="px-1 text-xs leading-relaxed text-muted-foreground">{{ act.summary || 'Нет описания' }}</p>
            <div class="flex items-center justify-between px-1 pt-1">
              <span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                {{ (book.scenesByAct.get(act.id) ?? []).length }} сцен
              </span>
              <div class="flex gap-1">
                <BaseButton variant="ghost" size="sm" class="h-6 px-1.5 text-xs" @click="addSceneTo(act.id)">+ сцена</BaseButton>
                <BaseButton variant="ghost" size="sm" class="h-6 px-1.5 text-xs text-destructive" @click="book.deleteAct(act.id)">✕</BaseButton>
              </div>
            </div>
          </div>

          <ul class="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
            <li
              v-for="(scene, i) in book.scenesByAct.get(act.id) ?? []"
              :key="scene.id"
              draggable="true"
              class="group cursor-grab rounded-lg border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary/40 active:cursor-grabbing"
              :class="[
                drag.sceneId === scene.id ? 'opacity-40' : '',
                drag.overAct === act.id && drag.overIndex === i ? 'ring-2 ring-primary/50' : '',
              ]"
              @dragstart="onDragStart(scene, $event)"
              @dragend="resetDrag()"
              @dragover="onDragOverCard(i, $event)"
              @dblclick="openScene(scene)"
            >
              <div class="flex items-start justify-between gap-2">
                <button class="truncate text-left text-sm font-medium leading-snug hover:text-primary" @click="openScene(scene)">
                  {{ scene.title || 'Без названия' }}
                </button>
                <button
                  class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors"
                  :class="statusColor(scene.status)"
                  :title="STATUS_LABELS[scene.status]"
                  @click.stop="cycleStatus(scene)"
                >
                  {{ STATUS_LABELS[scene.status] }}
                </button>
              </div>
              <p v-if="scene.synopsis" class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{{ scene.synopsis }}</p>
              <div class="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{{ scene.wordCount }} сл.</span>
                <span class="flex items-center gap-1">
                  <button
                    class="rounded p-0.5 opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    title="Удалить сцену"
                    @click.stop="book.requestDeleteScene(scene.id)"
                  >
                    ✕
                  </button>
                  <span class="opacity-0 transition-opacity group-hover:opacity-100">⠿</span>
                </span>
              </div>
            </li>
            <li v-if="(book.scenesByAct.get(act.id) ?? []).length === 0" class="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Перетащите сюда сцену
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
