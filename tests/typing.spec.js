const { test, expect } = require('@playwright/test');
const { MON, openApp, field, typeTime, entries } = require('./helpers');

test.beforeEach(({ page }) => openApp(page));

const cases = [
  ['9', '9'],
  ['93', '9:3'],
  ['930', '9:30'],
  ['1230', '12:30'],
  ['1', '1'],
  ['0', '0'],
  ['10', '10'],
  ['11', '11'],
  ['12', '12'],
  ['105', '1:05'],
  ['115', '1:15'],
  ['125', '1:25'],
  ['1050', '10:50'],
  ['1105', '11:05'],
  ['13', '1:3'],
  ['09', '09:'],
  ['096', '09:'],
  ['965', '9:5'],
  ['96', '9:'],
  ['12345', '12:34'],
  ['a9b3', '9:3']
];

for (const [keys, shown] of cases) {
  test(`typing "${keys}" shows "${shown}"`, async ({ page }) => {
    // when
    await typeTime(page, 'in', keys);

    // then
    await expect(field(page, 'in')).toHaveValue(shown);
  });
}

test('backspace removes digits and the colon does not get stuck', async ({ page }) => {
  // given
  await typeTime(page, 'in', '930');

  // when / then
  await page.keyboard.press('Backspace');
  await expect(field(page, 'in')).toHaveValue('9:3');
  await page.keyboard.press('Backspace');
  await expect(field(page, 'in')).toHaveValue('9');
  await page.keyboard.press('Backspace');
  await expect(field(page, 'in')).toHaveValue('');
});

test('1:05 can be typed as 105, and growing to 1050 becomes 10:50', async ({ page }) => {
  // when
  await typeTime(page, 'in', '105');

  // then
  await expect(field(page, 'in')).toHaveValue('1:05');

  // when
  await page.keyboard.type('0');

  // then
  await expect(field(page, 'in')).toHaveValue('10:50');
});

test('backspace from 1:05 returns to 10 without a colon', async ({ page }) => {
  // given
  await typeTime(page, 'in', '105');

  // when
  await page.keyboard.press('Backspace');

  // then
  await expect(field(page, 'in')).toHaveValue('10');
});

test('typing 105 saves 1:05 PM', async ({ page }) => {
  // when
  await typeTime(page, 'in', '105');
  await field(page, 'out').tap();

  // then
  expect((await entries(page))[MON].in).toBe('13:05');
});
