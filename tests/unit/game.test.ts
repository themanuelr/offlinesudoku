import { describe, expect, it } from 'vitest';
import { generate } from '../../src/engine/generator';
import { bit, PEERS } from '../../src/engine/grid';
import { autoNotes, canUndo, erase, errorCells, hint, input, isLocked, newGame, remaining, undo } from '../../src/game/game';

const fresh = () => newGame(generate('medium', 7));
const emptyCell = (g: ReturnType<typeof fresh>) => g.givens.findIndex((v) => v === 0);

describe('game', () => {
  it('ignores input on givens', () => {
    const g = fresh();
    const given = g.givens.findIndex((v) => v !== 0);
    expect(input(g, given, 1, 'pen')).toBe(g);
  });

  it('places pen digits and clears matching pencil marks in peers', () => {
    let g = fresh();
    const i = emptyCell(g);
    const d = g.solution[i];
    const wrong = (d % 9) + 1;
    const peer = PEERS[i].find((p) => !g.givens[p] && g.solution[p] !== d)!;
    g = input(g, peer, d, 'pencil');
    expect(g.notes[peer] & bit(d)).toBeTruthy();
    g = input(g, i, wrong, 'pen');
    g = input(g, i, d, 'pen');
    expect(g.values[i]).toBe(d);
    expect(g.notes[peer] & bit(d)).toBe(0);
  });

  it('locks correct cells against input, erase, hints and undo', () => {
    let g = fresh();
    const i = emptyCell(g);
    const d = g.solution[i];
    const other = g.givens.findIndex((v, k) => v === 0 && k !== i);
    g = input(g, other, 5, 'pencil');
    g = input(g, i, d, 'pen');
    expect(isLocked(g, i)).toBe(true);
    expect(input(g, i, (d % 9) + 1, 'pen')).toBe(g);
    expect(input(g, i, d, 'pen')).toBe(g);
    expect(erase(g, i)).toBe(g);
    expect(hint(g, i)).toBe(g);
    // Undo skips the locked placement and takes back the pencil mark before it.
    expect(canUndo(g)).toBe(true);
    g = undo(g);
    expect(g.values[i]).toBe(d);
    expect(g.notes[other]).toBe(0);
    expect(g.history).toHaveLength(0);
    expect(canUndo(g)).toBe(false);
  });

  it('undo takes back wrong numbers', () => {
    let g = fresh();
    const i = emptyCell(g);
    g = input(g, i, (g.solution[i] % 9) + 1, 'pen');
    g = undo(g);
    expect(g.values[i]).toBe(0);
  });

  it('counts mistakes and marks them per error mode', () => {
    let g = fresh();
    const i = emptyCell(g);
    const wrong = (g.solution[i] % 9) + 1;
    g = input(g, i, wrong, 'pen');
    expect(g.mistakes).toBe(1);
    expect(errorCells(g, 'immediate').has(i)).toBe(true);
    expect(errorCells(g, 'off').size).toBe(0);
    const clashes = PEERS[i].some((p) => g.values[p] === wrong);
    expect(errorCells(g, 'conflicts').has(i)).toBe(clashes);
  });

  it('same digit again clears the cell; erase clears too', () => {
    let g = fresh();
    const i = emptyCell(g);
    const wrong = (g.solution[i] % 9) + 1;
    g = input(g, i, wrong, 'pen');
    g = input(g, i, wrong, 'pen');
    expect(g.values[i]).toBe(0);
    g = input(g, i, 4, 'pencil');
    g = erase(g, i);
    expect(g.notes[i]).toBe(0);
  });

  it('hint reveals the solution and is counted', () => {
    let g = fresh();
    const i = emptyCell(g);
    g = hint(g, i);
    expect(g.values[i]).toBe(g.solution[i]);
    expect(g.hintsUsed).toBe(1);
  });

  it('auto notes fills candidates for empty cells only', () => {
    const g = autoNotes(fresh());
    const i = emptyCell(g);
    expect(g.notes[i] & bit(g.solution[i])).toBeTruthy();
    expect(g.notes.every((n, k) => (g.values[k] ? n === 0 : n !== 0))).toBe(true);
  });

  it('completes when every cell matches the solution', () => {
    let g = fresh();
    for (let i = 0; i < 81; i++) if (!g.givens[i]) g = input(g, i, g.solution[i], 'pen');
    expect(g.completed).toBe(true);
    expect(remaining(g).slice(1)).toEqual(new Array(9).fill(0));
  });
});
