import { defineConfig, devices } from "@playwright/test";
import { wavPath } from "./tests/e2e/fixtures";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/fixtures.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}/Glockenspiel/`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    // Grant the microphone without a prompt; the fake capture device plays silence (see fixtures.ts).
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-audio-capture=${wavPath("silence")}`,
      ],
    },
  },
  // Test the production build, served under the same base path as GitHub Pages.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/Glockenspiel/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
