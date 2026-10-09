<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/shared/ui/lib/utils';
import {
  ConfirmDialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from '@/shared/ui/components/dialog';
import { Button } from '@/shared/ui/components/button';
import {
  acceptConfirm,
  rejectConfirm,
  useConfirmState,
} from '@/shared/ui/dialogProvider';

const { state } = useConfirmState();

const isOpen = computed({
  get: () => state.value !== null,
  set: open => {
    // Закрытие диалога без явного выбора (оверлей, Escape) — это отмена.
    if (!open && state.value) rejectConfirm();
  },
});

/**
 * Кнопка подтверждения: сначала фиксируем положительный ответ, затем закрываем диалог.
 * Порядок важен: если закрыть через DialogClose, обработчик закрытия сбросит промис как false.
 */
function onConfirm(): void {
  acceptConfirm();
}

function onCancel(): void {
  rejectConfirm();
}
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <!--
      ConfirmDialogContent берёт на себя aria-labelledby: id заголовка
      берётся из внутреннего контекста reka-ui, что убирает warning доступности.
    -->
    <ConfirmDialogContent
      role="alertdialog"
      max-width="max-w-sm"
      :class="cn('p-0')"
    >
      <div v-if="state" class="p-5">
        <DialogTitle>{{ state.title }}</DialogTitle>
        <DialogDescription
          v-if="state.message"
          class="mt-2 text-sm leading-relaxed"
        >
          {{ state.message }}
        </DialogDescription>
        <div class="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="onCancel">
            {{ state.cancelText ?? 'Отмена' }}
          </Button>
          <Button
            :variant="state.danger ? 'destructive' : 'default'"
            size="sm"
            autofocus
            @click="onConfirm"
          >
            {{ state.confirmText ?? 'Подтвердить' }}
          </Button>
        </div>
      </div>
    </ConfirmDialogContent>
  </DialogRoot>
</template>
