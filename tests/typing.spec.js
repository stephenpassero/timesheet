const { test, expect } = require('@playwright/test');
const { openApp, field, typeTime } = require('./helpers');

test.beforeEach(({ page }) => openApp(page));

const cases = [
  ['9', '9:'],
  ['930', '9:30'],
  ['1230', '12:30'],
  ['1', '1'],
  ['0', '0'],
  ['13', '1:3'],
  ['09', '09:'],
  ['965', '9:5'],
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
