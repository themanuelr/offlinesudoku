import { load, save } from '../game/storage';
import { DIFFICULTIES, generate, type Difficulty, type Puzzle } from './generator';

/**
 * Keeps one ready puzzle per difficulty in storage, generated in a background worker,
 * so starting a game never waits on generation.
 */
const KEY = 'sudoku.prepared';
type Prepared = Partial<Record<Difficulty, Puzzle>>;

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, (p: Puzzle) => void>();
const inFlight = new Map<Difficulty, Promise<Puzzle>>();

function getWorker(): Worker | null {
  if (worker || typeof Worker === 'undefined') return worker;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; puzzle: Puzzle }>) => {
      pending.get(e.data.id)?.(e.data.puzzle);
      pending.delete(e.data.id);
    };
  } catch {
    worker = null;
  }
  return worker;
}

function generateInBackground(difficulty: Difficulty): Promise<Puzzle> {
  const existing = inFlight.get(difficulty);
  if (existing) return existing;
  const w = getWorker();
  const promise: Promise<Puzzle> = w
    ? new Promise((resolve) => {
        const id = nextId++;
        pending.set(id, resolve);
        w.postMessage({ id, difficulty });
      })
    : Promise.resolve(generate(difficulty));
  inFlight.set(difficulty, promise);
  promise.finally(() => inFlight.delete(difficulty));
  return promise;
}

function refill(difficulty: Difficulty): Promise<void> {
  if (load<Prepared>(KEY, {})[difficulty]) return Promise.resolve();
  return generateInBackground(difficulty).then((p) => {
    const prepared = load<Prepared>(KEY, {});
    prepared[difficulty] = p;
    save(KEY, prepared);
  });
}

/** Take a puzzle for `difficulty`, instantly if one is prepared, and start preparing the next. */
export async function takePuzzle(difficulty: Difficulty): Promise<Puzzle> {
  const prepared = load<Prepared>(KEY, {});
  let puzzle = prepared[difficulty];
  if (puzzle) {
    delete prepared[difficulty];
    save(KEY, prepared);
  } else {
    puzzle = await generateInBackground(difficulty);
  }
  void refill(difficulty);
  return puzzle;
}

/** Prepare one puzzle for every difficulty, one after another, without blocking the UI. */
export async function prepareAll(): Promise<void> {
  for (const d of DIFFICULTIES) await refill(d);
}
