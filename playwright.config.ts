import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
// E2E_BASE_URL runs the suite against a deployment (e.g. production) instead of out/.
const remote = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  fullyParallel: true,
  // Software-rendered WebGL tests can starve timing-based tests on a loaded machine; a
  // retry surfaces those as "flaky" in the report instead of hiding them.
  retries: 1,
  reporter: [["list"]],
  use: { baseURL: remote ?? `http://127.0.0.1:${PORT}` },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: remote
    ? undefined
    : {
        command: `node scripts/serve-out.mjs ${PORT}`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI,
      },
});
