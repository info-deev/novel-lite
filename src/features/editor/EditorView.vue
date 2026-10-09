<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { computed, ref, watch } from 'vue';
import { useBookStore } from '@/stores/book';
import { useCodexStore } from '@/stores/codex';
import { eventBus, AppEvents } from '@/core/eventBus';
import { STATUS_LABELS, SCENE_STATUSES, type SceneStatus } from '@/core/types';
import BaseButton from '@/shared/ui/BaseButton.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';

const book = useBookStore();
const codex = useCodexStore();

const showMeta = ref(true);
const savedAt = ref<string | null>(null);

const editor = useEditor({
  content: '',
  extensions: [StarterKit, CharacterCount],
  editorProps: {
    attributes: { class: 'tiptap px-6 py-5 focus:outline-none sm:px-10', spellcheck: 'true' },
  },
  onUpdate: () => {
    const scene = book.activeScene;
    if (scene && editor.value) {
      book.updateScene(scene.id, { content: editor.value.getHTML() });
    }
  },
});

watch(
  () => book.activeSceneId,
  (id) => {
    const scene = book.scenes.find((s) => s.id === id);
    if (editor.value) {
      const html = scene?.content ?? '';
      if (editor.value.getHTML() !== html) editor.value.commands.setContent(html, { emitUpdate: false });
    }
  },
  { immediate: true },
);

watch(
  () => book.saveState,
  (state) => {
    if (state === 'saved') savedAt.value = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  },
);

eventBus.on(AppEvents.focusEditor, () => editor.value?.commands.focus());

const scene = computed(() => book.activeScene);
const actTitle = computed(() => book.acts.find((a) => a.id === scene.value?.actId)?.title ?? '');
const povName = computed(() => codex.characters.find((c) => c.id === scene.value?.pov)?.name ?? '');
const charCount = computed(() => editor.value?.storage.characterCount.characters() ?? 0);

function setStatus(status: SceneStatus): void {
  if (scene.value) book.updateScene(scene.value.id, { status });
}
</script>

