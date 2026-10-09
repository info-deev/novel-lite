<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useCodexStore } from '@/stores/codex';
import type { Character } from '@/core/types';
import BaseButton from '@/shared/ui/BaseButton.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';

const codex = useCodexStore();
const search = ref('');
const nameInput = ref<HTMLInputElement | null>(null);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return codex.sorted;
  return codex.sorted.filter(
    (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q),
  );
});

const active = computed(() => codex.activeCharacter);

async function createCharacter(): Promise<void> {
  const c = codex.create('Новый персонаж');
  codex.activeCharacterId = c.id;
  await nextTick();
  nameInput.value?.select();
}

function update(patch: Partial<Omit<Character, 'id'>>): void {
  if (active.value) codex.update(active.value.id, patch);
}

function removeActive(): void {
  if (active.value && confirm(`Удалить «${active.value.name}» из кодекса?`)) {
    codex.remove(active.value.id);
  }
}

const fields = [
  { key: 'role', label: 'Роль' },
  { key: 'age', label: 'Возраст' },
  { key: 'appearance', label: 'Внешность' },
  { key: 'personality', label: 'Характер' },
  { key: 'background', label: 'Предыстория' },
  { key: 'goals', label: 'Цели' },
  { key: 'arc', label: 'Арка' },
  { key: 'notes', label: 'Заметки' },
] as const;

type FieldKey = (typeof fields)[number]['key'];
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Кодекс персонажей</h2>
      <BaseButton variant="ghost" size="sm" @click="createCharacter()">+ Персонаж</BaseButton>
    </header>

    <div class="shrink-0 p-2 pb-1">
      <input
        v-model="search"
        placeholder="Поиск по имени или роли…"
        class="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>

    <!-- Список -->
    <ul class="max-h-44 shrink-0 overflow-y-auto px-2 pb-2">
      <li v-for="c in filtered" :key="c.id">
        <button
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
          :class="codex.activeCharacterId === c.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'"
          @click="codex.activeCharacterId = c.id"
        >
          <span class="h-6 w-6 shrink-0 rounded-full text-center text-[11px] font-bold leading-6 text-background" :style="{ background: c.color }">
            {{ c.name.slice(0, 1) }}
          </span>
          <span class="truncate">{{ c.name }}</span>
          <span v-if="c.role" class="ml-auto shrink-0 text-[11px] text-muted-foreground">{{ c.role }}</span>
        </button>
      </li>
      <li v-if="filtered.length === 0" class="px-2 py-4 text-center text-xs text-muted-foreground">
        {{ codex.characters.length === 0 ? 'В кодексе пока нет персонажей.' : 'Ничего не найдено.' }}
      </li>
    </ul>

    <!-- Карточка -->
    <div v-if="active" class="min-h-0 flex-1 overflow-y-auto border-t border-border p-3">
      <div class="mb-3 flex items-center gap-2">
        <span class="h-9 w-9 shrink-0 rounded-full text-center text-sm font-bold leading-9 text-background" :style="{ background: active.color }">
          {{ active.name.slice(0, 1) }}
        </span>
        <input
          ref="nameInput"
          :value="active.name"
          class="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 font-serif text-base font-semibold outline-none hover:bg-accent/30 focus:bg-accent/40"
          placeholder="Имя"
          @input="update({ name: ($event.target as HTMLInputElement).value })"
        />
        <input
          type="color"
          :value="active.color"
          class="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0.5"
          title="Цвет персонажа"
          @input="update({ color: ($event.target as HTMLInputElement).value })"
        />
        <BaseButton variant="ghost" size="icon" class="h-7 w-7 text-destructive" title="Удалить" @click="removeActive()">✕</BaseButton>
      </div>

      <div class="space-y-2.5">
        <div v-for="f in fields" :key="f.key" class="space-y-1">
          <label class="text-xs font-medium text-muted-foreground">{{ f.label }}</label>
          <textarea
            v-if="f.key === 'background' || f.key === 'notes' || f.key === 'appearance'"
            :value="active[f.key as FieldKey]"
            rows="2"
            class="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            @input="update({ [f.key]: ($event.target as HTMLTextAreaElement).value })"
          ></textarea>
          <input
            v-else
            :value="active[f.key as FieldKey]"
            class="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            @input="update({ [f.key]: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </div>
    </div>

    <EmptyState v-else title="Персонаж не выбран" hint="Создайте персонажа — имя, роль, характер и арка будут под рукой при работе над сценами.">
      <BaseButton variant="primary" size="sm" @click="createCharacter()">Создать первого персонажа</BaseButton>
    </EmptyState>
  </div>
</template>
