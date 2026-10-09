import { ref, type Ref } from 'vue';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Окрасить кнопку подтверждения в «опасный» стиль. */
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

const state: Ref<ConfirmState | null> = ref(null);
let seq = 0;

function settle(value: boolean): void {
  if (!state.value) return;
  const { resolve } = state.value;
  state.value = null;
  resolve(value);
}

/** Показывает встроенный диалог подтверждения вместо window.confirm. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  // Повторный вызов, пока открыт предыдущий диалог, отклоняет его.
  settle(false);
  return new Promise<boolean>((resolve) => {
    state.value = { ...options, id: ++seq, resolve };
  });
}

export function useConfirmState(): { state: Ref<ConfirmState | null> } {
  return { state };
}

export function acceptConfirm(): void {
  settle(true);
}

export function rejectConfirm(): void {
  settle(false);
}

export function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault();
    rejectConfirm();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    acceptConfirm();
  }
}
