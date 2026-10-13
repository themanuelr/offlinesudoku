import type { Page } from '@playwright/test';

/** The current game's solution, read from the autosave. */
export const solution = (page: Page): Promise<number[]> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('sudoku.game')!).solution);

/** Index of the first cell that is not a given. */
export const firstOpenCell = async (page: Page): Promise<number> =>
  Number(await page.locator('.cell:not(.given)').first().getAttribute('data-cell'));

export const wrongDigit = (correct: number) => (correct % 9) + 1;
