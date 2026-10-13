import { expect, test } from '@playwright/test';

test('hints solve the puzzle, show the win screen and update stats', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Hints' }).click();
  await page.getByRole('switch', { name: 'Show mistake counter' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Easy' }).click();
  await expect(page.getByTestId('mistakes')).toHaveAttribute('aria-label', 'Mistakes: 0');

  const empty = await page.locator('.cell:not(.given)').evaluateAll((els) => els.map((e) => e.getAttribute('data-cell')));
  for (const i of empty) {
    await page.locator(`[data-cell="${i}"]`).dispatchEvent('pointerdown');
    await page.getByRole('button', { name: 'Hint' }).click();
  }
  await expect(page.getByRole('dialog', { name: 'Solved!' })).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByRole('button', { name: /Continue/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Statistics' }).click();
  const stat = (label: string) => page.locator('.stat', { hasText: label }).locator('.stat-value');
  await expect(stat('Played')).toHaveText('1');
  await expect(stat('Won')).toHaveText('1');
  await expect(stat('Current streak')).toHaveText('1');
  await expect(stat('Hints used')).toHaveText(String(empty.length));

  await page.getByRole('button', { name: 'Reset statistics' }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(stat('Played')).toHaveText('0');
});

test('auto pencil marks fill empty cells', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Auto pencil marks' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Medium' }).click();
  await page.getByRole('button', { name: 'Notes' }).click();
  const empty = await page.locator('.cell:not(.given)').count();
  await expect(page.locator('.cell .notes')).toHaveCount(empty);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.cell .notes')).toHaveCount(0);
});

test('Spanish follows the device language', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-MX' });
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Fácil' })).toBeVisible();
  await page.getByRole('button', { name: 'Ajustes' }).click();
  await expect(page.getByText('Mostrar errores')).toBeVisible();
  await context.close();
});
