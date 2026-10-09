export type SceneStatus = 'idea' | 'draft' | 'revised' | 'done';

export interface BookMeta {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  createdAt: number;
  updatedAt: number;
}

export interface Act {
  id: string;
  bookId: string;
  title: string;
  summary: string;
  order: number;
}

export interface Scene {
  id: string;
  bookId: string;
  actId: string;
  title: string;
  synopsis: string;
  content: string;
  status: SceneStatus;
  pov: string | null;
  order: number;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  bookId: string;
  name: string;
  role: string;
  age: string;
  appearance: string;
  personality: string;
  background: string;
  goals: string;
  arc: string;
  notes: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export const SCENE_STATUSES: SceneStatus[] = ['idea', 'draft', 'revised', 'done'];

export const STATUS_LABELS: Record<SceneStatus, string> = {
  idea: 'Идея',
  draft: 'Черновик',
  revised: 'Правки',
  done: 'Готово',
};

export function uid(prefix = ''): string {
  const raw = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${raw}` : raw;
}

export function countWords(text: string): number {
  const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  const parts = cleaned.split(/\s+/).filter((w) => w.length > 0);
  return parts.length;
}
