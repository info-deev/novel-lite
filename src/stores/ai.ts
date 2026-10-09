import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ChatMessage } from '@/core/types';
import { uid } from '@/core/types';
import { useSettingsStore } from './settings';
import { useBookStore } from './book';
import { useCodexStore } from './codex';

interface OllamaChatChunk {
  message?: { content?: string };
  done?: boolean;
  error?: string;
}

interface OllamaModelEntry {
  name: string;
}

interface OllamaTagsResponse {
  models?: OllamaModelEntry[];
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '');
}

export const useAiStore = defineStore('ai', () => {
  const messages = ref<ChatMessage[]>([]);
  const streaming = ref(false);
  const error = ref<string | null>(null);
  const includeContext = ref(true);
  let controller: AbortController | null = null;

  const lastAssistant = computed(() =>
    [...messages.value].reverse().find((m) => m.role === 'assistant') ?? null,
  );

  function buildContext(): string {
    const settings = useSettingsStore();
    const book = useBookStore();
    const codex = useCodexStore();
    const parts: string[] = [settings.state.prompts.system];
    if (!includeContext.value) return parts.join('\n\n');

    const scene = book.activeScene;
    if (scene) {
      const tmp = document.createElement('div');
      tmp.innerHTML = scene.content;
      const text = tmp.textContent ?? '';
      parts.push(
        settings.state.prompts.sceneContext
          .replaceAll('{title}', scene.title)
          .replaceAll('{synopsis}', scene.synopsis || '—')
          .replaceAll('{content}', text.slice(0, 4000)),
      );
    }
    const relevant = codex.characters.filter(
      (c) => scene?.pov === c.id || scene?.content.includes(c.name),
    );
    const roster = (relevant.length > 0 ? relevant : codex.characters).slice(0, 5);
    if (roster.length > 0) {
      const lines = roster.map(
        (c) =>
          `- ${c.name}${c.role ? ` (${c.role})` : ''}: характер — ${c.personality || '—'}; цель — ${c.goals || '—'}; арка — ${c.arc || '—'}`,
      );
      parts.push(`Персонажи:\n${lines.join('\n')}`);
    }
    return parts.join('\n\n');
  }

  async function send(text: string): Promise<void> {
    const settings = useSettingsStore();
    error.value = null;
    const trimmed = text.trim();
    if (!trimmed || streaming.value) return;

    messages.value.push({ id: uid('msg'), role: 'user', content: trimmed, createdAt: Date.now() });
    const assistantMsg: ChatMessage = { id: uid('msg'), role: 'assistant', content: '', createdAt: Date.now() };
    messages.value.push(assistantMsg);

    controller = new AbortController();
    streaming.value = true;

    try {
      const history = messages.value
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${normalizeEndpoint(settings.state.endpoint)}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.state.model,
          messages: [{ role: 'system', content: buildContext() }, ...history],
          stream: true,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Ollama ответил ${res.status}. Проверьте endpoint и модель в настройках.`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line) as OllamaChatChunk;
          if (chunk.error) throw new Error(chunk.error);
          const piece = chunk.message?.content;
          if (piece) {
            const idx = messages.value.findIndex((m) => m.id === assistantMsg.id);
            if (idx >= 0) {
              messages.value[idx] = { ...messages.value[idx], content: messages.value[idx].content + piece };
            }
          }
        }
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.name === 'AbortError') {
        error.value = null;
      } else {
        error.value = err.message.includes('Failed to fetch')
          ? 'Не удалось связаться с Ollama. Запущен ли сервер и верен ли endpoint?'
          : err.message;
        const idx = messages.value.findIndex((m) => m.id === assistantMsg.id);
        if (idx >= 0 && messages.value[idx].content === '') messages.value.splice(idx, 1);
      }
    } finally {
      streaming.value = false;
      controller = null;
    }
  }

  function stop(): void {
    controller?.abort();
  }

  function clear(): void {
    messages.value = [];
    error.value = null;
  }

  const models = ref<string[]>([]);
  const modelsLoading = ref(false);
  const modelsError = ref<string | null>(null);

  async function loadModels(): Promise<string[]> {
    const settings = useSettingsStore();
    modelsLoading.value = true;
    modelsError.value = null;
    try {
      const res = await fetch(`${normalizeEndpoint(settings.state.endpoint)}/api/tags`);
      if (!res.ok) throw new Error(`Ollama ответил ${res.status}`);
      const data = (await res.json()) as OllamaTagsResponse;
      const list = Array.isArray(data.models) ? data.models.map((m) => m.name).filter(Boolean).sort() : [];
      models.value = list;
      // Если текущая модель недоступна — переключаемся на первую из списка
      if (list.length > 0 && !list.includes(settings.state.model)) {
        settings.patch({ model: list[0] });
      }
      return list;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      modelsError.value = err.message.includes('Failed to fetch')
        ? 'Ollama недоступен по этому endpoint. Проверьте, запущен ли сервер (ollama serve).'
        : err.message;
      models.value = [];
      return [];
    } finally {
      modelsLoading.value = false;
    }
  }

  async function checkHealth(): Promise<boolean> {
    const settings = useSettingsStore();
    try {
      const res = await fetch(`${normalizeEndpoint(settings.state.endpoint)}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }

  return {
    messages,
    streaming,
    error,
    includeContext,
    lastAssistant,
    models,
    modelsLoading,
    modelsError,
    send,
    stop,
    clear,
    checkHealth,
    loadModels,
  };
});
