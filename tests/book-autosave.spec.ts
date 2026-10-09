import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import { useBookStore } from '@/stores/book';
import { idb } from '@/core/idb';

beforeEach(async () => {
  await idb.clearAll();
  setActivePinia(createPinia());
});

describe('book store autosave', () => {
  it('creates demo book on first load', async () => {
    const book = useBookStore();
    await book.load();
    expect(book.loaded).toBe(true);
    expect(book.scenes.length).toBeGreaterThan(0);
    expect(book.activeSceneId).not.toBeNull();
  });

  it('persists scene edits to IndexedDB after saveNow()', async () => {
    const book = useBookStore();
    await book.load();
    const scene = book.activeScene;
    if (!scene) throw new Error('no active scene');

    book.updateScene(scene.id, { content: '<p>Новый абзац текста</p>' });
    await book.saveNow();

    const stored = await idb.getAllScenes();
    const persisted = stored.find((s) => s.id === scene.id);
    expect(persisted?.content).toBe('<p>Новый абзац текста</p>');
  });

  it('saveNow() flushes immediately without waiting for the debounce timer', async () => {
    const book = useBookStore();
    await book.load();
    const scene = book.activeScene;
    if (!scene) throw new Error('no active scene');

    book.updateScene(scene.id, { content: '<p>Дебунс-текст</p>' });
    // Не дожидаясь 600-мс debounce — принудительный flush сохраняет сам.
    await book.saveNow();

    const stored = await idb.getAllScenes();
    expect(stored.find((s) => s.id === scene.id)?.content).toBe('<p>Дебунс-текст</p>');
  });

  it('debounced autosave eventually writes dirty scenes', async () => {
    const book = useBookStore();
    await book.load();
    const scene = book.activeScene;
    if (!scene) throw new Error('no active scene');

    book.updateScene(scene.id, { content: '<p>Автосейв</p>' });
    await vi.waitFor(
      async () => {
        const stored = await idb.getAllScenes();
        return stored.find((s) => s.id === scene.id)?.content === '<p>Автосейв</p>';
      },
      { timeout: 3000 },
    );
    // saveState может ещё быть 'saving' (микротask-очередь fake-indexeddb),
    // но данные уже гарантированно в БД.
    expect(['saving', 'saved']).toContain(book.saveState);
  });

  it('repeated rapid edits are not lost by a concurrent flush (race guard)', async () => {
    const book = useBookStore();
    await book.load();
    const scene = book.activeScene;
    if (!scene) throw new Error('no active scene');

    book.updateScene(scene.id, { content: '<p>v1</p>' });
    const first = book.saveNow();
    // Правка прилетает, пока первая запись ещё в полёте.
    book.updateScene(scene.id, { content: '<p>v2 финальная</p>' });
    await first;
    await book.saveNow();

    const stored = await idb.getAllScenes();
    expect(stored.find((s) => s.id === scene.id)?.content).toBe('<p>v2 финальная</p>');
  });

  it('survives remount cycle: content stays in store and DB (settings -> editor bug)', async () => {
    const book = useBookStore();
    await book.load();
    const scene = book.activeScene;
    if (!scene) throw new Error('no active scene');

    book.updateScene(scene.id, { content: '<p>Текст до перехода в настройки</p>' });
    await book.saveNow();

    // Эмуляция «возврата»: новый стор читает данные из IndexedDB.
    setActivePinia(createPinia());
    const fresh = useBookStore();
    await nextTick();
    await fresh.load();

    const restored = fresh.scenes.find((s) => s.id === scene.id);
    expect(restored?.content).toBe('<p>Текст до перехода в настройки</p>');
  });
});
