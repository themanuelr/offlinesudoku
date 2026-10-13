import { takePuzzle } from '../engine/pool';
import type { Difficulty } from '../engine/generator';
import { autoNotes, erase, hint, input, newGame, undo, type Game, type InputMode } from './game';
import { createStore } from './store';
import { load, remove, save } from './storage';

export interface Session {
  game: Game | null;
  selected: number | null;
  mode: InputMode;
  paused: boolean;
}

export const GAME_KEY = 'sudoku.game';

function restore(): Session {
  const game = load<Game | null>(GAME_KEY, null);
  const ok = game && Array.isArray(game.values) && game.values.length === 81 && !game.completed;
  return { game: ok ? game : null, selected: null, mode: 'pen', paused: false };
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

const setGame = (fn: (g: Game) => Game) =>
  session.set((s) => (s.game ? { ...s, game: fn(s.game) } : s));

export async function startGame(difficulty: Difficulty): Promise<void> {
  const puzzle = await takePuzzle(difficulty);
  session.set({ game: newGame(puzzle), selected: null, mode: 'pen', paused: false });
}

export const setPaused = (paused: boolean) => session.set((s) => (s.paused === paused ? s : { ...s, paused }));

/** Add play time. Called by the game screen's clock only while the board is in focus. */
export const addTime = (ms: number) => setGame((g) => (g.completed ? g : { ...g, elapsedMs: g.elapsedMs + ms }));

export const select = (i: number | null) => session.set((s) => ({ ...s, selected: i }));
export const toggleMode = () => session.set((s) => ({ ...s, mode: s.mode === 'pen' ? 'pencil' : 'pen' }));

export function enterDigit(d: number): void {
  const { selected, mode } = session.get();
  if (selected != null) setGame((g) => input(g, selected, d, mode));
}

export function eraseSelected(): void {
  const { selected } = session.get();
  if (selected != null) setGame((g) => erase(g, selected));
}

export function hintSelected(): void {
  const { selected } = session.get();
  if (selected != null) setGame((g) => hint(g, selected));
}

export const undoLast = () => setGame(undo);
export const fillNotes = () => setGame(autoNotes);
