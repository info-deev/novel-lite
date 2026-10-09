import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';

describe('workspace store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('defaults to both panels open with AI at 60%', () => {
    const ws = useWorkspaceStore();
    expect(ws.aiOpen).toBe(true);
    expect(ws.codexOpen).toBe(true);
    expect(ws.rightColumnVisible).toBe(true);
    expect(ws.bothPanelsOpen).toBe(true);
    expect(ws.aiFlexPct).toBe(60);
    expect(ws.codexFlexPct).toBe(40);
  });

  it('toggles panels independently and keeps column visible while one is open', () => {
    const ws = useWorkspaceStore();
    ws.toggleAi();
    expect(ws.aiOpen).toBe(false);
    expect(ws.rightColumnVisible).toBe(true);
    expect(ws.codexFlexPct).toBe(100);
    ws.toggleCodex();
    expect(ws.rightColumnVisible).toBe(false);
    ws.openAll();
    expect(ws.aiOpen).toBe(true);
    expect(ws.codexOpen).toBe(true);
  });

  it('toggleRightPanels hides both at once and restores them', () => {
    const ws = useWorkspaceStore();
    ws.toggleRightPanels();
    expect(ws.aiOpen).toBe(false);
    expect(ws.codexOpen).toBe(false);
    ws.toggleRightPanels();
    expect(ws.aiOpen).toBe(true);
    expect(ws.codexOpen).toBe(true);
  });

  it('updateAiSize clamps to [20, 80] and codex gets the remainder', () => {
    const ws = useWorkspaceStore();
    ws.updateAiSize(35);
    expect(ws.aiFlexPct).toBe(35);
    expect(ws.codexFlexPct).toBe(65);
    ws.updateAiSize(5);
    expect(ws.aiFlexPct).toBe(20);
    ws.updateAiSize(99);
    expect(ws.aiFlexPct).toBe(80);
  });

  it('persists state to localStorage and reloads it', async () => {
    const ws = useWorkspaceStore();
    ws.updateAiSize(45);
    ws.toggleCodex();
    await nextTick(); // watchers are async by default
    const raw = localStorage.getItem('lite-novelcrafter.workspace.v1');
    expect(raw).not.toBeNull();
    const parsed: unknown = JSON.parse(raw as string);
    expect(parsed).toMatchObject({ aiSize: 45, codexOpen: false });

    // Rehydrating a fresh store reads back the persisted layout.
    setActivePinia(createPinia());
    const reloaded = useWorkspaceStore();
    expect(reloaded.codexOpen).toBe(false);
    // Codex скрыт → AI занимает всю высоту, но сохранённая доля (45%) не потеряна:
    expect(reloaded.aiFlexPct).toBe(100);
    reloaded.toggleCodex();
    expect(reloaded.aiFlexPct).toBe(45);
    expect(reloaded.codexFlexPct).toBe(55);
  });
});
