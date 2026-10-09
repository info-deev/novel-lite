import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Act, BookMeta, Scene } from '@/core/types';
import { countWords, uid } from '@/core/types';
import { idb } from '@/core/idb';
import { createDemoData } from '@/core/demo';

export const useBookStore = defineStore('book', () => {
  const book = ref<BookMeta | null>(null);
  const acts = ref<Act[]>([]);
  const scenes = ref<Scene[]>([]);
  const activeSceneId = ref<string | null>(null);
  const loaded = ref(false);
  const saveState = ref<'idle' | 'saving' | 'saved'>('idle');

  const sortedActs = computed(() => [...acts.value].sort((a, b) => a.order - b.order));
  const scenesByAct = computed(() => {
    const map = new Map<string, Scene[]>();
    for (const scene of [...scenes.value].sort((a, b) => a.order - b.order)) {
      const list = map.get(scene.actId) ?? [];
      list.push(scene);
      map.set(scene.actId, list);
    }
    return map;
  });
  const activeScene = computed(() => scenes.value.find((s) => s.id === activeSceneId.value) ?? null);
  const totalWords = computed(() => scenes.value.reduce((sum, s) => sum + s.wordCount, 0));

  async function load(): Promise<void> {
    let meta = await idb.getBook();
    if (!meta) {
      const demo = createDemoData();
      meta = demo.book;
      await idb.putBook(meta);
      for (const act of demo.acts) await idb.putAct(act);
      for (const scene of demo.scenes) {
        scene.wordCount = countWords(scene.content);
        await idb.putScene(scene);
      }
    }
    book.value = meta;
    acts.value = await idb.getAllActs();
    scenes.value = await idb.getAllScenes();
    if (activeSceneId.value === null && scenes.value.length > 0) {
      const first = [...scenes.value].sort((a, b) => a.order - b.order)[0];
      if (first) activeSceneId.value = first.id;
    }
    loaded.value = true;
  }

  const dirtySceneIds = ref(new Set<string>());

  async function flushScenes(): Promise<void> {
    for (const id of dirtySceneIds.value) {
      const scene = scenes.value.find((s) => s.id === id);
      if (scene) await idb.putScene(scene);
    }
    dirtySceneIds.value = new Set();
  }

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  function markDirty(id: string): void {
    dirtySceneIds.value.add(id);
    if (saveTimer) clearTimeout(saveTimer);
    saveState.value = 'saving';
    saveTimer = setTimeout(() => {
      void flushScenes().then(() => {
        saveState.value = 'saved';
      });
    }, 600);
  }

  function setActiveScene(id: string | null): void {
    activeSceneId.value = id;
  }

  function updateScene(id: string, patch: Partial<Omit<Scene, 'id'>>): void {
    const idx = scenes.value.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const prev = scenes.value[idx];
    const next: Scene = { ...prev, ...patch, updatedAt: Date.now() };
    if (patch.content !== undefined) next.wordCount = countWords(patch.content);
    scenes.value[idx] = next;
    markDirty(id);
  }

  function addScene(actId: string): Scene {
    const siblings = scenes.value.filter((s) => s.actId === actId);
    const scene: Scene = {
      id: uid('scene'),
      bookId: book.value?.id ?? 'book_main',
      actId,
      title: 'Новая сцена',
      synopsis: '',
      content: '',
      status: 'idea',
      pov: null,
      order: siblings.length,
      wordCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    scenes.value.push(scene);
    void idb.putScene(scene);
    return scene;
  }

  function deleteScene(id: string): void {
    scenes.value = scenes.value.filter((s) => s.id !== id);
    if (activeSceneId.value === id) activeSceneId.value = scenes.value[0]?.id ?? null;
    void idb.deleteScene(id);
  }

  function moveScene(id: string, targetActId: string, targetIndex: number): void {
    const scene = scenes.value.find((s) => s.id === id);
    if (!scene) return;
    const sourceActId = scene.actId;
    const list = scenes.value
      .filter((s) => s.actId === targetActId && s.id !== id)
      .sort((a, b) => a.order - b.order);
    list.splice(Math.min(targetIndex, list.length), 0, scene);
    list.forEach((s, i) => {
      s.order = i;
      s.actId = targetActId;
    });
    if (sourceActId !== targetActId) {
      scenes.value
        .filter((s) => s.actId === sourceActId)
        .sort((a, b) => a.order - b.order)
        .forEach((s, i) => {
          s.order = i;
        });
    }
    void persistOrders();
  }

  async function persistOrders(): Promise<void> {
    for (const s of scenes.value) await idb.putScene(s);
  }

  function addAct(): Act {
    const act: Act = {
      id: uid('act'),
      bookId: book.value?.id ?? 'book_main',
      title: `Новый акт ${acts.value.length + 1}`,
      summary: '',
      order: acts.value.length,
    };
    acts.value.push(act);
    void idb.putAct(act);
    return act;
  }

  function updateAct(id: string, patch: Partial<Omit<Act, 'id'>>): void {
    const idx = acts.value.findIndex((a) => a.id === id);
    if (idx < 0) return;
    acts.value[idx] = { ...acts.value[idx], ...patch };
    void idb.putAct(acts.value[idx]);
  }

  function deleteAct(id: string): void {
    acts.value = acts.value.filter((a) => a.id !== id);
    for (const s of scenes.value.filter((sc) => sc.actId === id)) deleteScene(s.id);
    void idb.deleteAct(id);
  }

  function updateBook(patch: Partial<Omit<BookMeta, 'id'>>): void {
    if (!book.value) return;
    book.value = { ...book.value, ...patch, updatedAt: Date.now() };
    void idb.putBook(book.value);
  }

  async function resetToDemo(): Promise<void> {
    await idb.clearAll();
    acts.value = [];
    scenes.value = [];
    book.value = null;
    activeSceneId.value = null;
    await load();
  }

  async function importData(data: { book: BookMeta; acts: Act[]; scenes: Scene[] }): Promise<void> {
    await idb.clearAll();
    await idb.putBook(data.book);
    for (const act of data.acts) await idb.putAct(act);
    for (const scene of data.scenes) {
      scene.wordCount = countWords(scene.content);
      await idb.putScene(scene);
    }
    await load();
  }

  return {
    book,
    acts,
    scenes,
    loaded,
    saveState,
    activeSceneId,
    activeScene,
    sortedActs,
    scenesByAct,
    totalWords,
    load,
    setActiveScene,
    updateScene,
    addScene,
    deleteScene,
    moveScene,
    addAct,
    updateAct,
    deleteAct,
    updateBook,
    resetToDemo,
    importData,
  };
});
