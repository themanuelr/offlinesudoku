// Times puzzle generation per difficulty. Run: npm run bench -- [count]
import { DIFFICULTIES, generate } from '../src/engine/generator';

const n = Number(process.argv[2] ?? 30);
for (const d of DIFFICULTIES) {
  const times: number[] = [];
  let clues = 0;
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    clues += generate(d).puzzle.filter(Boolean).length;
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / n;
  console.log(`${d.padEnd(8)} avg ${avg.toFixed(0).padStart(4)} ms   p95 ${times[Math.floor(n * 0.95)].toFixed(0).padStart(4)} ms   max ${times[n - 1].toFixed(0).padStart(4)} ms   clues ${(clues / n).toFixed(1)}`);
}
