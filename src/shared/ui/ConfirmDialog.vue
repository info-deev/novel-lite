<script setup lang="ts">
import BaseDialog from '@/shared/ui/BaseDialog.vue';
import { Button } from '@/shared/ui/components/button';
import { DialogDescription, DialogTitle } from '@/shared/ui/components/dialog';
import { acceptConfirm, rejectConfirm, useConfirmState } from '@/shared/ui/dialogProvider';

const TITLE_ID = 'confirm-dialog-title';
const { state } = useConfirmState();
</script>

<template>
  <BaseDialog :open="state !== null" :labelled-by="TITLE_ID" max-width="max-w-sm" @close="rejectConfirm()">
    <div v-if="state" class="p-5">
      <DialogTitle :id="TITLE_ID">{{ state.title }}</DialogTitle>
      <DialogDescription v-if="state.message" class="mt-2 text-sm leading-relaxed">
        {{ state.message }}
      </DialogDescription>
      <div class="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" @click="rejectConfirm()">
          {{ state.cancelText ?? 'Отмена' }}
        </Button>
        <Button :variant="state.danger ? 'destructive' : 'default'" size="sm" autofocus @click="acceptConfirm()">
          {{ state.confirmText ?? 'Подтвердить' }}
        </Button>
      </div>
    </div>
  </BaseDialog>
</template>
