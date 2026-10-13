import { BOX, COL, ROW, bit, popcount, shuffle, type Grid } from './grid';

/**
 * Backtracking solver over row/column/box bitmasks, always branching on the cell with
 * the fewest candidates. Stops after `limit` solutions. With `random`, digits are tried
 * in random order, which is how complete grids are generated.
 */
function search(grid: Grid, limit: number, random?: () => number): { count: number; first: Grid | null } {
  const g = grid.slice();
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const d = g[i];
    if (!d) continue;
    const b = bit(d);
    if ((rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & b) return { count: 0, first: null };
    rows[ROW[i]] |= b;
    cols[COL[i]] |= b;
    boxes[BOX[i]] |= b;
  }
  let count = 0;
  let first: Grid | null = null;
  const order = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const rec = (): boolean => {
    let best = -1;
    let bestMask = 0;
    let bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = 0x1ff & ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]);
      const n = popcount(m);
      if (n === 0) return false;
      if (n < bestN) {
        bestN = n;
        best = i;
        bestMask = m;
        if (n === 1) break;
      }
    }
    if (best < 0) {
      count++;
      if (!first) first = g.slice();
      return count >= limit;
    }
    const digits = random ? shuffle(order.slice(), random) : order;
    for (const d of digits) {
      const b = bit(d);
      if (!(bestMask & b)) continue;
      g[best] = d;
      rows[ROW[best]] |= b;
      cols[COL[best]] |= b;
      boxes[BOX[best]] |= b;
      const done = rec();
      g[best] = 0;
      rows[ROW[best]] &= ~b;
      cols[COL[best]] &= ~b;
      boxes[BOX[best]] &= ~b;
      if (done) return true;
    }
    return false;
  };
  rec();
  return { count, first };
}

/** Number of solutions, counting no further than `limit`. */
export function countSolutions(grid: Grid, limit = 2): number {
  return search(grid, limit).count;
}

export function solve(grid: Grid): Grid | null {
  return search(grid, 1).first;
}

export function randomFullGrid(random: () => number): Grid {
  return search(new Array(81).fill(0), 1, random).first!;
}
