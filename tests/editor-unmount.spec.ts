// Регрессия: при переключении Редактор → Доска/Настройки компонент EditorView
// размонтируется. Хук useEditor() уничтожает Tiptap в своём beforeUnmount;
// наш flushActiveScene обязан отработать ДО него — иначе getHTML() на мёртвом
// редакторе падал с "Cannot read properties of null (reading 'cached')",
// а недописанные правки терялись.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import EditorView from '@/features/editor/EditorView.vue';
import { useBookStore } from '@/stores/book';

beforeAll(() => {
  setActivePinia(createPinia());
});

describe('EditorView unmount', () => {
  it('flushes the active scene and destroys cleanly without errors', async () => {
    const book = useBookStore();
    await book.load();
    expect(book.scenes.length).toBeGreaterThan(0);

    const scene = book.scenes[0];
    if (!scene) throw new Error('demo book must contain scenes');
    book.setActiveScene(scene.id);
    // Правка «в обход» редактора попадает в dirty-множество — её надо сбросить
    // при размонтировании, чтобы возврат на редактор показал актуальный текст.
    book.updateScene(scene.id, { content: '<p>недописанная правка</p>' });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(EditorView, { attachTo: document.body });
    // ждём онбординга Tiptap (useEditor создаёт экземпляр в onMounted)
    await new Promise((r) => setTimeout(r, 50));

    await wrapper.unmount();

    const errors = consoleError.mock.calls.map((c) => String(c[0]));
    consoleError.mockRestore();
    expect(errors.filter((e) => e.includes('beforeUnmount'))).toEqual([]);

    // Данные сохранены в IndexedDB (без потерь текста)
    const reloaded = useBookStore();
    await reloaded.load();
    const persisted = reloaded.scenes.find((s) => s.id === scene.id);
    expect(persisted?.content).toContain('недописанная правка');
  });
});
