import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

const STORAGE_KEY = 'lite-novelcrafter.workspace.v1';

export interface RightPanelState {
  /** AI-ассистент: открыт ли и доля высоты в % */
  aiOpen: boolean;
  aiSize: number;
  /** Кодекс: открыт ли и доля высоты в % */
  codexOpen: boolean;
}

const MIN_PANEL_PCT = 20;

function defaults(): RightPanelState {
  return { aiOpen: true, aiSize: 60, codexOpen: true };
}

function load(): RightPanelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaults();
    return { ...defaults(), ...(parsed as Partial<RightPanelState>) };
  } catch {
    return defaults();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const persisted = ref<RightPanelState>(load());

  const aiOpen = computed(() => persisted.value.aiOpen);
  const codexOpen = computed(() => persisted.value.codexOpen);

  /** Правая колонка видна, если открыта хотя бы одна из панелей. */
  const rightColumnVisible = computed(
    () => persisted.value.aiOpen || persisted.value.codexOpen,
  );

  const bothPanelsOpen = computed(
    () => persisted.value.aiOpen && persisted.value.codexOpen,
  );

  /** Проценты высот для flex-раскладки (гарантия min + сумма = 100). */
  const aiFlexPct = computed(() => {
    if (!persisted.value.aiOpen) return 0;
    if (!persisted.value.codexOpen) return 100;
    return clamp(persisted.value.aiSize, MIN_PANEL_PCT, 100 - MIN_PANEL_PCT);
  });

  const codexFlexPct = computed(() => 100 - aiFlexPct.value);

  function toggleAi(): void {
    persisted.value.aiOpen = !persisted.value.aiOpen;
  }

  function toggleCodex(): void {
    persisted.value.codexOpen = !persisted.value.codexOpen;
  }

  function openAll(): void {
    persisted.value.aiOpen = true;
    persisted.value.codexOpen = true;
  }

  /** Скрыть/показать обе панели разом (горячая клавиша Ctrl/Cmd+\). */
  function toggleRightPanels(): void {
    const anyOpen = persisted.value.aiOpen || persisted.value.codexOpen;
    persisted.value.aiOpen = !anyOpen;
    persisted.value.codexOpen = !anyOpen;
  }

  /** Обновить долю высоты AI-панели; Кодекс получает остаток. */
  function updateAiSize(sizePct: number): void {
    persisted.value.aiSize = clamp(sizePct, MIN_PANEL_PCT, 100 - MIN_PANEL_PCT);
  }

  watch(
    persisted,
    (s) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        /* storage unavailable — ignore */
      }
    },
    { deep: true },
  );

  return {
    aiOpen,
    codexOpen,
    rightColumnVisible,
    bothPanelsOpen,
    aiFlexPct,
    codexFlexPct,
    toggleAi,
    toggleCodex,
    toggleRightPanels,
    openAll,
    updateAiSize,
  };
});
