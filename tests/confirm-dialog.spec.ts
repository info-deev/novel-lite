import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ConfirmDialog from '@/shared/ui/components/dialog/ConfirmDialog.vue';
import { confirmDialog, acceptConfirm, rejectConfirm, useConfirmState } from '@/shared/ui/dialogProvider';
import { useBookStore } from '@/stores/book';

describe('confirmDialog', () => {
  beforeEach(() => {
    // гарантируем закрытое состояние провайдера
    rejectConfirm();
  });

  it('resolves true when accepted', async () => {
    const promise = confirmDialog({ title: 'Тест' });
    const { state } = useConfirmState();
    expect(state.value).not.toBeNull();
    expect(state.value!.title).toBe('Тест');
    acceptConfirm();
    await expect(promise).resolves.toBe(true);
    expect(state.value).toBeNull();
  });

  it('resolves false when rejected', async () => {
    const promise = confirmDialog({ title: 'Тест' });
    rejectConfirm();
    await expect(promise).resolves.toBe(false);
  });

  it('rejects the previous dialog when a new one opens', async () => {
    const first = confirmDialog({ title: 'Первый' });
    const second = confirmDialog({ title: 'Второй' });
    await expect(first).resolves.toBe(false);
    acceptConfirm();
    await expect(second).resolves.toBe(true);
  });

  it('renders in app style and shows message and buttons', async () => {
    const wrapper = mount(ConfirmDialog, { global: { stubs: { Teleport: true, Transition: false } } });
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);

    const promise = confirmDialog({
      title: 'Удалить?',
      message: 'Это действие необратимо.',
      confirmText: 'Удалить',
      danger: true,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Удалить?');
    expect(wrapper.text()).toContain('Это действие необратимо.');
    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.text() === 'Удалить')).toBe(true);
    expect(buttons.some((b) => b.text() === 'Отмена')).toBe(true);

    rejectConfirm();
    await expect(promise).resolves.toBe(false);
  });

  it('book.requestDeleteScene deletes the scene only after confirmation', async () => {
    setActivePinia(createPinia());
    const book = useBookStore();
    await book.load();
    const scene = book.scenes[0];
    expect(scene).toBeDefined();

    // Отмена — сцена остаётся
    const p1 = book.requestDeleteScene(scene.id);
    rejectConfirm();
    await p1;
    expect(book.scenes.some((s) => s.id === scene.id)).toBe(true);

    // Подтверждение — сцена удаляется
    const p2 = book.requestDeleteScene(scene.id);
    acceptConfirm();
    await p2;
    expect(book.scenes.some((s) => s.id === scene.id)).toBe(false);
  });
});
