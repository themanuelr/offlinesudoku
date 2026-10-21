import type { Difficulty, Puzzle } from '../engine/generator';
import { PEERS, bit, candidates, type Grid } from '../engine/grid';

export type InputMode = 'pen' | 'pencil';
export type ErrorMode = 'immediate' | 'conflicts' | 'off';

/** One cell's state before an action, so the action can be undone. */
interface CellSnapshot {
  i: number;
  value: number;
  notes: number;
}

export interface Game {
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
  /** Pen digits, including givens. 0 = empty. */
  values: Grid;
  /** Pencil marks per cell as digit bitmasks. */
  notes: number[];
  history: CellSnapshot[][];
  mistakes: number;
  hintsUsed: number;
  elapsedMs: number;
  completed: boolean;
}

export function newGame(p: Puzzle): Game {
  return {
    difficulty: p.difficulty,
    givens: p.puzzle.slice(),
    solution: p.solution.slice(),
    values: p.puzzle.slice(),
    notes: new Array(81).fill(0),
    history: [],
    mistakes: 0,
    hintsUsed: 0,
    elapsedMs: 0,
    completed: false,
  };
}

const isSolved = (g: Game) => g.values.every((v, i) => v === g.solution[i]);

/** Apply changes to cells, recording one undo step. Returns a new game. */
function commit(g: Game, changes: Map<number, { value: number; notes: number }>, extra: Partial<Game> = {}): Game {
  const step: CellSnapshot[] = [];
  const values = g.values.slice();
  const notes = g.notes.slice();
  for (const [i, c] of changes) {
    if (values[i] === c.value && notes[i] === c.notes) continue;
    step.push({ i, value: values[i], notes: notes[i] });
    values[i] = c.value;
    notes[i] = c.notes;
  }
  if (!step.length) return g;
  const next = { ...g, values, notes, history: [...g.history, step], ...extra };
  next.completed = isSolved(next);
  return next;
}

/** A correctly filled cell is locked, like a given. */
export const isLocked = (g: Game, i: number) => !!g.givens[i] || (g.values[i] !== 0 && g.values[i] === g.solution[i]);

const editable = (g: Game, i: number) => !g.completed && !isLocked(g, i);

/**
 * Pen: place `d` in cell `i` (same digit again clears it) and remove `d` from pencil
 * marks in the cell's row, column and box.
 * Pencil: toggle the mark `d` in an empty cell.
 */
export function input(g: Game, i: number, d: number, mode: InputMode): Game {
  if (!editable(g, i)) return g;
  const changes = new Map<number, { value: number; notes: number }>();
  if (mode === 'pencil') {
    if (g.values[i]) return g;
    changes.set(i, { value: 0, notes: g.notes[i] ^ bit(d) });
    return commit(g, changes);
  }
  if (g.values[i] === d) {
    changes.set(i, { value: 0, notes: 0 });
    return commit(g, changes);
  }
  changes.set(i, { value: d, notes: 0 });
  for (const p of PEERS[i]) if (g.notes[p] & bit(d)) changes.set(p, { value: g.values[p], notes: g.notes[p] & ~bit(d) });
  const mistake = d !== g.solution[i];
  return commit(g, changes, mistake ? { mistakes: g.mistakes + 1 } : {});
}

/** Cells that can take pencil marks: empty and not locked. */
export const canPencil = (g: Game, i: number) => editable(g, i) && !g.values[i];

/**
 * Toggle the pencil mark `d` across several cells as one undo step: removed from all
 * of them if every one already has it, otherwise added to all of them.
 */
export function pencilMany(g: Game, cells: number[], d: number): Game {
  const open = cells.filter((i) => canPencil(g, i));
  if (!open.length) return g;
  const allHave = open.every((i) => g.notes[i] & bit(d));
  const changes = new Map<number, { value: number; notes: number }>();
  for (const i of open) changes.set(i, { value: 0, notes: allHave ? g.notes[i] & ~bit(d) : g.notes[i] | bit(d) });
  return commit(g, changes);
}

/** Clear the pencil marks of several cells as one undo step. */
export function eraseNotes(g: Game, cells: number[]): Game {
  return commit(g, new Map(cells.filter((i) => canPencil(g, i)).map((i) => [i, { value: 0, notes: 0 }])));
}

export function erase(g: Game, i: number): Game {
  if (!editable(g, i)) return g;
  return commit(g, new Map([[i, { value: 0, notes: 0 }]]));
}

/** Reveal the correct digit in cell `i`. */
export function hint(g: Game, i: number): Game {
  if (!editable(g, i)) return g;
  const d = g.solution[i];
  const changes = new Map<number, { value: number; notes: number }>([[i, { value: d, notes: 0 }]]);
  for (const p of PEERS[i]) if (g.notes[p] & bit(d)) changes.set(p, { value: g.values[p], notes: g.notes[p] & ~bit(d) });
  return commit(g, changes, { hintsUsed: g.hintsUsed + 1 });
}

/** Fill every empty cell with all candidates allowed by the pen digits. */
export function autoNotes(g: Game): Game {
  if (g.completed) return g;
  const cand = candidates(g.values);
  const changes = new Map<number, { value: number; notes: number }>();
  for (let i = 0; i < 81; i++) if (!g.values[i]) changes.set(i, { value: 0, notes: cand[i] });
  return commit(g, changes);
}

/** Steps that placed a now-locked number can't be undone, so undo skips past them. */
const undoable = (g: Game, step: CellSnapshot[]) => !step.some((c) => isLocked(g, c.i));

export const canUndo = (g: Game) => !g.completed && g.history.some((step) => undoable(g, step));

export function undo(g: Game): Game {
  if (!canUndo(g)) return g;
  const history = g.history.slice();
  let step = history.pop()!;
  while (!undoable(g, step)) step = history.pop()!;
  const values = g.values.slice();
  const notes = g.notes.slice();
  for (const c of step) {
    values[c.i] = c.value;
    notes[c.i] = c.notes;
  }
  return { ...g, values, notes, history };
}

/** Cells to show in red for the chosen error mode. Givens are never marked. */
export function errorCells(g: Game, mode: ErrorMode): Set<number> {
  const out = new Set<number>();
  if (mode === 'off') return out;
  for (let i = 0; i < 81; i++) {
    const v = g.values[i];
    if (!v || g.givens[i]) continue;
    if (mode === 'immediate' ? v !== g.solution[i] : PEERS[i].some((p) => g.values[p] === v)) out.add(i);
  }
  return out;
}

/** How many of each digit (index 1-9) are still to place. */
export function remaining(g: Game): number[] {
  const left = new Array(10).fill(9);
  left[0] = 0;
  for (const v of g.values) if (v) left[v]--;
  return left;
}

/** Units (0-26) that are completely and correctly filled. */
export function completedUnits(g: Game, units: number[][]): Set<number> {
  const out = new Set<number>();
  units.forEach((u, k) => {
    if (u.every((c) => g.values[c] && g.values[c] === g.solution[c])) out.add(k);
  });
  return out;
}
