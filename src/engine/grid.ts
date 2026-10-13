/** Board geometry and candidate bitmask helpers. A grid is 81 numbers, 0 = empty, row-major. */
export type Grid = number[];

export const ROW: number[] = [];
export const COL: number[] = [];
export const BOX: number[] = [];
/** The 27 units: rows 0-8, columns 9-17, boxes 18-26. */
export const UNITS: number[][] = [];
/** The 20 cells sharing a row, column or box with each cell. */
export const PEERS: number[][] = [];

for (let i = 0; i < 81; i++) {
  ROW[i] = Math.floor(i / 9);
  COL[i] = i % 9;
  BOX[i] = Math.floor(ROW[i] / 3) * 3 + Math.floor(COL[i] / 3);
}
for (let r = 0; r < 9; r++) UNITS.push([...Array(9)].map((_, k) => r * 9 + k));
for (let c = 0; c < 9; c++) UNITS.push([...Array(9)].map((_, k) => k * 9 + c));
for (let b = 0; b < 9; b++) {
  const r0 = Math.floor(b / 3) * 3;
  const c0 = (b % 3) * 3;
  UNITS.push([...Array(9)].map((_, k) => (r0 + Math.floor(k / 3)) * 9 + c0 + (k % 3)));
}
for (let i = 0; i < 81; i++) {
  const peers: number[] = [];
  for (let j = 0; j < 81; j++) if (j !== i && (ROW[i] === ROW[j] || COL[i] === COL[j] || BOX[i] === BOX[j])) peers.push(j);
  PEERS[i] = peers;
}

export const ALL = 0x1ff;
export const bit = (d: number) => 1 << (d - 1);

const POP = new Uint8Array(512);
for (let m = 1; m < 512; m++) POP[m] = POP[m >> 1] + (m & 1);
export const popcount = (m: number) => POP[m];

/** Lowest digit (1-9) in a mask. */
export const firstDigit = (m: number) => 31 - Math.clz32(m & -m) + 1;

export function digitsOf(m: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d);
  return out;
}

/** Candidates for every cell given the placed digits (0 for filled cells). */
export function candidates(grid: Grid): number[] {
  const cand = new Array<number>(81).fill(0);
  for (let i = 0; i < 81; i++) {
    if (grid[i]) continue;
    let m = ALL;
    for (const p of PEERS[i]) if (grid[p]) m &= ~bit(grid[p]);
    cand[i] = m;
  }
  return cand;
}

/** True if no digit repeats in any unit. */
export function isValid(grid: Grid): boolean {
  for (const u of UNITS) {
    let seen = 0;
    for (const c of u) {
      const d = grid[c];
      if (!d) continue;
      if (seen & bit(d)) return false;
      seen |= bit(d);
    }
  }
  return true;
}

/** Seedable PRNG (mulberry32) so tests are reproducible. */
export function rng(seed = (Math.random() * 2 ** 32) >>> 0): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
