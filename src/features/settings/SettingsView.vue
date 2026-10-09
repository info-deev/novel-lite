<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { BookExport } from '@/core/idb';
import { idb } from '@/core/idb';
import { useBookStore } from '@/stores/book';
import { useCodexStore } from '@/stores/codex';
import { useSettingsStore, type ThemeName } from '@/stores/settings';
import { useAiStore } from '@/stores/ai';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseTextarea from '@/shared/ui/BaseTextarea.vue';

const settings = useSettingsStore();
const book = useBookStore();
const codex = useCodexStore();
const ai = useAiStore();

const saved = ref(false);
const health = ref<'idle' | 'checking' | 'ok' | 'fail'>('idle');
const fileInput = ref<HTMLInputElement | null>(null);

const form = reactive({
  endpoint: settings.state.endpoint,
  model: settings.state.model,
  systemPrompt: settings.state.prompts.system,
  scenePrompt: settings.state.prompts.sceneContext,
});

function apply(): void {
  settings.patch({
    endpoint: form.endpoint.trim(),
    model: form.model.trim(),
    prompts: { system: form.systemPrompt, sceneContext: form.scenePrompt },
  });
  saved.value = true;
  setTimeout(() => (saved.value = false), 1800);
}

function resetPrompts(): void {
  form.systemPrompt = settings.DEFAULT_PROMPTS.system;
  form.scenePrompt = settings.DEFAULT_PROMPTS.sceneContext;
  settings.resetPrompts();
}

async function checkConnection(): Promise<void> {
  apply();
  health.value = 'checking';
  health.value = (await ai.checkHealth()) ? 'ok' : 'fail';
}

function setTheme(theme: ThemeName): void {
  settings.setTheme(theme);
}

async function exportJson(): Promise<void> {
  const data: BookExport = {
    version: 1,
    exportedAt: Date.now(),
    book: book.book ?? (await idb.getBook()),
    acts: book.acts,
    scenes: book.scenes,
    characters: codex.characters,
  };
  if (!data.book) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.book.title.replace(/[^\w\u0400-\u04FF-]+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importJson(e: Event): Promise<void> {
  const inputEl = e.target as HTMLInputElement;
  const file = inputEl.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as Partial<BookExport>;
    if (!parsed.book || !Array.isArray(parsed.acts) || !Array.isArray(parsed.scenes)) {
      throw new Error('Некорректный файл');
    }
    await book.importData({ book: parsed.book, acts: parsed.acts, scenes: parsed.scenes });
    if (Array.isArray(parsed.characters)) await codex.replaceAll(parsed.characters);
  } catch {
    alert('Не удалось импортировать файл: проверьте формат JSON.');
  } finally {
    inputEl.value = '';
  }
}

function resetDemo(): void {
  if (confirm('Сбросить книгу и создать демо-данные заново? Текущие данные будут удалены.')) {
    void book.resetToDemo();
    void codex.load();
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 class="font-serif text-xl font-semibold">Настройки</h1>
        <p class="mt-1 text-sm text-muted-foreground">Локальная писательская студия: все данные хранятся в IndexedDB вашего браузера.</p>
      </header>

      <!-- О книге -->
      <section class="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 class="text-sm font-semibold">О книге</h2>
        <BaseInput v-model="book.book!.title" label="Название" @update:model-value="settings.state.theme === 'light' && null" />
        <div class="hidden"></div>
      </section>
    </div>
  </div>
</template>
