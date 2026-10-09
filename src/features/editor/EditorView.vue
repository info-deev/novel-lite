<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue';
import { useBookStore } from '@/stores/book';
import { useCodexStore } from '@/stores/codex';
import { eventBus, AppEvents } from '@/core/eventBus';
import { STATUS_LABELS, SCENE_STATUSES, type SceneStatus } from '@/core/types';
import { Button } from '@/shared/ui/components/button';
import { EmptyState } from '@/shared/ui/components/empty-state';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/components/select';

const book = useBookStore();
const codex = useCodexStore();

const showMeta = ref(true);
const savedAt = ref<string | null>(null);

/**
 * Служебное значение Select для варианта «POV не задан».
 * reka-ui запрещает пустую строку в качестве value у SelectItem,
 * поэтому используется непустой маркер, который мапится в null при сохранении.
 */
const NO_POV = '__no_pov__';

const editor = useEditor({
  content: book.activeScene?.content ?? '',
  extensions: [StarterKit, CharacterCount],
  editorProps: {
    attributes: { class: 'tiptap px-6 py-5 focus:outline-none sm:px-10', spellcheck: 'true' },
  },
  onCreate: () => {
    // Страховка: если стартовый контент не применился (редактор инициализируется
    // асинхронно), подтянем HTML активной сцены из стора.
    syncEditorWithStore();
  },
  onUpdate: () => {
    if (loadFromStore) return; // не пишем обратно во время загрузки HTML из стора
    const scene = book.activeScene;
    if (scene && editor.value) {
      book.updateScene(scene.id, { content: editor.value.getHTML() });
    }
  },
});

// Синхронизация контента сцены <-> редактор.
// loadFromStore — флаг «редактор сейчас загружает HTML из стора»: пока он true,
// onUpdate не должен писать контент обратно (иначе пустой стартовый документ
// перезаписал бы сохранённый текст сцены).
let loadFromStore = false;

function syncEditorWithStore(): void {
  const ed = editor.value;
  if (!ed) return; // watch с immediate firing раньше создания редактора —
  // начальный контент уже передан в useEditor({ content }).
  const html = book.activeScene?.content ?? '';
  loadFromStore = true;
  try {
    if (ed.getHTML() !== html) ed.commands.setContent(html, { emitUpdate: false });
  } finally {
    loadFromStore = false;
  }
}

watch(() => book.activeSceneId, syncEditorWithStore, { immediate: true });

// Tiptap может быть ещё не готов на первом тике watch — догоняем, как только появится.
watch(
  () => editor.value,
  (ed) => {
    if (ed && !loadFromStore && ed.isEmpty && (book.activeScene?.content ?? '') !== '') {
      syncEditorWithStore();
    }
  },
);

function flushActiveScene(): void {
  // Принудительно сохраняем недописанные правки при уходе с экрана редактора,
  // чтобы возврат из настроек показывал актуальный текст.
  const ed = editor.value;
  const scene = book.activeScene;
  if (ed && scene && !ed.isDestroyed) {
    const html = ed.getHTML();
    if (html !== scene.content) book.updateScene(scene.id, { content: html });
  }
  void book.saveNow();
}

// useEditor() выше (в том же setup-скоупе) зарегистрировал СВОЙ beforeUnmount-хук,
// который уничтожает Tiptap. Хуки выполняются в порядке регистрации, поэтому наш
// flush переставляется ПЕРЕД хуком useEditor — иначе он работал бы по уже
// уничтоженному редактору и падал при переключении Редактор → Доска/Настройки.
type Hook = () => void;

