import { defineConfig, devices } from "@playwright/test";

const PORT = 4174;

// Tests the gh-pages layout: live site and a pull-request preview below it on the same origin.
export default defineConfig({
  testDir: "tests/e2e-preview",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report-preview" }]]
    : "list",
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
  },
  webServer: {
    command: `scripts/build-pages-site.sh && node scripts/serve-static.mjs .site ${PORT}`,
    url: `http://localhost:${PORT}/Glockenspiel/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
