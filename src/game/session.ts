import { takePuzzle } from '../engine/pool';
import type { Difficulty } from '../engine/generator';
import { autoNotes, canPencil, erase, eraseNotes, hint, input, newGame, pencilMany, undo, type Game, type InputMode } from './game';
import { createStore } from './store';
import { load, remove, save } from './storage';
import { settings } from './settings';
import { recordHint, recordStart, recordWin } from './stats';

export interface Session {
  game: Game | null;
  selected: number | null;
  /** Cells picked together for pencil marks (multi-select); empty when not in use. */
  multi: number[];
  mode: InputMode;
  paused: boolean;
}

export const GAME_KEY = 'sudoku.game';

function restore(): Session {
  const game = load<Game | null>(GAME_KEY, null);
  const ok = game && Array.isArray(game.values) && game.values.length === 81 && !game.completed;
  return { game: ok ? game : null, selected: null, multi: [], mode: 'pen', paused: false };
}

let lastSaved: Game | null = null;
export const session = createStore<Session>(restore(), (s) => {
  // Autosave: one game in progress. A finished game is not resumable.
  if (s.game === lastSaved) return;
  lastSaved = s.game;
  if (s.game && !s.game.completed) save(GAME_KEY, s.game);
  else remove(GAME_KEY);
});

/** The saved game that can be resumed, if any. */
export const inProgress = (): Game | null => {
  const g = session.get().game;
  return g && !g.completed ? g : null;
};

function setGame(fn: (g: Game) => Game): void {
  const before = session.get().game;
  if (!before) return;
  const after = fn(before);
  if (after === before) return;
  session.set((s) => ({ ...s, game: after }));
  if (after.completed && !before.completed) recordWin(after.difficulty, after.elapsedMs);
  if (after.hintsUsed > before.hintsUsed) recordHint(after.difficulty);
  if (after.mistakes > before.mistakes && settings.get().vibrate) navigator.vibrate?.(60);
}

export async function startGame(difficulty: Difficulty): Promise<void> {
  const puzzle = await takePuzzle(difficulty);
  recordStart(difficulty, inProgress()?.difficulty ?? null);
  session.set({ game: newGame(puzzle), selected: null, multi: [], mode: 'pen', paused: false });
}

export const setPaused = (paused: boolean) => session.set((s) => (s.paused === paused ? s : { ...s, paused }));

/** Add play time. Called by the game screen's clock only while the board is in focus. */
export const addTime = (ms: number) => setGame((g) => (g.completed ? g : { ...g, elapsedMs: g.elapsedMs + ms }));

export const select = (i: number | null) => session.set((s) => ({ ...s, selected: i, multi: [] }));
export const toggleMode = () => session.set((s) => ({ ...s, mode: s.mode === 'pen' ? 'pencil' : 'pen', multi: [] }));

/** Switch from the single selection to a multi-selection starting at cell `i`. */
export function startMulti(i: number): void {
  session.set((s) => ({ ...s, selected: null, multi: [] }));
  addMulti(i);
}

export function addMulti(i: number): void {
  const { game, multi } = session.get();
  if (game && canPencil(game, i) && !multi.includes(i)) session.set((s) => ({ ...s, multi: [...s.multi, i] }));
}

export const removeMulti = (i: number) => session.set((s) => ({ ...s, multi: s.multi.filter((c) => c !== i) }));
export const clearMulti = () => session.set((s) => (s.multi.length ? { ...s, multi: [] } : s));

export function enterDigit(d: number): void {
  const { selected, multi, mode } = session.get();
  if (multi.length) {
    setGame((g) => pencilMany(g, multi, d));
    clearMulti();
  } else if (selected != null) setGame((g) => input(g, selected, d, mode));
}

export function eraseSelected(): void {
  const { selected, multi } = session.get();
  if (multi.length) {
    setGame((g) => eraseNotes(g, multi));
    clearMulti();
  } else if (selected != null) setGame((g) => erase(g, selected));
}

export function hintSelected(): void {
  const { selected } = session.get();
  if (selected != null) setGame((g) => hint(g, selected));
}

export const undoLast = () => setGame(undo);
export const fillNotes = () => setGame(autoNotes);
