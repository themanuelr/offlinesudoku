import { expect, test } from '@playwright/test';

test('prepares a puzzle for every difficulty in the background', async ({ page }) => {
  await page.goto('./');
  await expect
    .poll(async () => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('sudoku.prepared') || '{}')).sort().join()), { timeout: 20000 })
    .toBe('easy,expert,extreme,hard,medium');
});
