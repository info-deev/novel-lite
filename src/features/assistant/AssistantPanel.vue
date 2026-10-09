<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useAiStore } from '@/stores/ai';
import { useBookStore } from '@/stores/book';
import { useSettingsStore } from '@/stores/settings';
import { Button } from '@/shared/ui/components/button';
import { CopyButton } from '@/shared/ui/components/copy-button';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/components/select';

const ai = useAiStore();
const book = useBookStore();
const settings = useSettingsStore();

const input = ref('');
const listRef = ref<HTMLDivElement | null>(null);

watch(
  () => ai.messages.map((m) => m.content.length).join(','),
  async () => {
    await nextTick();
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  },
);

async function submit(): Promise<void> {
  const text = input.value;
  input.value = '';
  await ai.send(text);
}

function useSuggestion(s: string): void {
  input.value = s;
  void submit();
}

const suggestions = ['Продолжи сцену', 'Опиши атмосферу подробнее', 'Усиль конфликт в сцене', 'Проверь диалоги на естественность'];

onMounted(() => {
  // Подтягиваем список моделей с локального Ollama для выпадающего списка
  if (ai.models.length === 0 && !ai.modelsLoading) void ai.loadModels();
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="flex shrink-0 items-center justify-end gap-1 border-b border-border px-3 py-2">
      <div class="flex items-center gap-1">
        <!-- Выбор модели: shadcn Select вместо нативного <select> -->
        <SelectRoot
          v-if="ai.models.length > 0"
          :model-value="settings.state.model"
          @update:model-value="settings.patch({ model: String($event) })"
        >
          <SelectTrigger
            size="sm"
            class="h-auto max-w-[160px] rounded-full border-border bg-secondary px-2 py-0.5 text-[10px] tabular-nums"
            :title="`Модель: ${settings.state.model} (${ai.models.length} доступно)`"
          >
            <SelectValue placeholder="Модель" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="m in ai.models" :key="m" :value="m" class="text-xs">{{ m }}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </SelectRoot>
        <span
          v-else
          class="rounded-full px-2 py-0.5 text-[10px] tabular-nums"
          :class="ai.streaming ? 'bg-emerald-500/15 text-emerald-500' : 'bg-secondary text-muted-foreground'"
          :title="settings.state.endpoint"
        >
          {{ settings.state.model }}
        </span>
        <Button variant="ghost" size="sm" class="h-6 px-1.5 text-xs" title="Очистить историю" @click="ai.clear()">⌫</Button>
      </div>
    </header>

    <!-- Контекст -->
    <label class="flex shrink-0 cursor-pointer items-center gap-2 border-b border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground">
      <input type="checkbox" v-model="ai.includeContext" class="h-3.5 w-3.5 accent-[var(--primary)]" />
      <span>
        Контекст:
        <b class="text-foreground">{{ book.activeScene?.title ?? 'нет активной сцены' }}</b>
        + персонажи кодекса
      </span>
    </label>

    <!-- Сообщения -->
    <div ref="listRef" class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
      <div v-if="ai.messages.length === 0 && !ai.streaming" class="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">✨</div>
        <p class="text-sm text-muted-foreground">Спросите ассистента о текущей сцене, персонажах или сюжете.</p>
        <div class="flex flex-wrap justify-center gap-1.5">
          <button
            v-for="s in suggestions"
            :key="s"
            class="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            @click="useSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div v-for="m in ai.messages" :key="m.id" class="flex w-full flex-col gap-1" :class="m.role === 'user' ? 'items-end' : 'items-start'">
        <span class="px-1 text-[10px] uppercase tracking-wide text-muted-foreground">{{ m.role === 'user' ? 'Вы' : 'Ассистент' }}</span>
        <!-- Текст сообщения + кнопка копирования в буфер обмена -->
        <div class="flex w-full items-start gap-1" :class="m.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
          <CopyButton
            v-if="m.content && !(m.role === 'assistant' && ai.streaming && m === ai.lastAssistant)"
            :text="m.content"
            :title="m.role === 'user' ? 'Скопировать запрос' : 'Скопировать ответ'"
            class="mt-1.5"
          />
          <div
            class="max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed"
            :class="m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'"
          >
            {{ m.content }}<span v-if="m.role === 'assistant' && ai.streaming && m === ai.lastAssistant" class="animate-pulse">▍</span>
          </div>
        </div>
      </div>

      <p v-if="ai.error" class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
        ⚠ {{ ai.error }}
      </p>
    </div>

    <!-- Ввод -->
    <div class="shrink-0 border-t border-border p-2.5">
      <div class="flex items-end gap-2">
        <textarea
          v-model="input"
          rows="2"
          :disabled="ai.streaming"
          placeholder="Вопрос ассистенту… (Enter — отправить)"
          class="min-h-[38px] flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
          @keydown.enter.exact.prevent="void submit()"
        ></textarea>
        <Button v-if="ai.streaming" variant="destructive" size="md" @click="ai.stop()">■</Button>
        <Button v-else variant="primary" size="md" :disabled="!input.trim()" @click="void submit()">➤</Button>
      </div>
    </div>
  </div>
</template>
