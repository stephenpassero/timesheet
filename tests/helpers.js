// Fixed "today" is Wednesday 2026-10-14, so the visible week is Mon Oct 12 - Sun Oct 18.
const KEY = 'timesheet:v1';
const SUN = '2026-10-11';
const MON = '2026-10-12';
const TUE = '2026-10-13';

async function openApp(page, { now = '2026-10-14T10:00:00', entries, weekStart } = {}) {
  await page.clock.setFixedTime(new Date(now));
  await page.goto('/');
  if (entries || weekStart !== undefined) {
    await page.evaluate(([key, e, w]) => {
      localStorage.setItem(key, JSON.stringify({ entries: e || {}, weekStart: w === undefined ? 1 : w }));
    }, [KEY, entries, weekStart]);
    await page.reload();
  }
}

const day = (page, i = 0) => page.locator('.day').nth(i);
const field = (page, f, i = 0) => day(page, i).locator(`input[data-f="${f}"]`);
const toggle = (page, f, i = 0) => field(page, f, i).locator('..').locator('.ampm');
const entries = (page) => page.evaluate(
  (key) => (JSON.parse(localStorage.getItem(key) || '{}').entries) || {}, KEY
);

async function typeTime(page, f, digits, i = 0) {
  await field(page, f, i).tap();
  await page.keyboard.type(digits);
}

module.exports = { SUN, MON, TUE, openApp, day, field, toggle, entries, typeTime };
