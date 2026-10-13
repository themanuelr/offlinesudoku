import { expect, test, type Page } from '@playwright/test';
import { solution, wrongDigit } from './helpers';

async function start(page: Page, difficulty = 'Easy') {
  await page.goto('./');
  await page.getByRole('button', { name: difficulty }).click();
  await expect(page.locator('.board')).toBeVisible();
}

const emptyCell = (page: Page) => page.locator('.cell:not(.given):not(.entered)').first();

test('enters pen digits, marks wrong ones red, and undoes', async ({ page }) => {
  await start(page);
  const index = Number(await emptyCell(page).getAttribute('data-cell'));
  const target = page.locator(`[data-cell="${index}"]`);
  const wrong = wrongDigit((await solution(page))[index]);
  await target.dispatchEvent('pointerdown');
  await page.locator('.numpad button').nth(wrong - 1).click();
  await expect(target).toHaveText(String(wrong));
  await expect(target).toHaveClass(/error/);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(target).toHaveText('');
});

test('a correctly filled cell is locked', async ({ page }) => {
  await start(page);
  const index = Number(await emptyCell(page).getAttribute('data-cell'));
  const target = page.locator(`[data-cell="${index}"]`);
  const correct = (await solution(page))[index];
  await target.dispatchEvent('pointerdown');
  await page.locator('.numpad button').nth(correct - 1).click();
  await expect(target).toHaveText(String(correct));
  // Another number, the same number again, erase and undo all leave it in place.
  await page.locator('.numpad button').nth(wrongDigit(correct) - 1).click();
  await page.locator('.numpad button').nth(correct - 1).click();
  await expect(page.getByRole('button', { name: 'Erase' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  await expect(target).toHaveText(String(correct));
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
