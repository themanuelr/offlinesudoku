/// <reference lib="webworker" />
import { generate, type Difficulty } from './generator';

self.onmessage = (e: MessageEvent<{ id: number; difficulty: Difficulty }>) => {
  const { id, difficulty } = e.data;
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, puzzle: generate(difficulty) });
};
