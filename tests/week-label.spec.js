const { test, expect } = require('@playwright/test');
const { openApp } = require('./helpers');

const pill = (page) => page.locator('#todayBtn');
const next = (page, n = 1) => (async () => { for (let i = 0; i < n; i++) await page.locator('#next').tap(); })();
const prev = (page, n = 1) => (async () => { for (let i = 0; i < n; i++) await page.locator('#prev').tap(); })();

test('current week shows no pill', async ({ page }) => {
  await openApp(page);
  await expect(pill(page)).toBeHidden();
});

const labels = [
  ['next', 1, 'Next week'],
  ['next', 2, 'In 2 weeks'],
  ['prev', 1, 'Last week'],
  ['prev', 3, '3 weeks ago']
];

for (const [dir, n, label] of labels) {
  test(`${n} week(s) ${dir === 'next' ? 'ahead' : 'back'} reads "${label}"`, async ({ page }) => {
    // given
    await openApp(page);

    // when
    await (dir === 'next' ? next(page, n) : prev(page, n));

    // then
    await expect(pill(page)).toHaveText(label);
  });
}

test('tapping the pill returns to this week and hides it', async ({ page }) => {
  // given
  await openApp(page);
  await next(page, 3);

  // when
  await pill(page).tap();

  // then
  await expect(page.locator('#range')).toHaveText('Oct 12 – 18');
  await expect(pill(page)).toBeHidden();
});

test('labels also work with a Sunday week start', async ({ page }) => {
  // given
  await openApp(page, { weekStart: 0 });
  await expect(pill(page)).toBeHidden();

  // when
  await next(page);

  // then
  await expect(pill(page)).toHaveText('Next week');
});

test.describe('across the US daylight saving change', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('week labels stay whole numbers', async ({ page }) => {
    // given: week of Oct 26 - Nov 1, DST ends Sunday Nov 1 2026
    await openApp(page, { now: '2026-10-28T10:00:00-04:00' });

    // when / then
    await next(page);
    await expect(pill(page)).toHaveText('Next week');
    await next(page);
    await expect(pill(page)).toHaveText('In 2 weeks');
    await prev(page, 2);
    await expect(pill(page)).toBeHidden();
  });

  test('spring forward does not skew the label either', async ({ page }) => {
    // given: week of Mar 2 - 8, DST starts Sunday Mar 8 2026
    await openApp(page, { now: '2026-03-04T10:00:00-05:00' });

    // when
    await next(page);

    // then
    await expect(pill(page)).toHaveText('Next week');
  });
});
