import { expect, test, type Page } from '@playwright/test';

async function start(page: Page, difficulty = 'Easy') {
  await page.goto('./');
  await page.getByRole('button', { name: difficulty }).click();
  await expect(page.locator('.board')).toBeVisible();
}

const emptyCell = (page: Page) => page.locator('.cell:not(.given):not(.entered)').first();

test('enters pen digits, marks wrong ones red, and undoes', async ({ page }) => {
  await start(page);
  const cell = emptyCell(page);
  const index = await cell.getAttribute('data-cell');
  const target = page.locator(`[data-cell="${index}"]`);
  await target.dispatchEvent('pointerdown');
  // Find a wrong digit: with immediate errors, a wrong digit turns the cell red.
  let wrong = 0;
  for (let d = 1; d <= 9 && !wrong; d++) {
    await page.locator('.numpad button').nth(d - 1).click();
    if (await target.evaluate((el) => el.classList.contains('error'))) wrong = d;
    else await page.getByRole('button', { name: 'Undo' }).click();
  }
  expect(wrong).toBeGreaterThan(0);
  await expect(target).toHaveText(String(wrong));
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(target).toHaveText('');
});

test('pencil marks toggle and the pad shows remaining counts', async ({ page }) => {
  await start(page);
  const target = emptyCell(page);
  await target.dispatchEvent('pointerdown');
  await page.getByRole('button', { name: /Pencil/ }).click();
  await page.locator('.numpad button').nth(2).click();
  await page.locator('.numpad button').nth(4).click();
  await expect(target.locator('.notes')).toHaveText('35');
  await page.locator('.numpad button').nth(2).click();
  await expect(target.locator('.notes')).toHaveText('5');
  const counts = await page.locator('.numpad .left').allTextContents();
  const givens = await page.locator('.cell.given').count();
  expect(counts.reduce((a, b) => a + +b, 0)).toBe(81 - givens);
});

test('selecting a cell highlights its row, column and box', async ({ page }) => {
  await start(page);
  await page.locator('[data-cell="40"]').dispatchEvent('pointerdown');
  await expect(page.locator('.cell.related')).toHaveCount(20);
  await expect(page.locator('.cell.selected')).toHaveCount(1);
});
