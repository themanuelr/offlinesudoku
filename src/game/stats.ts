import { DIFFICULTIES, type Difficulty } from '../engine/generator';
import { createStore } from './store';
import { load, save } from './storage';

export interface DifficultyStats {
  played: number;
  won: number;
  bestMs: number | null;
  totalWinMs: number;
  streak: number;
  hintsUsed: number;
}

export type Stats = Record<Difficulty, DifficultyStats>;

export const STATS_KEY = 'sudoku.stats';

const empty = (): DifficultyStats => ({ played: 0, won: 0, bestMs: null, totalWinMs: 0, streak: 0, hintsUsed: 0 });
export const emptyStats = (): Stats => Object.fromEntries(DIFFICULTIES.map((d) => [d, empty()])) as Stats;

function restore(): Stats {
  const raw = load<Partial<Stats>>(STATS_KEY, {});
  const s = emptyStats();
  for (const d of DIFFICULTIES) s[d] = { ...s[d], ...(raw[d] ?? {}) };
  return s;
}

export const stats = createStore<Stats>(restore(), (s) => save(STATS_KEY, s));

const update = (d: Difficulty, fn: (s: DifficultyStats) => DifficultyStats) => stats.set((all) => ({ ...all, [d]: fn(all[d]) }));

/** A new game started. An unfinished game it replaces counts as a loss and ends that streak. */
export function recordStart(d: Difficulty, abandoned: Difficulty | null): void {
  if (abandoned) update(abandoned, (s) => ({ ...s, streak: 0 }));
  update(d, (s) => ({ ...s, played: s.played + 1 }));
}

export function recordHint(d: Difficulty): void {
  update(d, (s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }));
}

export function recordWin(d: Difficulty, ms: number): void {
  update(d, (s) => ({
    ...s,
    won: s.won + 1,
    bestMs: s.bestMs == null ? ms : Math.min(s.bestMs, ms),
    totalWinMs: s.totalWinMs + ms,
    streak: s.streak + 1,
  }));
}

export const averageMs = (s: DifficultyStats) => (s.won ? s.totalWinMs / s.won : null);

export const resetStats = () => stats.set(emptyStats());
