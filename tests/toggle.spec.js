const { test, expect } = require('@playwright/test');
const { MON, TUE, openApp, day, field, toggle, entries, typeTime } = require('./helpers');

test.beforeEach(({ page }) => openApp(page));

test('defaults to PM', async ({ page }) => {
  await expect(toggle(page, 'in')).toHaveText('PM');
  await expect(toggle(page, 'out')).toHaveText('PM');
});

test('first tap works while the input is still focused', async ({ page }) => {
  // given
  await typeTime(page, 'in', '845');

  // when
  await toggle(page, 'in').tap();

  // then
  await expect(toggle(page, 'in')).toHaveText('AM');
  expect(await entries(page)).toEqual({ [MON]: { in: '08:45' } });
});

test('flips back and forth and re-saves each time', async ({ page }) => {
  // given
  await typeTime(page, 'in', '845');
  await field(page, 'in').blur();

  // when / then
  await toggle(page, 'in').tap();
  expect((await entries(page))[MON].in).toBe('08:45');
  await toggle(page, 'in').tap();
  expect((await entries(page))[MON].in).toBe('20:45');
});

test('flipping an empty field changes the label only', async ({ page }) => {
  // when
  await toggle(page, 'out').tap();

  // then
  await expect(toggle(page, 'out')).toHaveText('AM');
  expect(await entries(page)).toEqual({});
});

test('"Same as" copies times and AM/PM to the next day', async ({ page }) => {
  // given
  await openApp(page, { entries: { [MON]: { in: '08:00', out: '16:30', brk: '30' } } });

  // when
  await day(page, 1).getByRole('button', { name: 'Same as Mon' }).tap();

  // then
  await expect(field(page, 'in', 1)).toHaveValue('8:00');
  await expect(toggle(page, 'in', 1)).toHaveText('AM');
  await expect(field(page, 'out', 1)).toHaveValue('4:30');
  await expect(toggle(page, 'out', 1)).toHaveText('PM');
  expect((await entries(page))[TUE]).toEqual({ in: '08:00', out: '16:30', brk: '30' });
});

test('"Clear day" blanks the fields and resets AM/PM to PM', async ({ page }) => {
  // given
  await openApp(page, { entries: { [MON]: { in: '08:00', out: '09:30', brk: '15' } } });

  // when
  await day(page).getByRole('button', { name: 'Clear day' }).tap();

  // then
  await expect(field(page, 'in')).toHaveValue('');
  await expect(toggle(page, 'in')).toHaveText('PM');
  await expect(field(page, 'brk')).toHaveValue('');
  expect(await entries(page)).toEqual({});
});
