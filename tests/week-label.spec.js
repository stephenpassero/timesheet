const { test, expect } = require('@playwright/test');
const { MON, openApp, field, typeTime } = require('./helpers');

const pill = (page) => page.locator('#todayBtn');
const nextBtn = (page) => page.locator('#next');
const range = (page) => page.locator('#range');
const prev = async (page, n = 1) => { for (let i = 0; i < n; i++) await page.locator('#prev').tap(); };

test('current week shows a "Current week" pill that is not a button you can press', async ({ page }) => {
  await openApp(page);
  await expect(pill(page)).toHaveText('Current week');
  await expect(pill(page)).toBeDisabled();
});

test('the next arrow is disabled on the current week', async ({ page }) => {
  await openApp(page);
  await expect(nextBtn(page)).toBeDisabled();
});

test('tapping the disabled next arrow does not leave the current week', async ({ page }) => {
  // given
  await openApp(page);

  // when
  await nextBtn(page).dispatchEvent('click');

  // then
  await expect(range(page)).toHaveText('Oct 12 – 18');
  await expect(pill(page)).toHaveText('Current week');
});

const labels = [
  [1, 'Last week'],
  [2, '2 weeks ago'],
  [3, '3 weeks ago'],
  [20, '20 weeks ago']
];

for (const [n, label] of labels) {
  test(`${n} week(s) back reads "${label}"`, async ({ page }) => {
    // given
    await openApp(page);

    // when
    await prev(page, n);

    // then
    await expect(pill(page)).toHaveText(label);
    await expect(pill(page)).toBeEnabled();
  });
}

test('browsing back enables the next arrow, and forward stops at the current week', async ({ page }) => {
  // given
  await openApp(page);
  await prev(page, 2);
  await expect(nextBtn(page)).toBeEnabled();

  // when
  await nextBtn(page).tap();
  await nextBtn(page).tap();

  // then
  await expect(pill(page)).toHaveText('Current week');
  await expect(nextBtn(page)).toBeDisabled();
  await expect(range(page)).toHaveText('Oct 12 – 18');
});

test('past weeks show their saved entries', async ({ page }) => {
  // given: Mon Oct 5 has hours saved
  await openApp(page, { entries: { '2026-10-05': { in: '09:00', out: '17:00', brk: '0' } } });

  // when
  await prev(page);

  // then
  await expect(range(page)).toHaveText('Oct 5 – 11');
  await expect(field(page, 'in')).toHaveValue('9:00');
});

test('editing a past week saves to that week', async ({ page }) => {
  // given
  await openApp(page);
  await prev(page);

  // when
  await typeTime(page, 'in', '830');
  await field(page, 'out').tap();

  // then
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('timesheet:v1')).entries);
  expect(saved['2026-10-05'].in).toBe('20:30');
  expect(saved[MON]).toBeUndefined();
});

test('tapping the pill from a past week returns to the current week', async ({ page }) => {
  // given
  await openApp(page);
  await prev(page, 3);

  // when
  await pill(page).tap();

  // then
  await expect(range(page)).toHaveText('Oct 12 – 18');
  await expect(pill(page)).toHaveText('Current week');
  await expect(nextBtn(page)).toBeDisabled();
});

test('a Sunday week start also stops at the current week', async ({ page }) => {
  // given: Wed Oct 14 is in the week Oct 11 - 17
  await openApp(page, { weekStart: 0 });

  // then
  await expect(range(page)).toHaveText('Oct 11 – 17');
  await expect(pill(page)).toHaveText('Current week');
  await expect(nextBtn(page)).toBeDisabled();

  // when
  await prev(page);

  // then
  await expect(pill(page)).toHaveText('Last week');
  await expect(nextBtn(page)).toBeEnabled();
});

test('switching the week start while in a past week never lands on a future week', async ({ page }) => {
  // given
  await openApp(page);
  await prev(page);

  // when
  await page.locator('#wsSun').tap();
  await nextBtn(page).tap();
  await nextBtn(page).dispatchEvent('click');

  // then
  await expect(range(page)).toHaveText('Oct 11 – 17');
  await expect(nextBtn(page)).toBeDisabled();
});

test.describe('across the US daylight saving change', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('week labels stay whole numbers (fall back)', async ({ page }) => {
    // given: week of Oct 26 - Nov 1, DST ends Sunday Nov 1 2026
    await openApp(page, { now: '2026-11-04T10:00:00-05:00' });

    // when
    await prev(page);

    // then: Oct 26 - Nov 1 straddles the change
    await expect(range(page)).toHaveText('Oct 26 – Nov 1');
    await expect(pill(page)).toHaveText('Last week');
    await nextBtn(page).tap();
    await expect(pill(page)).toHaveText('Current week');
    await expect(nextBtn(page)).toBeDisabled();
  });

  test('week labels stay whole numbers (spring forward)', async ({ page }) => {
    // given: DST starts Sunday Mar 8 2026
    await openApp(page, { now: '2026-03-11T10:00:00-04:00' });

    // when
    await prev(page);

    // then
    await expect(range(page)).toHaveText('Mar 2 – 8');
    await expect(pill(page)).toHaveText('Last week');
    await nextBtn(page).tap();
    await expect(pill(page)).toHaveText('Current week');
  });
});
