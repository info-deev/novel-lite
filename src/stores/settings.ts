import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeName = 'dark' | 'light';

export interface AiPrompts {
  system: string;
  sceneContext: string;
}

const SETTINGS_KEY = 'lite-novelcrafter.settings.v1';

export interface SettingsState {
  endpoint: string;
  model: string;
  theme: ThemeName;
  prompts: AiPrompts;
  structureWidth: number;
  assistantWidth: number;
  structureOpen: boolean;
  assistantOpen: boolean;
}

export const DEFAULT_PROMPTS: AiPrompts = {
  system:
    'Ты — внимательный редактор-литератор в писательской студии. Помогай автору с текстом: предлагай варианты, исправляй стиль, задавай уточняющие вопросы. Отвечай на русском, кратко и по делу, без лишних вступлений.',
  sceneContext:
    'Контекст: активная сцена «{title}» (синопсис: {synopsis}). Текст сцены:\n"""\n{content}\n"""\nДержись этого контекста.',
};

function defaults(): SettingsState {
  return {
    endpoint: 'http://localhost:11434',
    model: 'llama3.1',
    theme: 'dark',
    prompts: { ...DEFAULT_PROMPTS },
    structureWidth: 260,
    assistantWidth: 340,
    structureOpen: true,
    assistantOpen: true,
  };
}

function load(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaults();
    return { ...defaults(), ...(parsed as Partial<SettingsState>) };
  } catch {
    return defaults();
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const state = ref<SettingsState>(load());

  function applyTheme(): void {
    const root = document.documentElement;
    root.classList.toggle('dark', state.value.theme === 'dark');
  }

  function setTheme(theme: ThemeName): void {
    state.value.theme = theme;
  }

  function resetPrompts(): void {
    state.value.prompts = { ...DEFAULT_PROMPTS };
  }

  function patch(p: Partial<SettingsState>): void {
    state.value = { ...state.value, ...p };
  }

  watch(
    state,
    (s) => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      applyTheme();
    },
    { deep: true },
  );

  applyTheme();

  return { state, setTheme, resetPrompts, patch, applyTheme, DEFAULT_PROMPTS };
});