<template>
  <div v-if="scene" class="flex h-full min-h-0 flex-col">
    <!-- Заголовок сцены -->
    <header class="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card/60 px-4 py-2">
      <BaseButton variant="ghost" size="sm" :active="showMeta" @click="showMeta = !showMeta" title="Название и синопсис">
        ☰
      </BaseButton>
      <input
        :value="scene.title"
        class="min-w-32 flex-1 rounded-md bg-transparent px-2 py-1 font-serif text-lg font-semibold outline-none hover:bg-accent/30 focus:bg-accent/40"
        placeholder="Название сцены"
        @input="book.updateScene(scene.id, { title: ($event.target as HTMLInputElement).value })"
      />
      <span class="hidden text-xs text-muted-foreground md:inline">{{ actTitle }}</span>
      <select
        :value="scene.status"
        class="h-8 rounded-md border border-input bg-secondary px-2 text-xs text-secondary-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
        @change="setStatus(($event.target as HTMLSelectElement).value as SceneStatus)"
      >
        <option v-for="s in SCENE_STATUSES" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
      </select>
      <span class="text-xs tabular-nums text-muted-foreground" :title="`Символов: ${charCount}`">
        {{ scene.wordCount }} сл.
      </span>
      <span class="flex w-20 items-center gap-1 text-[11px]" :class="book.saveState === 'saving' ? 'text-amber-400' : 'text-emerald-500'">
        <span class="h-1.5 w-1.5 rounded-full" :class="book.saveState === 'saving' ? 'animate-pulse bg-amber-400' : 'bg-emerald-500'"></span>
        {{ book.saveState === 'saving' ? 'Сохраняю…' : savedAt ? `Сохранено ${savedAt}` : 'Сохранено' }}
      </span>
      <BaseButton variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Удалить сцену" @click="book.requestDeleteScene(scene.id)">
        ✕
      </BaseButton>
    </header>

    <!-- Мета-панель -->
    <Transition name="fade">
      <div v-if="showMeta" class="grid shrink-0 gap-3 border-b border-border bg-card/40 px-4 py-3 sm:grid-cols-2">
        <div class="space-y-1">
          <label class="text-xs font-medium text-muted-foreground">Синопсис сцены</label>
          <textarea
            :value="scene.synopsis"
            rows="2"
            placeholder="О чём эта сцена? Что меняется к её концу?"
            class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            @input="book.updateScene(scene.id, { synopsis: ($event.target as HTMLTextAreaElement).value })"
          ></textarea>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-muted-foreground">POV — точка зрения</label>
          <select
            :value="scene.pov ?? ''"
            class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            @change="book.updateScene(scene.id, { pov: ($event.target as HTMLSelectElement).value || null })"
          >
            <option value="">— не задан —</option>
            <option v-for="c in codex.sorted" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <p v-if="povName" class="text-xs text-muted-foreground">Рассказывает: <span class="text-foreground">{{ povName }}</span></p>
        </div>
      </div>
    </Transition>

    <!-- Тулбар -->
    <div v-if="editor" class="flex shrink-0 items-center gap-0.5 border-b border-border bg-card/60 px-3 py-1.5 text-sm">
      <template
        v-for="btn in [
          { label: 'B', cmd: 'toggleBold', active: editor.isActive('bold'), cls: 'font-bold' },
          { label: 'I', cmd: 'toggleItalic', active: editor.isActive('italic'), cls: 'italic' },
          { label: 'S', cmd: 'toggleStrike', active: editor.isActive('strike'), cls: 'line-through' },
          { label: 'H1', cmd: 'toggleHeading', active: editor.isActive('heading', { level: 1 }), cls: '' },
          { label: 'H2', cmd: 'toggleHeading2', active: editor.isActive('heading', { level: 2 }), cls: '' },
          { label: '❝', cmd: 'toggleBlockquote', active: editor.isActive('blockquote'), cls: '' },
          { label: '•', cmd: 'toggleBulletList', active: editor.isActive('bulletList'), cls: '' },
          { label: '1.', cmd: 'toggleOrderedList', active: editor.isActive('orderedList'), cls: '' },
        ] as const" :key="btn.cmd"
      >
        <BaseButton
          variant="ghost"
          size="icon"
          :active="btn.active"
          :class="btn.cls"
          class="h-7 w-7 text-xs"
          @click="
            btn.cmd === 'toggleHeading'
              ? editor.chain().focus().toggleHeading({ level: 1 }).run()
              : btn.cmd === 'toggleHeading2'
                ? editor.chain().focus().toggleHeading({ level: 2 }).run()
                : editor.chain().focus()[btn.cmd]().run()
          "
        >
          {{ btn.label }}
        </BaseButton>
      </template>
      <span class="mx-1 h-5 w-px bg-border"></span>
      <BaseButton variant="ghost" size="icon" class="h-7 w-7 text-xs" title="Горизонтальная линия" @click="editor.chain().focus().setHorizontalRule().run()">
        ―
      </BaseButton>
      <BaseButton variant="ghost" size="icon" class="h-7 w-7 text-xs" title="Отменить" :disabled="!editor.can().undo()" @click="editor.chain().focus().undo().run()">
        ↺
      </BaseButton>
      <BaseButton variant="ghost" size="icon" class="h-7 w-7 text-xs" title="Повторить" :disabled="!editor.can().redo()" @click="editor.chain().focus().redo().run()">
        ↻
      </BaseButton>
    </div>

    <!-- Сам редактор -->
    <div class="min-h-0 flex-1 overflow-y-auto bg-editor-bg">
      <div class="mx-auto max-w-3xl">
        <EditorContent :editor="editor" />
      </div>
    </div>
  </div>

  <EmptyState v-else title="Сцена не выбрана" hint="Выберите сцену слева в структуре книги или создайте новую." class="h-full">
    <BaseButton variant="primary" size="sm" @click="book.addScene(book.sortedActs[0]?.id ?? '')">+ Новая сцена</BaseButton>
  </EmptyState>
</template>
