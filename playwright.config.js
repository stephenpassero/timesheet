const { defineConfig, devices } = require('@playwright/test');

// WebKit with an iPhone profile: the closest thing to iOS Safari we can run headlessly
module.exports = defineConfig({
  testDir: 'tests',
  use: {
    ...devices['iPhone 15'],
    locale: 'en-US',
    baseURL: 'http://localhost:4173',
    serviceWorkers: 'block'
  },
  webServer: {
    command: 'python3 -m http.server 4173 2>/dev/null',
    url: 'http://localhost:4173',
    reuseExistingServer: true
  }
});
