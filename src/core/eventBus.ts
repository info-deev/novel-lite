type Handler = (payload?: unknown) => void;

const registry = new Map<string, Set<Handler>>();

export const eventBus = {
  on(event: string, handler: Handler): () => void {
    let set = registry.get(event);
    if (!set) {
      set = new Set();
      registry.set(event, set);
    }
    set.add(handler);
    return () => eventBus.off(event, handler);
  },
  off(event: string, handler: Handler): void {
    registry.get(event)?.delete(handler);
  },
  emit(event: string, payload?: unknown): void {
    registry.get(event)?.forEach((h) => h(payload));
  },
  clear(): void {
    registry.clear();
  },
};

export const AppEvents = {
  openScene: 'scene:open',
  commandPalette: 'ui:command-palette',
  focusEditor: 'editor:focus',
} as const;
