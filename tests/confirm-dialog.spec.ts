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
    const wrapper = mount(ConfirmDialog, { attachTo: document.body, global: { stubs: { Transition: false } } });

    const promise = confirmDialog({
      title: 'Удалить?',
      message: 'Это действие необратимо.',
      confirmText: 'Удалить',
      danger: true,
    });
    await wrapper.vm.$nextTick();
    // Контент диалога рендерится внутри Portal/Teleport — проверяем его в document.
    expect(document.body.textContent).toContain('Удалить?');
    expect(document.body.textContent).toContain('Это действие необратимо.');
    const buttons = Array.from(document.querySelectorAll('button'));
    expect(buttons.some((b) => b.textContent?.trim() === 'Удалить')).toBe(true);
    expect(buttons.some((b) => b.textContent?.trim() === 'Отмена')).toBe(true);

    rejectConfirm();
    await expect(promise).resolves.toBe(false);
    wrapper.unmount();
  });

  it('confirm button resolves true and cancel button resolves false', async () => {
    const wrapper = mount(ConfirmDialog, { attachTo: document.body, global: { stubs: { Transition: false } } });

    // Подтверждение кликом по кнопке
    const pConfirm = confirmDialog({ title: 'Сделать?', confirmText: 'Сделать' });
    await wrapper.vm.$nextTick();
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Сделать',
    );
    expect(confirmBtn).toBeDefined();
    confirmBtn!.click();
    await expect(pConfirm).resolves.toBe(true);

    // Отмена кликом по кнопке
    const pCancel = confirmDialog({ title: 'Сделать?' });
    await wrapper.vm.$nextTick();
    const cancelBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Отмена',
    );
    expect(cancelBtn).toBeDefined();
    cancelBtn!.click();
    await expect(pCancel).resolves.toBe(false);

    wrapper.unmount();
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
