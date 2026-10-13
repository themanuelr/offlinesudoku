import { grade, Level } from './grader';
import { rng, shuffle, type Grid } from './grid';
import { countSolutions, randomFullGrid } from './solver';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert', 'extreme'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface Puzzle {
  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
}

/** Dig cells down to `minClues`, then accept the puzzle if its grade is in `levels`. */
const TARGETS: Record<Difficulty, { minClues: number; levels: Level[] }> = {
  easy: { minClues: 38, levels: [Level.Singles] },
  medium: { minClues: 30, levels: [Level.LockedCandidates] },
  hard: { minClues: 26, levels: [Level.Subsets] },
  expert: { minClues: 22, levels: [Level.Advanced] },
  extreme: { minClues: 17, levels: [Level.BeyondTechniques] },
};

/** Remove cells in random order while the puzzle keeps exactly one solution. */
function dig(solution: Grid, minClues: number, random: () => number): Grid {
  const p = solution.slice();
  let clues = 81;
  for (const i of shuffle([...Array(81).keys()], random)) {
    if (clues <= minClues) break;
    const v = p[i];
    p[i] = 0;
    if (countSolutions(p) === 1) clues--;
    else p[i] = v;
  }
  return p;
}

/**
 * Generate a puzzle with exactly one solution at the given difficulty.
 * After `maxAttempts` misses it returns the closest attempt rather than looping forever.
 */
export function generate(difficulty: Difficulty, seed?: number, maxAttempts = 2000): Puzzle {
  const random = rng(seed);
  const target = TARGETS[difficulty];
  let best: { puzzle: Grid; solution: Grid; distance: number } | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = randomFullGrid(random);
    const puzzle = dig(solution, target.minClues, random);
    const level = grade(puzzle);
    if (target.levels.includes(level)) return { difficulty, puzzle, solution };
    const distance = Math.min(...target.levels.map((l) => Math.abs(l - level)));
    if (!best || distance < best.distance) best = { puzzle, solution, distance };
  }
  return { difficulty, puzzle: best!.puzzle, solution: best!.solution };
}
