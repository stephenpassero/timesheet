const { test, expect } = require('@playwright/test');
const { openApp, field, toggle, typeTime } = require('./helpers');

test.beforeEach(({ page }) => openApp(page));

for (const width of [320, 390]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    // given
    await page.setViewportSize({ width, height: 800 });

    // then
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('inputs are at least 16px so iOS does not zoom on focus', async ({ page }) => {
  const sizes = await page.locator('input[data-f]').evaluateAll(
    (els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize))
  );
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
});

test('time and break inputs request the numeric keypad', async ({ page }) => {
  for (const f of ['in', 'out', 'brk']) {
    await expect(field(page, f)).toHaveAttribute('inputmode', 'numeric');
  }
});

test('numbers are centered in the fields', async ({ page }) => {
  for (const f of ['in', 'out', 'brk']) {
    await expect(field(page, f)).toHaveCSS('text-align', 'center');
  }
});

test('In, Out and Break boxes are the same height', async ({ page }) => {
  const heights = await page.locator('.day').first().locator('.tf, input[data-f="brk"]').evaluateAll(
    (els) => els.map((e) => Math.round(e.getBoundingClientRect().height))
  );
  expect(new Set(heights).size).toBe(1);
});

test('AM/PM toggle is at least 44x44', async ({ page }) => {
  const box = await toggle(page, 'in').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test('a full time like 12:30 fits beside AM/PM at 320px', async ({ page }) => {
  // given
  await page.setViewportSize({ width: 320, height: 800 });

  // when
  await typeTime(page, 'in', '1230');

  // then
  const { scrollWidth, clientWidth } = await field(page, 'in').evaluate(e => ({ scrollWidth: e.scrollWidth, clientWidth: e.clientWidth }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
