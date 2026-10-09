import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Character } from '@/core/types';
import { uid } from '@/core/types';
import { idb } from '@/core/idb';

const PALETTE = ['#7dd3fc', '#f9a8d4', '#fbbf24', '#86efac', '#c4b5fd', '#fda4af'];

export const useCodexStore = defineStore('codex', () => {
  const characters = ref<Character[]>([]);
  const activeCharacterId = ref<string | null>(null);

  const sorted = computed(() => [...characters.value].sort((a, b) => a.name.localeCompare(b.name, 'ru')));
  const activeCharacter = computed(
    () => characters.value.find((c) => c.id === activeCharacterId.value) ?? null,
  );

  async function load(): Promise<void> {
    characters.value = await idb.getAllCharacters();
  }

  function create(name = 'Новый персонаж'): Character {
    const c: Character = {
      id: uid('char'),
      bookId: 'book_main',
      name,
      role: '',
      age: '',
      appearance: '',
      personality: '',
      background: '',
      goals: '',
      arc: '',
      notes: '',
      color: PALETTE[characters.value.length % PALETTE.length] ?? '#7dd3fc',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    characters.value.push(c);
    void idb.putCharacter(c);
    return c;
  }

  function update(id: string, patch: Partial<Omit<Character, 'id'>>): void {
    const idx = characters.value.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const next = { ...characters.value[idx], ...patch, updatedAt: Date.now() };
    characters.value[idx] = next;
    void idb.putCharacter(next);
  }

  function remove(id: string): void {
    characters.value = characters.value.filter((c) => c.id !== id);
    if (activeCharacterId.value === id) activeCharacterId.value = null;
    void idb.deleteCharacter(id);
  }

  async function replaceAll(list: Character[]): Promise<void> {
    for (const c of list) await idb.putCharacter(c);
    characters.value = list;
  }

  return { characters, sorted, activeCharacterId, activeCharacter, load, create, update, remove, replaceAll };
});
