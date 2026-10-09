import { beforeAll, describe, expect, it } from 'vitest';
import { countWords, uid, SCENE_STATUSES, STATUS_LABELS } from '@/core/types';
import { createDemoData } from '@/core/demo';
import { idb } from '@/core/idb';

beforeAll(async () => {
  await idb.clearAll();
});

describe('core/types helpers', () => {
  it('counts words ignoring html markup', () => {
    expect(countWords('<p>Один&nbsp;два три</p>')).toBe(3);
    expect(countWords('   ')).toBe(0);
  });

  it('generates unique ids', () => {
    const a = uid('x');
    const b = uid('x');
    expect(a).not.toBe(b);
    expect(a.startsWith('x_')).toBe(true);
  });

  it('has all statuses labeled', () => {
    for (const s of SCENE_STATUSES) expect(STATUS_LABELS[s]).toBeTruthy();
  });
});

describe('demo book', () => {
  const demo = createDemoData();

  it('creates a full demo structure', () => {
    expect(demo.book.title.length).toBeGreaterThan(0);
    expect(demo.acts.length).toBeGreaterThanOrEqual(3);
    expect(demo.scenes.length).toBeGreaterThanOrEqual(5);
    expect(demo.characters.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps referential integrity between acts and scenes', () => {
    const actIds = new Set(demo.acts.map((a) => a.id));
    for (const scene of demo.scenes) {
      expect(actIds.has(scene.actId)).toBe(true);
    }
  });
});

describe('IndexedDB layer (fake-indexeddb)', () => {
  it('round-trips book, acts, scenes and characters', async () => {
    const demo = createDemoData();
    await idb.putBook(demo.book);
    for (const act of demo.acts) await idb.putAct(act);
    for (const scene of demo.scenes) await idb.putScene(scene);
    for (const c of demo.characters) await idb.putCharacter(c);

    const storedBook = await idb.getBook();
    expect(storedBook?.title).toBe(demo.book.title);
    expect((await idb.getAllActs()).length).toBe(demo.acts.length);
    expect((await idb.getAllScenes()).length).toBe(demo.scenes.length);
    expect((await idb.getAllCharacters()).length).toBe(demo.characters.length);

    const first = demo.scenes[0];
    if (first) {
      await idb.deleteScene(first.id);
      expect((await idb.getAllScenes()).length).toBe(demo.scenes.length - 1);
    }
  });
});
