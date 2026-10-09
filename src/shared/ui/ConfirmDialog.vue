<script setup lang="ts">
import BaseDialog from '@/shared/ui/BaseDialog.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import { acceptConfirm, rejectConfirm, useConfirmState } from '@/shared/ui/dialogProvider';

const TITLE_ID = 'confirm-dialog-title';
const { state } = useConfirmState();
</script>

<template>
  <BaseDialog :open="state !== null" :labelled-by="TITLE_ID" max-width="max-w-sm" @close="rejectConfirm()">
    <div v-if="state" class="p-5">
      <h2 :id="TITLE_ID" class="font-serif text-base font-semibold leading-snug">{{ state.title }}</h2>
      <p v-if="state.message" class="mt-2 text-sm leading-relaxed text-muted-foreground">{{ state.message }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <BaseButton variant="outline" size="sm" @click="rejectConfirm()">
          {{ state.cancelText ?? 'Отмена' }}
        </BaseButton>
        <BaseButton :variant="state.danger ? 'destructive' : 'primary'" size="sm" autofocus @click="acceptConfirm()">
          {{ state.confirmText ?? 'Подтвердить' }}
        </BaseButton>
      </div>
    </div>
  </BaseDialog>
</template>
