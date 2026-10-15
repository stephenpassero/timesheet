const { test, expect } = require('@playwright/test');
const { SUN, MON, TUE, openApp, day, field, toggle, entries, typeTime } = require('./helpers');

const total = (page, i = 0) => day(page, i).locator('.dt .h');
const note = (page, i = 0) => day(page, i).locator('.note');

test('9:00 AM to 5:00 PM with a 30 min break is 7h 30m', async ({ page }) => {
  // given
  await openApp(page, { entries: { [MON]: { in: '09:00', out: '17:00', brk: '30' } } });

  // then
  await expect(total(page)).toHaveText('7h 30m');
  await expect(day(page).locator('.dt .d')).toHaveText('7.50 h');
  await expect(page.locator('#wkTotal')).toHaveText('7h 30m');
});

test('overnight shift counts to the next day and says so', async ({ page }) => {
  // given
  await openApp(page, { entries: { [MON]: { in: '22:00', out: '06:00' } } });

  // then
  await expect(total(page)).toHaveText('8h 00m');
  await expect(note(page)).toHaveText('Overnight: clock-out is the next day.');
});

test('clock-out without clock-in warns', async ({ page }) => {
  await openApp(page, { entries: { [MON]: { out: '17:00' } } });
  await expect(note(page)).toHaveText('No clock-in time.');
});

test('clock-in without clock-out warns', async ({ page }) => {
  await openApp(page, { entries: { [MON]: { in: '09:00' } } });
  await expect(note(page)).toHaveText('No clock-out time.');
});

test('break longer than the shift warns and counts as zero', async ({ page }) => {
  // given
  await openApp(page, { entries: { [MON]: { in: '09:00', out: '09:30', brk: '45' } } });

  // then
  await expect(note(page)).toHaveText('Break is longer than the shift.');
  await expect(total(page)).toHaveText('0h 00m');
});

test('week total sums the days', async ({ page }) => {
  // given
  await openApp(page, { entries: { [MON]: { in: '09:00', out: '17:00' }, [TUE]: { in: '09:00', out: '13:00' } } });

  // then
  await expect(page.locator('#wkTotal')).toHaveText('12h 00m');
  await expect(page.locator('#wkDec')).toHaveText('12.00 hours total');
});

test('week total updates live while typing', async ({ page }) => {
  // given
  await openApp(page);
  await toggle(page, 'in').tap();

  // when
  await typeTime(page, 'in', '900');
  await typeTime(page, 'out', '500');

  // then
  await expect(page.locator('#wkTotal')).toHaveText('8h 00m');
});

test('break minutes are saved, and 0 clears the break', async ({ page }) => {
  // given
  await openApp(page);

  // when / then
  await field(page, 'brk').tap();
  await page.keyboard.type('45');
  expect(await entries(page)).toEqual({ [MON]: { brk: '45' } });
  await field(page, 'brk').fill('0');
  expect(await entries(page)).toEqual({});
});

test('week start Sunday regroups the week and persists', async ({ page }) => {
  // given
  await openApp(page, { entries: { [SUN]: { in: '09:00', out: '17:00' } } });
  await expect(page.locator('#range')).toHaveText('Oct 12 – 18');

  // when
  await page.locator('#wsSun').tap();

  // then
  await expect(page.locator('#range')).toHaveText('Oct 11 – 17');
  await expect(day(page).locator('.dn b')).toHaveText('Sunday');
  await expect(page.locator('#wkTotal')).toHaveText('8h 00m');
  await page.reload();
  await expect(page.locator('#range')).toHaveText('Oct 11 – 17');
});
