import { BOX, COL, PEERS, ROW, UNITS, bit, candidates, firstDigit, popcount, type Grid } from './grid';

/**
 * Technique levels, from easiest to hardest. A puzzle's level is the hardest technique
 * a person needs when always using the easiest one that makes progress.
 */
export const enum Level {
  Singles = 1,
  LockedCandidates = 2,
  Subsets = 3,
  Advanced = 4,
  BeyondTechniques = 5,
}

function combinations<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => {
    if (acc.length === k) return void out.push(acc.slice());
    for (let i = start; i < arr.length; i++) {
      acc.push(arr[i]);
      rec(i + 1, acc);
      acc.pop();
    }
  };
  rec(0, []);
  return out;
}

const DIGIT_COMBOS = { 2: combinations([1, 2, 3, 4, 5, 6, 7, 8, 9], 2), 3: combinations([1, 2, 3, 4, 5, 6, 7, 8, 9], 3) };

class LogicSolver {
  g: Grid;
  cand: number[];
  empty: number;

  constructor(puzzle: Grid) {
    this.g = puzzle.slice();
    this.cand = candidates(this.g);
    this.empty = this.g.filter((d) => !d).length;
  }

  place(i: number, d: number) {
    this.g[i] = d;
    this.cand[i] = 0;
    this.empty--;
    for (const p of PEERS[i]) this.cand[p] &= ~bit(d);
  }

  /** Remove `mask` from the candidates of `cells`; true if anything changed. */
  eliminate(cells: number[], mask: number): boolean {
    let changed = false;
    for (const c of cells) {
      if (!this.g[c] && this.cand[c] & mask) {
        this.cand[c] &= ~mask;
        changed = true;
      }
    }
    return changed;
  }

  cellsWith(unit: number[], d: number): number[] {
    return unit.filter((c) => !this.g[c] && this.cand[c] & bit(d));
  }

  /** Naked and hidden singles. */
  singles(): boolean {
    for (let i = 0; i < 81; i++) {
      if (!this.g[i] && popcount(this.cand[i]) === 1) {
        this.place(i, firstDigit(this.cand[i]));
        return true;
      }
    }
    for (const u of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const cs = this.cellsWith(u, d);
        if (cs.length === 1) {
          this.place(cs[0], d);
          return true;
        }
      }
    }
    return false;
  }

  /** Pointing (box to line) and claiming (line to box). */
  lockedCandidates(): boolean {
    for (let b = 0; b < 9; b++) {
      const box = UNITS[18 + b];
      for (let d = 1; d <= 9; d++) {
        const cs = this.cellsWith(box, d);
        if (cs.length < 2) continue;
        if (cs.every((c) => ROW[c] === ROW[cs[0]]) && this.eliminate(UNITS[ROW[cs[0]]].filter((c) => BOX[c] !== b), bit(d))) return true;
        if (cs.every((c) => COL[c] === COL[cs[0]]) && this.eliminate(UNITS[9 + COL[cs[0]]].filter((c) => BOX[c] !== b), bit(d))) return true;
      }
    }
    for (let u = 0; u < 18; u++) {
      const line = UNITS[u];
      for (let d = 1; d <= 9; d++) {
        const cs = this.cellsWith(line, d);
        if (cs.length < 2 || !cs.every((c) => BOX[c] === BOX[cs[0]])) continue;
        if (this.eliminate(UNITS[18 + BOX[cs[0]]].filter((c) => !line.includes(c)), bit(d))) return true;
      }
    }
    return false;
  }

  /** Naked and hidden pairs and triples. */
  subsets(): boolean {
    for (const size of [2, 3] as const) {
      for (const u of UNITS) {
        const open = u.filter((c) => !this.g[c]);
        if (open.length <= size) continue;
        for (const set of combinations(open, size)) {
          let m = 0;
          for (const c of set) m |= this.cand[c];
          if (popcount(m) === size && this.eliminate(open.filter((c) => !set.includes(c)), m)) return true;
        }
        for (const ds of DIGIT_COMBOS[size]) {
          let dm = 0;
          for (const d of ds) dm |= bit(d);
          const cs = open.filter((c) => this.cand[c] & dm);
          if (cs.length !== size || !ds.every((d) => cs.some((c) => this.cand[c] & bit(d)))) continue;
          let changed = false;
          for (const c of cs) {
            if (this.cand[c] & ~dm) {
              this.cand[c] &= dm;
              changed = true;
            }
          }
          if (changed) return true;
        }
      }
    }
    return false;
  }

  /** X-Wing and Swordfish, in rows and columns. */
  fish(): boolean {
    for (const size of [2, 3]) {
      for (const byRow of [true, false]) {
        const cell = (line: number, k: number) => (byRow ? line * 9 + k : k * 9 + line);
        for (let d = 1; d <= 9; d++) {
          const lines: [number, number][] = [];
          for (let l = 0; l < 9; l++) {
            let m = 0;
            for (let k = 0; k < 9; k++) {
              const c = cell(l, k);
              if (!this.g[c] && this.cand[c] & bit(d)) m |= 1 << k;
            }
            const n = popcount(m);
            if (n >= 2 && n <= size) lines.push([l, m]);
          }
          for (const combo of combinations(lines, size)) {
            let m = 0;
            for (const [, lm] of combo) m |= lm;
            if (popcount(m) !== size) continue;
            const used = combo.map(([l]) => l);
            const targets: number[] = [];
            for (let l = 0; l < 9; l++) if (!used.includes(l)) for (let k = 0; k < 9; k++) if (m & (1 << k)) targets.push(cell(l, k));
            if (this.eliminate(targets, bit(d))) return true;
          }
        }
      }
    }
    return false;
  }

  /** Y-Wing (XY-Wing). */
  yWing(): boolean {
    for (let p = 0; p < 81; p++) {
      const pm = this.cand[p];
      if (this.g[p] || popcount(pm) !== 2) continue;
      const wings = PEERS[p].filter((c) => !this.g[c] && popcount(this.cand[c]) === 2 && popcount(this.cand[c] & pm) === 1);
      for (let a = 0; a < wings.length; a++) {
        for (let b = a + 1; b < wings.length; b++) {
          const x = this.cand[wings[a]];
          const y = this.cand[wings[b]];
          if ((x & pm) === (y & pm)) continue;
          const z = x & y & ~pm;
          if (popcount(z) !== 1) continue;
          const targets = PEERS[wings[a]].filter((c) => c !== wings[b] && PEERS[wings[b]].includes(c));
          if (this.eliminate(targets, z)) return true;
        }
      }
    }
    return false;
  }
}

/** Grade a puzzle by the hardest technique needed. Returns Level.BeyondTechniques if the techniques get stuck. */
export function grade(puzzle: Grid): Level {
  const s = new LogicSolver(puzzle);
  let level = Level.Singles;
  while (s.empty > 0) {
    if (s.singles()) continue;
    if (s.lockedCandidates()) level = Math.max(level, Level.LockedCandidates);
    else if (s.subsets()) level = Math.max(level, Level.Subsets);
    else if (s.fish() || s.yWing()) level = Math.max(level, Level.Advanced);
    else return Level.BeyondTechniques;
  }
  return level;
}
