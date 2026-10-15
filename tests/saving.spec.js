const { test, expect } = require('@playwright/test');
const { MON, TUE, openApp, field, toggle, entries, typeTime } = require('./helpers');

test.beforeEach(({ page }) => openApp(page));

const conversions = [
  ['930', 'PM', '21:30'],
  ['930', 'AM', '09:30'],
  ['1200', 'AM', '00:00'],
  ['1200', 'PM', '12:00'],
  ['1230', 'AM', '00:30']
];

for (const [keys, period, stored] of conversions) {
  test(`${keys} ${period} is stored as ${stored}`, async ({ page }) => {
    // given
    if (period === 'AM') await toggle(page, 'in').tap();

    // when
    await typeTime(page, 'in', keys);

    // then
    expect(await entries(page)).toEqual({ [MON]: { in: stored } });
  });
}

test('saves as soon as the time is complete, without leaving the field', async ({ page }) => {
  // when
  await typeTime(page, 'in', '845');

  // then
  await expect(field(page, 'in')).toBeFocused();
  expect(await entries(page)).toEqual({ [MON]: { in: '20:45' } });
});

test('an hour alone is saved as :00 on blur', async ({ page }) => {
  // given
  await typeTime(page, 'in', '9');

  // when
  await field(page, 'in').blur();

  // then
  await expect(field(page, 'in')).toHaveValue('9:00');
  expect(await entries(page)).toEqual({ [MON]: { in: '21:00' } });
});

for (const [label, keys] of [['hour 0', '00'], ['hour 00:30', '0030'], ['single-digit minutes', '93']]) {
  test(`invalid time (${label}) reverts on blur and saves nothing`, async ({ page }) => {
    // given
    await typeTime(page, 'in', keys);

    // when
    await field(page, 'in').blur();

    // then
    await expect(field(page, 'in')).toHaveValue('');
    expect(await entries(page)).toEqual({});
  });
}

test('invalid edit reverts to the previously saved time', async ({ page }) => {
  // given
  await typeTime(page, 'in', '930');
  await field(page, 'in').blur();

  // when
  await field(page, 'in').fill('');
  await page.keyboard.type('93');
  await field(page, 'in').blur();

  // then
  await expect(field(page, 'in')).toHaveValue('9:30');
  expect(await entries(page)).toEqual({ [MON]: { in: '21:30' } });
});

test('clearing the text removes the time, deletes the empty day and resets to PM', async ({ page }) => {
  // given
  await toggle(page, 'in').tap();
  await typeTime(page, 'in', '930');
  await field(page, 'in').blur();

  // when
  await field(page, 'in').fill('');
  await field(page, 'in').blur();

  // then
  expect(await entries(page)).toEqual({});
  await expect(toggle(page, 'in')).toHaveText('PM');
});

test('time and AM/PM survive a reload', async ({ page }) => {
  // given
  await typeTime(page, 'in', '845');
  await toggle(page, 'in').tap();

  // when
  await page.reload();

  // then
  await expect(field(page, 'in')).toHaveValue('8:45');
  await expect(toggle(page, 'in')).toHaveText('AM');
});

test('stored 24-hour values display as 12-hour with AM/PM', async ({ page }) => {
  // given
  await openApp(page, { entries: { [MON]: { in: '17:15', out: '00:00' }, [TUE]: { in: '12:00' } } });

  // then
  await expect(field(page, 'in')).toHaveValue('5:15');
  await expect(toggle(page, 'in')).toHaveText('PM');
  await expect(field(page, 'out')).toHaveValue('12:00');
  await expect(toggle(page, 'out')).toHaveText('AM');
  await expect(field(page, 'in', 1)).toHaveValue('12:00');
  await expect(toggle(page, 'in', 1)).toHaveText('PM');
});
