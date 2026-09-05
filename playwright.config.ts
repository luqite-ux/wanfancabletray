import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4173";
const isExternalRun = Boolean(process.env.PLAYWRIGHT_TEST_BASE_URL);
const localeTestBaseURL = "http://127.0.0.1:4174";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: isExternalRun
    ? undefined
    : [{
        command: "npm run start -- --hostname 127.0.0.1 --port 4173",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }, {
        command: "node tests/helpers/locale-test-server.mjs",
        url: localeTestBaseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }],
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /locale-routing\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile-chromium",
      testIgnore: /locale-routing\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    ...(!isExternalRun ? [{
      name: "locale-routing-chromium",
      testMatch: /locale-routing\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: localeTestBaseURL },
    }] : []),
  ],
});
