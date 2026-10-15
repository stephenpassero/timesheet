const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'allow' });

test('manifest is installable and its icons exist', async ({ page, request }) => {
  // given
  await page.goto('/');

  // then
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await request.get(href)).json();
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status()).toBe(200);
  const touch = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await request.get(touch)).status()).toBe(200);
});

test('service worker registers', async ({ page }) => {
  await page.goto('/');
  const active = await page.evaluate(async () => !!(await navigator.serviceWorker.ready).active);
  expect(active).toBe(true);
});

// Playwright's WebKit cannot reload offline with a service worker active, so check what offline needs: the precache
test('app shell is precached for offline use', async ({ page }) => {
  // given
  await page.goto('/');

  // when
  await page.evaluate(() => navigator.serviceWorker.ready);

  // then
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('timesheet-v1');
    return (await cache.keys()).map((r) => new URL(r.url).pathname);
  });
  expect(cached).toEqual(expect.arrayContaining(['/index.html', '/manifest.webmanifest', '/icon-192.png']));
});
