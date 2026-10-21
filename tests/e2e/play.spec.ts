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

test('hold and drag picks several cells for one pencil mark', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sudoku.settings', JSON.stringify({ multiSelect: true })));
  await start(page);
  await page.getByRole('button', { name: /Pencil/ }).click();
  const open = await page.locator('.cell:not(.given)').evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.cell)));
  const center = async (i: number) => {
    const b = (await page.locator(`[data-cell="${i}"]`).boundingBox())!;
    return [b.x + b.width / 2, b.y + b.height / 2] as const;
  };
  const [a, b, far] = [open[0], open[1], open[open.length - 1]];

  // Hold the first cell, drag to the second, release.
  await page.mouse.move(...(await center(a)));
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.move(...(await center(b)), { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(`[data-cell="${a}"]`)).toHaveClass(/selected/);
  await expect(page.locator(`[data-cell="${b}"]`)).toHaveClass(/selected/);
  await expect(page.locator('.cell.related')).toHaveCount(0);

  // A tap adds a separate cell; tapping it again removes it, a third tap adds it back.
  for (let k = 0; k < 3; k++) await page.mouse.click(...(await center(far)));
  await expect(page.locator(`[data-cell="${far}"]`)).toHaveClass(/selected/);

  await page.locator('.numpad button').nth(2).click();
  for (const i of [a, b, far]) await expect(page.locator(`[data-cell="${i}"] .notes`)).toContainText('3');
  await expect(page.locator('.cell.selected')).toHaveCount(0);

  // One undo takes the mark back from all of them.
  await page.getByRole('button', { name: 'Undo' }).click();
  for (const i of [a, b, far]) await expect(page.locator(`[data-cell="${i}"] .notes`)).toHaveCount(0);

  // Holding alone starts a selection; tapping outside the board clears it.
  await page.mouse.move(...(await center(a)));
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.up();
  await expect(page.locator('.cell.related')).toHaveCount(0);
  await expect(page.locator('.cell.selected')).toHaveCount(1);
  await page.locator('.topbar h1').click();
  await expect(page.locator('.cell.selected')).toHaveCount(0);
});

test('without the setting, dragging keeps a single selection', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: /Pencil/ }).click();
  const box = (await page.locator('.board').boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.move(box.x + box.width - 10, box.y + 10, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.cell.selected')).toHaveCount(1);
});
