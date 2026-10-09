<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { BookExport } from '@/core/idb';
import { useBookStore } from '@/stores/book';
import { useCodexStore } from '@/stores/codex';
import { useSettingsStore, type ThemeName } from '@/stores/settings';
import { useAiStore } from '@/stores/ai';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseSelect from '@/shared/ui/BaseSelect.vue';
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

const modelOptions = computed(() => {
  const opts = ai.models.map((m) => ({ value: m, label: m }));
  // Сохраняем в списке текущую модель, даже если её нет среди загруженных
  if (form.model && !opts.some((o) => o.value === form.model)) {
    opts.unshift({ value: form.model, label: `${form.model} (текущая)` });
  }
  return opts;
});

async function refreshModels(): Promise<void> {
  settings.patch({ endpoint: form.endpoint.trim() });
  await ai.loadModels();
  if (ai.models.length > 0) form.model = settings.state.model;
}

onMounted(() => {
  void refreshModels();
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

function onBookTitle(value: string): void {
  book.updateBook({ title: value });
}
function onBookAuthor(value: string): void {
  book.updateBook({ author: value });
}
function onBookSynopsis(value: string): void {
  book.updateBook({ synopsis: value });
}

async function exportJson(): Promise<void> {
  if (!book.book) return;
  const data: BookExport = {
    version: 1,
    exportedAt: Date.now(),
    book: book.book,
    acts: book.acts,
    scenes: book.scenes,
    characters: codex.characters,
  };
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
    window.alert('Не удалось импортировать файл: проверьте формат JSON.');
  } finally {
    inputEl.value = '';
  }
}

function resetDemo(): void {
  if (window.confirm('Сбросить книгу и создать демо-данные заново? Текущие данные будут удалены.')) {
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
        <p class="mt-1 text-sm text-muted-foreground">
          Локальная писательская студия: все данные хранятся в IndexedDB вашего браузера.
        </p>
      </header>

      <!-- О книге -->
      <section class="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 class="text-sm font-semibold">О книге</h2>
        <BaseInput
          :model-value="book.book?.title ?? ''"
          label="Название"
          placeholder="Название романа"
          @update:model-value="onBookTitle"
        />
        <BaseInput
          :model-value="book.book?.author ?? ''"
          label="Автор"
          placeholder="Имя автора"
          @update:model-value="onBookAuthor"
        />
        <BaseTextarea
          :model-value="book.book?.synopsis ?? ''"
          label="Синопсис"
          :rows="3"
          placeholder="О чём эта книга?"
          @update:model-value="onBookSynopsis"
        />
      </section>

      <!-- Внешний вид -->
      <section class="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 class="text-sm font-semibold">Внешний вид</h2>
        <div class="flex gap-2">
          <BaseButton
            v-for="t in (['dark', 'light'] as ThemeName[])"
            :key="t"
            :variant="settings.state.theme === t ? 'primary' : 'outline'"
            size="sm"
            @click="setTheme(t)"
          >
            {{ t === 'dark' ? '🌙 Тёмная' : '☀️ Светлая' }}
          </BaseButton>
        </div>
        <p class="text-xs text-muted-foreground">Тема сохраняется автоматически.</p>
      </section>

      <!-- AI / Ollama -->
      <section class="space-y-3 rounded-xl border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold">AI-ассистент (Ollama)</h2>
          <span
            v-if="health !== 'idle'"
            class="rounded-full px-2 py-0.5 text-[11px]"
            :class="health === 'ok' ? 'bg-emerald-500/15 text-emerald-500' : health === 'fail' ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'"
          >
            {{ health === 'ok' ? 'Соединение установлено' : health === 'fail' ? 'Сервер недоступен' : 'Проверка…' }}
          </span>
        </div>
        <div class="flex items-end gap-2">
          <BaseInput v-model="form.endpoint" label="Endpoint" placeholder="http://localhost:11434" class="flex-1" />
          <BaseButton variant="secondary" size="md" :disabled="ai.modelsLoading" @click="void refreshModels()">
            {{ ai.modelsLoading ? 'Загрузка…' : '⟳ Обновить' }}
          </BaseButton>
        </div>
        <BaseSelect
          v-if="modelOptions.length > 0"
          v-model="form.model"
          label="Модель"
          :options="modelOptions"
          :loading="ai.modelsLoading"
          hint="Список подтягивается автоматически с сервера Ollama"
        />
        <p v-else-if="ai.modelsError" class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
          ⚠ {{ ai.modelsError }}
        </p>
        <BaseInput v-else v-model="form.model" label="Модель" placeholder="llama3.1" />
        <p v-if="modelOptions.length === 0 && !ai.modelsError" class="-mt-1 text-xs text-muted-foreground">
          Модели не загружены — укажите название вручную или нажмите «Обновить».
        </p>
        <BaseTextarea v-model="form.systemPrompt" label="Системный промпт" :rows="4" />
        <BaseTextarea
          v-model="form.scenePrompt"
          label="Промпт контекста сцены"
          :rows="4"
          hint="Доступные переменные: {title}, {synopsis}, {content}"
        />
        <div class="flex flex-wrap gap-2 pt-1">
          <BaseButton variant="primary" size="sm" @click="apply">Сохранить</BaseButton>
          <BaseButton variant="secondary" size="sm" @click="checkConnection">Проверить соединение</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="resetPrompts">Сбросить промпты</BaseButton>
          <span v-if="saved" class="self-center text-xs text-emerald-500">✓ Настройки сохранены</span>
        </div>
      </section>

      <!-- Данные -->
      <section class="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 class="text-sm font-semibold">Данные</h2>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Книга: «{{ book.book?.title ?? '—' }}» · актов: {{ book.acts.length }} · сцен: {{ book.scenes.length }} ·
          персонажей: {{ codex.characters.length }} · слов: {{ book.totalWords.toLocaleString('ru') }}
        </p>
        <div class="flex flex-wrap gap-2">
          <BaseButton variant="secondary" size="sm" @click="void exportJson()">⬇ Экспорт JSON</BaseButton>
          <BaseButton variant="secondary" size="sm" @click="fileInput?.click()">⬆ Импорт JSON</BaseButton>
          <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="importJson" />
          <BaseButton variant="destructive" size="sm" @click="resetDemo">Сбросить к демо</BaseButton>
        </div>
      </section>

      <footer class="pb-6 text-center text-xs text-muted-foreground">
        Lite Novelcrafter · полностью локальное приложение · Ctrl/Cmd+K — команды
      </footer>
    </div>
  </div>
</template>
