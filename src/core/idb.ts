import type { Act, BookMeta, Character, Scene } from './types';

const DB_NAME = 'lite-novelcrafter';
const DB_VERSION = 1;

export interface BookExport {
  version: number;
  exportedAt: number;
  book: BookMeta;
  acts: Act[];
  scenes: Scene[];
  characters: Character[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('book')) db.createObjectStore('book');
      if (!db.objectStoreNames.contains('acts')) db.createObjectStore('acts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('scenes')) db.createObjectStore('scenes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('characters')) db.createObjectStore('characters', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

function requestToPromise<T>(factory: (db: IDBDatabase) => IDBRequest<T>): Promise<T> {
  return getDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = factory(db);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
      }),
  );
}

export const idb = {
  async getBook(): Promise<BookMeta | undefined> {
    return requestToPromise<BookMeta | undefined>((db) =>
      db.transaction('book').objectStore('book').get('main') as IDBRequest<BookMeta | undefined>,
    );
  },
  async putBook(book: BookMeta): Promise<void> {
    await requestToPromise<IDBValidKey>((db) => db.transaction('book', 'readwrite').objectStore('book').put(book, 'main'));
  },
  async getAllActs(): Promise<Act[]> {
    return requestToPromise<Act[]>((db) => db.transaction('acts').objectStore('acts').getAll() as IDBRequest<Act[]>);
  },
  async putAct(act: Act): Promise<void> {
    await requestToPromise<IDBValidKey>((db) => db.transaction('acts', 'readwrite').objectStore('acts').put(act));
  },
  async deleteAct(id: string): Promise<void> {
    await requestToPromise<undefined>((db) => db.transaction('acts', 'readwrite').objectStore('acts').delete(id));
  },
  async getAllScenes(): Promise<Scene[]> {
    return requestToPromise<Scene[]>((db) => db.transaction('scenes').objectStore('scenes').getAll() as IDBRequest<Scene[]>);
  },
  async putScene(scene: Scene): Promise<void> {
    await requestToPromise<IDBValidKey>((db) => db.transaction('scenes', 'readwrite').objectStore('scenes').put(scene));
  },
  async deleteScene(id: string): Promise<void> {
    await requestToPromise<undefined>((db) => db.transaction('scenes', 'readwrite').objectStore('scenes').delete(id));
  },
  async getAllCharacters(): Promise<Character[]> {
    return requestToPromise<Character[]>((db) =>
      db.transaction('characters').objectStore('characters').getAll() as IDBRequest<Character[]>,
    );
  },
  async putCharacter(c: Character): Promise<void> {
    await requestToPromise<IDBValidKey>((db) => db.transaction('characters', 'readwrite').objectStore('characters').put(c));
  },
  async deleteCharacter(id: string): Promise<void> {
    await requestToPromise<undefined>((db) => db.transaction('characters', 'readwrite').objectStore('characters').delete(id));
  },
  async clearAll(): Promise<void> {
    const db = await getDb();
    await Promise.all(
      ['book', 'acts', 'scenes', 'characters'].map(
        (name) =>
          new Promise<void>((resolve, reject) => {
            const req = db.transaction(name, 'readwrite').objectStore(name).clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          }),
      ),
    );
  },
};
