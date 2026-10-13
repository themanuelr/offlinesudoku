import { beforeEach, describe, expect, it } from 'vitest';
import { averageMs, recordHint, recordStart, recordWin, resetStats, stats } from '../../src/game/stats';

describe('stats', () => {
  beforeEach(resetStats);

  it('tracks wins, best and average time, streak and hints', () => {
    recordStart('easy', null);
    recordHint('easy');
    recordWin('easy', 90_000);
    recordStart('easy', null);
    recordWin('easy', 60_000);
    const s = stats.get().easy;
    expect(s).toMatchObject({ played: 2, won: 2, bestMs: 60_000, streak: 2, hintsUsed: 1 });
    expect(averageMs(s)).toBe(75_000);
  });

  it('an abandoned game ends the streak of its difficulty', () => {
    recordStart('hard', null);
    recordWin('hard', 1000);
    recordStart('hard', null);
    recordStart('easy', 'hard');
    expect(stats.get().hard.streak).toBe(0);
    expect(stats.get().easy.played).toBe(1);
  });
});