onBeforeUnmount(flushActiveScene);
const instance = getCurrentInstance();
if (instance) {
  // Внутренний массив beforeUnmount-хуков инстанса (поле `bu`, не экспортируется типами).
  const internals = instance as unknown as { bu?: Hook[] };
  const hooks = internals.bu;
  if (hooks && hooks.length > 1) {
    const ours = hooks[hooks.length - 1]; // только что добавленный wrapped-хук
    if (ours) {
      hooks.unshift(ours);
      hooks.pop();
    }
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') flushActiveScene();
}
document.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener('pagehide', flushActiveScene);
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', flushActiveScene);
});

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
      <Button variant="ghost" size="sm" :active="showMeta" @click="showMeta = !showMeta" title="Название и синопсис">
        ☰
      </Button>
      <input
        :value="scene.title"
        class="min-w-32 flex-1 rounded-md bg-transparent px-2 py-1 font-serif text-lg font-semibold outline-none hover:bg-accent/30 focus:bg-accent/40"
        placeholder="Название сцены"
        @input="book.updateScene(scene.id, { title: ($event.target as HTMLInputElement).value })"
      />
      <span class="hidden text-xs text-muted-foreground md:inline">{{ actTitle }}</span>
      <!-- Статус сцены: shadcn Select вместо нативного <select> -->
      <SelectRoot
        :model-value="scene.status"
        @update:model-value="setStatus($event as SceneStatus)"
      >
        <SelectTrigger size="sm" class="w-auto min-w-24 shrink-0 gap-1">
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="s in SCENE_STATUSES" :key="s" :value="s">
              {{ STATUS_LABELS[s] }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </SelectRoot>
      <span class="text-xs tabular-nums text-muted-foreground" :title="`Символов: ${charCount}`">
        {{ scene.wordCount }} сл.
      </span>
      <span class="flex w-20 items-center gap-1 text-[11px]" :class="book.saveState === 'saving' ? 'text-amber-400' : 'text-emerald-500'">
        <span class="h-1.5 w-1.5 rounded-full" :class="book.saveState === 'saving' ? 'animate-pulse bg-amber-400' : 'bg-emerald-500'"></span>
        {{ book.saveState === 'saving' ? 'Сохраняю…' : savedAt ? `Сохранено ${savedAt}` : 'Сохранено' }}
      </span>
      <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Удалить сцену" @click="book.requestDeleteScene(scene.id)">
        ✕
      </Button>
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
          <!-- POV сцены: shadcn Select вместо нативного <select> -->
          <SelectRoot
            :model-value="scene.pov ?? NO_POV"
            @update:model-value="book.updateScene(scene.id, { pov: $event === NO_POV ? null : String($event) })"
          >
            <SelectTrigger>
              <SelectValue placeholder="— не задан —" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem :value="NO_POV">— не задан —</SelectItem>
                <SelectItem v-for="c in codex.sorted" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </SelectRoot>
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
        <Button
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
        </Button>
      </template>
      <span class="mx-1 h-5 w-px bg-border"></span>
      <Button variant="ghost" size="icon" class="h-7 w-7 text-xs" title="Горизонтальная линия" @click="editor.chain().focus().setHorizontalRule().run()">
        ―
      </Button>
      <Button variant="ghost" size="icon" class="h-7 w-7 text-xs" title="Отменить" :disabled="!editor.can().undo()" @click="editor.chain().focus().undo().run()">
        ↺
      </Button>
      <Button variant="ghost" size="icon" class="h-7 w-7 text-xs" title="Повторить" :disabled="!editor.can().redo()" @click="editor.chain().focus().redo().run()">
        ↻
      </Button>
    </div>

    <!-- Сам редактор -->
    <div class="min-h-0 flex-1 overflow-y-auto bg-editor-bg">
      <div class="mx-auto max-w-3xl">
        <EditorContent :editor="editor" />
      </div>
    </div>
  </div>

  <EmptyState v-else title="Сцена не выбрана" hint="Выберите сцену слева в структуре книги или создайте новую." class="h-full">
    <Button variant="primary" size="sm" @click="book.addScene(book.sortedActs[0]?.id ?? '')">+ Новая сцена</Button>
  </EmptyState>
</template>
