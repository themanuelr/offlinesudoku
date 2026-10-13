import { takePuzzle } from '../engine/pool';
import type { Difficulty } from '../engine/generator';
import { autoNotes, erase, hint, input, newGame, undo, type Game, type InputMode } from './game';
import { createStore } from './store';

export interface Session {
  game: Game | null;
  selected: number | null;
  mode: InputMode;
}

export const session = createStore<Session>({ game: null, selected: null, mode: 'pen' });

const setGame = (fn: (g: Game) => Game) =>
  session.set((s) => (s.game ? { ...s, game: fn(s.game) } : s));

export async function startGame(difficulty: Difficulty): Promise<void> {
  const puzzle = await takePuzzle(difficulty);
  session.set({ game: newGame(puzzle), selected: null, mode: 'pen' });
}

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
