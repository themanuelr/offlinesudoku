import { expect, test } from '@playwright/test';
import { firstOpenCell, solution, wrongDigit } from './helpers';

test('autosaves, resumes after reload, and confirms before replacing a game', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Easy' }).click();
  const index = await firstOpenCell(page);
  const wrong = wrongDigit((await solution(page))[index]);
  await page.locator(`[data-cell="${index}"]`).dispatchEvent('pointerdown');
  await page.locator('.numpad button').nth(wrong - 1).click();
  await page.reload();
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.locator(`[data-cell="${index}"]`)).toHaveText(String(wrong));
  // Undo history survives the reload too.
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Hard' }).click();
  await expect(page.getByRole('dialog')).toContainText('Start a new game?');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: /Continue/ })).toContainText('Easy');
  await page.getByRole('button', { name: 'Hard' }).click();
  await page.getByRole('button', { name: 'Start new game' }).click();
  await expect(page.getByRole('heading', { name: 'Hard' })).toBeVisible();
});

test('timer runs during play and stops while paused or behind settings', async ({ page }) => {
  // Freeze time so only runFor advances the clock, however slow the machine is.
  await page.clock.install({ time: new Date('2026-01-01T00:00:00') });
  await page.goto('./');
  await page.clock.pauseAt(new Date('2026-01-01T00:00:05'));
  await page.getByRole('button', { name: 'Easy' }).click();
  const timer = page.getByTestId('timer');
  await page.clock.runFor(3100);
  await expect(timer).toHaveText('0:03');

  await page.getByRole('button', { name: 'Pause' }).click();
  await page.clock.runFor(5000);
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(timer).toHaveText('0:03');

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.clock.runFor(5000);
  await page.getByRole('switch', { name: 'Show timer' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(timer).toHaveCount(0);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.clock.runFor(50); // let the paused frame render
  await expect(page.locator('.pause-time')).toHaveText('0:03');
});
