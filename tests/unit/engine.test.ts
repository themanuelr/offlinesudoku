import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, generate } from '../../src/engine/generator';
import { grade, Level } from '../../src/engine/grader';
import { isValid } from '../../src/engine/grid';
import { countSolutions, solve } from '../../src/engine/solver';

const parse = (s: string) => [...s].map((ch) => (ch === '.' ? 0 : +ch));

describe('solver', () => {
  it('solves a known puzzle', () => {
    const p = parse('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79');
    const s = solve(p)!;
    expect(s.join('')).toBe('534678912672195348198342567859761423426853791713924856961537284287419635345286179');
  });
  it('detects multiple solutions', () => {
    expect(countSolutions(new Array(81).fill(0))).toBe(2);
  });
  it('detects invalid grids', () => {
    const p = new Array(81).fill(0);
    p[0] = 5;
    p[1] = 5;
    expect(countSolutions(p)).toBe(0);
  });
});

describe('grader', () => {
  it('rates a singles-only puzzle as level 1', () => {
    expect(grade(parse('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'))).toBe(Level.Singles);
  });
  it('rates a famously hard puzzle as beyond techniques', () => {
    // Arto Inkala's "world's hardest sudoku".
    expect(grade(parse('8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..'))).toBe(Level.BeyondTechniques);
  });
});

describe('generator', () => {
  for (const [i, d] of DIFFICULTIES.entries()) {
    it(`makes a valid ${d} puzzle with exactly one solution`, () => {
      for (let seed = 1; seed <= 5; seed++) {
        const { puzzle, solution } = generate(d, seed * 100 + i);
        expect(isValid(solution) && solution.every((v) => v >= 1 && v <= 9)).toBe(true);
        expect(puzzle.every((v, k) => v === 0 || v === solution[k])).toBe(true);
        expect(countSolutions(puzzle)).toBe(1);
        expect(solve(puzzle)).toEqual(solution);
      }
    });
  }

  it('is reproducible with a seed', () => {
    expect(generate('hard', 42).puzzle).toEqual(generate('hard', 42).puzzle);
  });

  it('matches the technique level of each difficulty', () => {
    const expected = [Level.Singles, Level.LockedCandidates, Level.Subsets, Level.Advanced, Level.BeyondTechniques];
    DIFFICULTIES.forEach((d, k) => {
      for (let s = 0; s < 5; s++) expect(grade(generate(d, 1000 + s).puzzle)).toBe(expected[k]);
    });
  });
});
