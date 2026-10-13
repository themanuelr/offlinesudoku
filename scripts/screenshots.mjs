// Screenshots of the game screen on several devices, and a check for page overflow.
// Run against `npm run preview`: CHROMIUM_PATH=... node scripts/screenshots.mjs <out-dir>
import { chromium, devices } from '@playwright/test';
const SP = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
for (const [name, dev] of [['se', devices['iPhone SE']], ['phoneland', devices['Pixel 7 landscape']], ['seland', devices['iPhone SE landscape']], ['ipadport', devices['iPad (gen 7)']], ['ipadland', devices['iPad (gen 7) landscape']], ['small', { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['desktop', { viewport: { width: 1280, height: 800 } }]]) {
  const { defaultBrowserType, ...d } = dev;
  const p = await (await b.newContext({ ...d })).newPage();
  await p.goto('http://localhost:4173/offlinesudoku/');
  await p.evaluate(() => localStorage.setItem('sudoku.settings', JSON.stringify({ hints: true, autoNotes: true, showMistakes: true })));
  await p.reload();
  await p.getByRole('button', { name: 'Expert' }).click();
  await p.locator('[data-cell="0"]').dispatchEvent('pointerdown');
  await p.waitForTimeout(400);
  const overflow = await p.evaluate(() => [document.documentElement.scrollWidth > innerWidth, document.documentElement.scrollHeight > innerHeight]);
  console.log(name, 'overflow x,y', overflow);
  await p.screenshot({ path: `${SP}/d-${name}.png` });
}
await b.close();
